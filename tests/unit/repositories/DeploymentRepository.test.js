'use strict';

const DeploymentRepository = require('../../../src/repositories/DeploymentRepository');
const { getDatabase } = require('../../../tests/helpers/database');

describe('DeploymentRepository', () => {
  let deploymentRepository;
  let mockDb;
  let testUser;

  beforeEach(async () => {
    mockDb = getDatabase();
    deploymentRepository = new DeploymentRepository(mockDb);
    
    // Create a test user for deployment tests
    const result = await mockDb.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      ['test@example.com', 'hashed_password', 'Test User']
    );
    testUser = { id: result.lastID };
  });

  describe('create', () => {
    it('should create a deployment with valid data', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production',
        config: { memory: '512MB', cpu: '1' }
      };

      const result = await deploymentRepository.create(deploymentData);

      expect(result.id).toBeDefined();
      expect(result.user_id).toBe(deploymentData.user_id);
      expect(result.project_name).toBe(deploymentData.project_name);
      expect(result.environment).toBe(deploymentData.environment);
      expect(result.status).toBe('pending');
    });

    it('should create deployment without config', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'staging'
      };

      const result = await deploymentRepository.create(deploymentData);

      expect(result.config).toBeNull();
    });

    it('should store config as JSON string', async () => {
      const config = { memory: '512MB', cpu: '1', region: 'us-east-1' };
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production',
        config
      };

      await deploymentRepository.create(deploymentData);

      // Verify config is stored as JSON string in database
      const row = await new Promise((resolve, reject) => {
        mockDb.get(
          'SELECT config FROM deployments WHERE user_id = ?',
          [testUser.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      expect(typeof row.config).toBe('string');
      expect(JSON.parse(row.config)).toEqual(config);
    });
  });

  describe('findById', () => {
    it('should return deployment when found', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentRepository.create(deploymentData);
      const foundDeployment = await deploymentRepository.findById(createdDeployment.id);

      expect(foundDeployment).toBeDefined();
      expect(foundDeployment.id).toBe(createdDeployment.id);
      expect(foundDeployment.project_name).toBe(deploymentData.project_name);
      expect(foundDeployment.environment).toBe(deploymentData.environment);
    });

    it('should return null when deployment not found', async () => {
      const foundDeployment = await deploymentRepository.findById(99999);
      expect(foundDeployment).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return deployments for user', async () => {
      // Create multiple deployments for the test user
      const deployments = [];
      for (let i = 1; i <= 3; i++) {
        const deploymentData = {
          user_id: testUser.id,
          project_name: `project-${i}`,
          environment: 'production'
        };
        deployments.push(await deploymentRepository.create(deploymentData));
      }

      const foundDeployments = await deploymentRepository.findByUserId(testUser.id);

      expect(foundDeployments).toHaveLength(3);
      foundDeployments.forEach((deployment, index) => {
        expect(deployment.user_id).toBe(testUser.id);
        expect(deployment.project_name).toBe(`project-${index + 1}`);
      });
    });

    it('should return empty array for user with no deployments', async () => {
      const deployments = await deploymentRepository.findByUserId(testUser.id);
      expect(deployments).toHaveLength(0);
    });

    it('should respect limit and offset', async () => {
      // Create 5 deployments
      for (let i = 1; i <= 5; i++) {
        await deploymentRepository.create({
          user_id: testUser.id,
          project_name: `project-${i}`,
          environment: 'production'
        });
      }

      const firstPage = await deploymentRepository.findByUserId(testUser.id, 2, 0);
      const secondPage = await deploymentRepository.findByUserId(testUser.id, 2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].project_name).not.toBe(secondPage[0].project_name);
    });
  });

  describe('findByStatus', () => {
    it('should return deployments by status', async () => {
      // Create deployments
      const deployment1 = await deploymentRepository.create({
        user_id: testUser.id,
        project_name: 'project-1',
        environment: 'production'
      });

      const deployment2 = await deploymentRepository.create({
        user_id: testUser.id,
        project_name: 'project-2',
        environment: 'production'
      });

      // Update one deployment status
      await deploymentRepository.update(deployment1.id, { status: 'running' });

      const pendingDeployments = await deploymentRepository.findByStatus('pending');
      const runningDeployments = await deploymentRepository.findByStatus('running');

      expect(pendingDeployments).toHaveLength(1);
      expect(pendingDeployments[0].id).toBe(deployment2.id);

      expect(runningDeployments).toHaveLength(1);
      expect(runningDeployments[0].id).toBe(deployment1.id);
    });

    it('should return empty array for status with no deployments', async () => {
      const deployments = await deploymentRepository.findByStatus('running');
      expect(deployments).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update deployment status', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentRepository.create(deploymentData);
      const result = await deploymentRepository.update(createdDeployment.id, { status: 'running' });

      expect(result.changes).toBe(1);

      const updatedDeployment = await deploymentRepository.findById(createdDeployment.id);
      expect(updatedDeployment.status).toBe('running');
    });

    it('should update deployment config', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentRepository.create(deploymentData);
      const newConfig = { memory: '1GB', cpu: '2' };
      const result = await deploymentRepository.update(createdDeployment.id, { config: newConfig });

      expect(result.changes).toBe(1);

      const updatedDeployment = await deploymentRepository.findById(createdDeployment.id);
      expect(updatedDeployment.config).toEqual(newConfig);
    });

    it('should update both status and config', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentRepository.create(deploymentData);
      const newConfig = { memory: '1GB', cpu: '2' };
      const result = await deploymentRepository.update(createdDeployment.id, { 
        status: 'successful', 
        config: newConfig 
      });

      expect(result.changes).toBe(1);

      const updatedDeployment = await deploymentRepository.findById(createdDeployment.id);
      expect(updatedDeployment.status).toBe('successful');
      expect(updatedDeployment.config).toEqual(newConfig);
    });

    it('should return 0 changes when deployment not found', async () => {
      const result = await deploymentRepository.update(99999, { status: 'running' });
      expect(result.changes).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete deployment successfully', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentRepository.create(deploymentData);
      const result = await deploymentRepository.delete(createdDeployment.id);

      expect(result.changes).toBe(1);

      const deletedDeployment = await deploymentRepository.findById(createdDeployment.id);
      expect(deletedDeployment).toBeNull();
    });

    it('should return 0 changes when deployment not found', async () => {
      const result = await deploymentRepository.delete(99999);
      expect(result.changes).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated deployments', async () => {
      // Create multiple deployments
      const deployments = [];
      for (let i = 1; i <= 5; i++) {
        const deploymentData = {
          user_id: testUser.id,
          project_name: `project-${i}`,
          environment: 'production'
        };
        deployments.push(await deploymentRepository.create(deploymentData));
      }

      const foundDeployments = await deploymentRepository.findAll(3, 0);

      expect(foundDeployments).toHaveLength(3);
      foundDeployments.forEach(deployment => {
        expect(deployment.project_name).toMatch(/project-\d+/);
      });
    });

    it('should return empty array when no deployments exist', async () => {
      const deployments = await deploymentRepository.findAll(10, 0);
      expect(deployments).toHaveLength(0);
    });

    it('should respect limit and offset', async () => {
      // Create deployments
      for (let i = 1; i <= 5; i++) {
        await deploymentRepository.create({
          user_id: testUser.id,
          project_name: `project-${i}`,
          environment: 'production'
        });
      }

      const firstPage = await deploymentRepository.findAll(2, 0);
      const secondPage = await deploymentRepository.findAll(2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].project_name).not.toBe(secondPage[0].project_name);
    });
  });

  describe('count', () => {
    it('should return correct deployment count', async () => {
      const initialCount = await deploymentRepository.count();
      expect(typeof initialCount).toBe('number');

      // Create deployments
      await deploymentRepository.create({
        user_id: testUser.id,
        project_name: 'project-1',
        environment: 'production'
      });

      await deploymentRepository.create({
        user_id: testUser.id,
        project_name: 'project-2',
        environment: 'staging'
      });

      const newCount = await deploymentRepository.count();
      expect(newCount).toBe(initialCount + 2);
    });
  });

  describe('countByStatus', () => {
    it('should return correct count by status', async () => {
      // Create deployments
      const deployment1 = await deploymentRepository.create({
        user_id: testUser.id,
        project_name: 'project-1',
        environment: 'production'
      });

      const deployment2 = await deploymentRepository.create({
        user_id: testUser.id,
        project_name: 'project-2',
        environment: 'production'
      });

      // Update one deployment status
      await deploymentRepository.update(deployment1.id, { status: 'running' });

      const pendingCount = await deploymentRepository.countByStatus('pending');
      const runningCount = await deploymentRepository.countByStatus('running');

      expect(pendingCount).toBe(1);
      expect(runningCount).toBe(1);
    });

    it('should return 0 for status with no deployments', async () => {
      const count = await deploymentRepository.countByStatus('running');
      expect(count).toBe(0);
    });
  });
});