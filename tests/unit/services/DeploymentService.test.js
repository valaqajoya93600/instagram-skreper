'use strict';

const DeploymentService = require('../../../src/services/DeploymentService');
const Deployment = require('../../../src/models/Deployment');
const { getDatabase } = require('../../../tests/helpers/database');

describe('DeploymentService', () => {
  let deploymentService;
  let mockDb;
  let testUser;

  beforeEach(async () => {
    mockDb = getDatabase();
    deploymentService = new DeploymentService(mockDb);
    
    // Create a test user for deployment tests
    testUser = await deploymentService.userRepository.create({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      name: 'Test User'
    });
  });

  describe('createDeployment', () => {
    it('should create a deployment with valid data', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production',
        config: { memory: '512MB', cpu: '1' }
      };

      const result = await deploymentService.createDeployment(deploymentData);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(deploymentData.user_id);
      expect(result.project_name).toBe(deploymentData.project_name);
      expect(result.environment).toBe(deploymentData.environment);
      expect(result.status).toBe('pending');
      expect(result.id).toBeDefined();
    });

    it('should throw error for missing required fields', async () => {
      const deploymentData = {
        project_name: 'test-project',
        environment: 'production'
        // missing user_id
      };

      await expect(deploymentService.createDeployment(deploymentData))
        .rejects.toThrow('User ID, project name, and environment are required');
    });

    it('should throw error for invalid environment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'invalid-env'
      };

      await expect(deploymentService.createDeployment(deploymentData))
        .rejects.toThrow('Invalid environment. Must be development, staging, or production');
    });

    it('should throw error when user not found', async () => {
      const deploymentData = {
        user_id: 99999,
        project_name: 'test-project',
        environment: 'production'
      };

      await expect(deploymentService.createDeployment(deploymentData))
        .rejects.toThrow('User not found');
    });

    it('should create deployment without config', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'staging'
      };

      const result = await deploymentService.createDeployment(deploymentData);

      expect(result.config).toBeNull();
    });
  });

  describe('getDeploymentById', () => {
    it('should return deployment when found', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentService.createDeployment(deploymentData);
      const foundDeployment = await deploymentService.getDeploymentById(createdDeployment.id);

      expect(foundDeployment).toBeInstanceOf(Deployment);
      expect(foundDeployment.project_name).toBe(deploymentData.project_name);
      expect(foundDeployment.environment).toBe(deploymentData.environment);
    });

    it('should throw error for invalid ID', async () => {
      await expect(deploymentService.getDeploymentById('invalid'))
        .rejects.toThrow('Valid deployment ID is required');
    });

    it('should throw error when deployment not found', async () => {
      await expect(deploymentService.getDeploymentById(99999))
        .rejects.toThrow('Deployment not found');
    });
  });

  describe('getDeploymentsByUserId', () => {
    it('should return deployments for user', async () => {
      // Create multiple deployments for the test user
      for (let i = 1; i <= 3; i++) {
        await deploymentService.createDeployment({
          user_id: testUser.id,
          project_name: `project-${i}`,
          environment: 'production'
        });
      }

      const deployments = await deploymentService.getDeploymentsByUserId(testUser.id);

      expect(deployments).toHaveLength(3);
      deployments.forEach(deployment => {
        expect(deployment.user_id).toBe(testUser.id);
        expect(deployment).toBeInstanceOf(Deployment);
      });
    });

    it('should throw error for invalid user ID', async () => {
      await expect(deploymentService.getDeploymentsByUserId('invalid'))
        .rejects.toThrow('Valid user ID is required');
    });

    it('should return empty array for user with no deployments', async () => {
      const deployments = await deploymentService.getDeploymentsByUserId(testUser.id);
      expect(deployments).toHaveLength(0);
    });
  });

  describe('getDeploymentsByStatus', () => {
    it('should return deployments by status', async () => {
      // Create deployments with different statuses
      const deployment1 = await deploymentService.createDeployment({
        user_id: testUser.id,
        project_name: 'project-1',
        environment: 'production'
      });

      const deployment2 = await deploymentService.createDeployment({
        user_id: testUser.id,
        project_name: 'project-2',
        environment: 'production'
      });

      // Update one deployment to running status
      await deploymentService.updateDeploymentStatus(deployment1.id, 'running');

      const runningDeployments = await deploymentService.getDeploymentsByStatus('running');
      expect(runningDeployments).toHaveLength(1);
      expect(runningDeployments[0].status).toBe('running');
    });

    it('should throw error for invalid status', async () => {
      await expect(deploymentService.getDeploymentsByStatus('invalid-status'))
        .rejects.toThrow('Valid status is required');
    });
  });

  describe('updateDeploymentStatus', () => {
    it('should update deployment status', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentService.createDeployment(deploymentData);
      const result = await deploymentService.updateDeploymentStatus(createdDeployment.id, 'running');

      expect(result.changes).toBe(1);

      const updatedDeployment = await deploymentService.getDeploymentById(createdDeployment.id);
      expect(updatedDeployment.status).toBe('running');
    });

    it('should throw error for invalid deployment ID', async () => {
      await expect(deploymentService.updateDeploymentStatus('invalid', 'running'))
        .rejects.toThrow('Valid deployment ID is required');
    });

    it('should throw error for invalid status', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentService.createDeployment(deploymentData);

      await expect(deploymentService.updateDeploymentStatus(createdDeployment.id, 'invalid-status'))
        .rejects.toThrow('Valid status is required');
    });

    it('should throw error when deployment not found', async () => {
      await expect(deploymentService.updateDeploymentStatus(99999, 'running'))
        .rejects.toThrow('Deployment not found');
    });
  });

  describe('cancelDeployment', () => {
    it('should cancel pending deployment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentService.createDeployment(deploymentData);
      const result = await deploymentService.cancelDeployment(createdDeployment.id);

      expect(result.changes).toBe(1);

      const cancelledDeployment = await deploymentService.getDeploymentById(createdDeployment.id);
      expect(cancelledDeployment.status).toBe('cancelled');
    });

    it('should throw error when trying to cancel completed deployment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentService.createDeployment(deploymentData);
      await deploymentService.updateDeploymentStatus(createdDeployment.id, 'successful');

      await expect(deploymentService.cancelDeployment(createdDeployment.id))
        .rejects.toThrow('Cannot cancel completed deployment');
    });

    it('should throw error for invalid deployment ID', async () => {
      await expect(deploymentService.cancelDeployment('invalid'))
        .rejects.toThrow('Valid deployment ID is required');
    });
  });

  describe('deleteDeployment', () => {
    it('should delete deployment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createdDeployment = await deploymentService.createDeployment(deploymentData);
      const result = await deploymentService.deleteDeployment(createdDeployment.id);

      expect(result.changes).toBe(1);

      await expect(deploymentService.getDeploymentById(createdDeployment.id))
        .rejects.toThrow('Deployment not found');
    });

    it('should throw error for invalid deployment ID', async () => {
      await expect(deploymentService.deleteDeployment('invalid'))
        .rejects.toThrow('Valid deployment ID is required');
    });

    it('should throw error when deployment not found', async () => {
      await expect(deploymentService.deleteDeployment(99999))
        .rejects.toThrow('Deployment not found');
    });
  });

  describe('getAllDeployments', () => {
    it('should return paginated deployments', async () => {
      // Create multiple deployments
      for (let i = 1; i <= 5; i++) {
        await deploymentService.createDeployment({
          user_id: testUser.id,
          project_name: `project-${i}`,
          environment: 'production'
        });
      }

      const deployments = await deploymentService.getAllDeployments(3, 0);

      expect(deployments).toHaveLength(3);
      deployments.forEach(deployment => {
        expect(deployment).toBeInstanceOf(Deployment);
      });
    });

    it('should throw error for invalid limit', async () => {
      await expect(deploymentService.getAllDeployments(0, 0))
        .rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for invalid offset', async () => {
      await expect(deploymentService.getAllDeployments(10, -1))
        .rejects.toThrow('Offset must be non-negative');
    });
  });

  describe('getDeploymentCount', () => {
    it('should return correct deployment count', async () => {
      const initialCount = await deploymentService.getDeploymentCount();
      expect(typeof initialCount).toBe('number');

      // Create deployments
      await deploymentService.createDeployment({
        user_id: testUser.id,
        project_name: 'project-1',
        environment: 'production'
      });

      await deploymentService.createDeployment({
        user_id: testUser.id,
        project_name: 'project-2',
        environment: 'staging'
      });

      const newCount = await deploymentService.getDeploymentCount();
      expect(newCount).toBe(initialCount + 2);
    });
  });

  describe('getDeploymentCountByStatus', () => {
    it('should return correct count by status', async () => {
      // Create deployments
      const deployment1 = await deploymentService.createDeployment({
        user_id: testUser.id,
        project_name: 'project-1',
        environment: 'production'
      });

      const deployment2 = await deploymentService.createDeployment({
        user_id: testUser.id,
        project_name: 'project-2',
        environment: 'production'
      });

      // Update one deployment to running
      await deploymentService.updateDeploymentStatus(deployment1.id, 'running');

      const pendingCount = await deploymentService.getDeploymentCountByStatus('pending');
      const runningCount = await deploymentService.getDeploymentCountByStatus('running');

      expect(pendingCount).toBe(1);
      expect(runningCount).toBe(1);
    });

    it('should throw error for invalid status', async () => {
      await expect(deploymentService.getDeploymentCountByStatus('invalid-status'))
        .rejects.toThrow('Valid status is required');
    });
  });
});