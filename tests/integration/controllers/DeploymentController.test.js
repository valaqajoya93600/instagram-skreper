'use strict';

const request = require('supertest');
const { getDatabase } = require('../../../tests/helpers/database');

const app = require('../../../src/index');

describe('DeploymentController Integration Tests', () => {
  let server;
  let testUser;

  beforeAll(async () => {
    // Start server for testing
    server = app.listen(0); // Use random available port
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean database before each test
    const db = getDatabase();
    await new Promise((resolve) => {
      db.run('DELETE FROM audit_logs', () => {
        db.run('DELETE FROM deployments', () => {
          db.run('DELETE FROM users', async () => {
            // Create a test user for deployment tests
            const result = await new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
                ['test@example.com', 'hashed_password', 'Test User'],
                function(err) {
                  if (err) reject(err);
                  else resolve({ id: this.lastID });
                }
              );
            });
            testUser = result;
            resolve();
          });
        });
      });
    });
  });

  describe('POST /api/deployments', () => {
    it('should create a deployment with valid data', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production',
        config: { memory: '512MB', cpu: '1' }
      };

      const response = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(deploymentData.user_id);
      expect(response.body.data.project_name).toBe(deploymentData.project_name);
      expect(response.body.data.environment).toBe(deploymentData.environment);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.message).toBe('Deployment created successfully');
    });

    it('should create deployment without config', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'staging'
      };

      const response = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config).toBeNull();
    });

    it('should return 400 for missing required fields', async () => {
      const deploymentData = {
        project_name: 'test-project',
        environment: 'production'
        // missing user_id
      };

      const response = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid environment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'invalid-env'
      };

      const response = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid environment');
    });

    it('should return 400 when user not found', async () => {
      const deploymentData = {
        user_id: 99999,
        project_name: 'test-project',
        environment: 'production'
      };

      const response = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('GET /api/deployments', () => {
    it('should return paginated deployments', async () => {
      // Create multiple deployments
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/deployments')
          .send({
            user_id: testUser.id,
            project_name: `project-${i}`,
            environment: 'production'
          });
      }

      const response = await request(app)
        .get('/api/deployments?limit=3&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should return empty array when no deployments exist', async () => {
      const response = await request(app)
        .get('/api/deployments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should use default pagination parameters', async () => {
      const response = await request(app)
        .get('/api/deployments')
        .expect(200);

      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
    });
  });

  describe('GET /api/deployments/:id', () => {
    it('should return deployment when found', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createResponse = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      const deploymentId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/deployments/${deploymentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(deploymentId);
      expect(response.body.data.project_name).toBe(deploymentData.project_name);
      expect(response.body.data.environment).toBe(deploymentData.environment);
    });

    it('should return 404 when deployment not found', async () => {
      const response = await request(app)
        .get('/api/deployments/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Deployment not found');
    });

    it('should return 404 for invalid deployment ID', async () => {
      const response = await request(app)
        .get('/api/deployments/invalid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/deployments/:id/status', () => {
    it('should update deployment status', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createResponse = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      const deploymentId = createResponse.body.data.id;
      const updateData = { status: 'running' };

      const response = await request(app)
        .put(`/api/deployments/${deploymentId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changes).toBe(1);
      expect(response.body.message).toBe('Deployment status updated successfully');

      // Verify update
      const getResponse = await request(app)
        .get(`/api/deployments/${deploymentId}`)
        .expect(200);

      expect(getResponse.body.data.status).toBe(updateData.status);
    });

    it('should return 400 for invalid status', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createResponse = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      const deploymentId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/deployments/${deploymentId}/status`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Valid status is required');
    });

    it('should return 404 when deployment not found', async () => {
      const response = await request(app)
        .put('/api/deployments/99999/status')
        .send({ status: 'running' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Deployment not found');
    });
  });

  describe('POST /api/deployments/:id/cancel', () => {
    it('should cancel pending deployment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createResponse = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      const deploymentId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/deployments/${deploymentId}/cancel`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changes).toBe(1);
      expect(response.body.message).toBe('Deployment cancelled successfully');

      // Verify cancellation
      const getResponse = await request(app)
        .get(`/api/deployments/${deploymentId}`)
        .expect(200);

      expect(getResponse.body.data.status).toBe('cancelled');
    });

    it('should return 400 when trying to cancel completed deployment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createResponse = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      const deploymentId = createResponse.body.data.id;

      // First update status to successful
      await request(app)
        .put(`/api/deployments/${deploymentId}/status`)
        .send({ status: 'successful' })
        .expect(200);

      // Then try to cancel
      const response = await request(app)
        .post(`/api/deployments/${deploymentId}/cancel`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot cancel completed deployment');
    });

    it('should return 400 when deployment not found', async () => {
      const response = await request(app)
        .post('/api/deployments/99999/cancel')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Deployment not found');
    });
  });

  describe('DELETE /api/deployments/:id', () => {
    it('should delete deployment', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production'
      };

      const createResponse = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      const deploymentId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/deployments/${deploymentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changes).toBe(1);
      expect(response.body.message).toBe('Deployment deleted successfully');

      // Verify deletion
      await request(app)
        .get(`/api/deployments/${deploymentId}`)
        .expect(404);
    });

    it('should return 400 when deployment not found', async () => {
      const response = await request(app)
        .delete('/api/deployments/99999')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Deployment not found');
    });
  });

  describe('GET /api/deployments/:id/logs', () => {
    it('should return deployment logs', async () => {
      const deploymentData = {
        user_id: testUser.id,
        project_name: 'test-project',
        environment: 'production',
        config: { memory: '512MB' }
      };

      const createResponse = await request(app)
        .post('/api/deployments')
        .send(deploymentData)
        .expect(201);

      const deploymentId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/deployments/${deploymentId}/logs`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deployment_id).toBe(deploymentId);
      expect(response.body.data.logs).toContain(deploymentData.project_name);
      expect(response.body.data.logs).toContain(deploymentData.environment);
      expect(response.body.data.logs).toContain(JSON.stringify(deploymentData.config));
    });

    it('should return 404 when deployment not found', async () => {
      const response = await request(app)
        .get('/api/deployments/99999/logs')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Deployment not found');
    });
  });

  describe('GET /api/users/:userId/deployments', () => {
    it('should return deployments for user', async () => {
      // Create multiple deployments for the test user
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/deployments')
          .send({
            user_id: testUser.id,
            project_name: `project-${i}`,
            environment: 'production'
          });
      }

      const response = await request(app)
        .get(`/api/users/${testUser.id}/deployments`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach(deployment => {
        expect(deployment.user_id).toBe(testUser.id);
      });
    });

    it('should return empty array for user with no deployments', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}/deployments`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid/deployments')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Valid user ID is required');
    });
  });

  describe('GET /api/deployments/status/:status', () => {
    it('should return deployments by status', async () => {
      // Create deployments
      const deployment1 = await request(app)
        .post('/api/deployments')
        .send({
          user_id: testUser.id,
          project_name: 'project-1',
          environment: 'production'
        });

      const deployment2 = await request(app)
        .post('/api/deployments')
        .send({
          user_id: testUser.id,
          project_name: 'project-2',
          environment: 'production'
        });

      // Update one deployment status
      await request(app)
        .put(`/api/deployments/${deployment1.body.data.id}/status`)
        .send({ status: 'running' });

      const response = await request(app)
        .get('/api/deployments/status/pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('pending');
    });

    it('should return empty array for status with no deployments', async () => {
      const response = await request(app)
        .get('/api/deployments/status/running')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .get('/api/deployments/status/invalid-status')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Valid status is required');
    });
  });
});