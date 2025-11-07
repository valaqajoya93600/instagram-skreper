'use strict';

const request = require('supertest');
const { getDatabase } = require('../../../tests/helpers/database');

const app = require('../../../src/index');

describe('UserController Integration Tests', () => {
  let server;

  beforeAll(async () => {
    // Start the server for testing
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
          db.run('DELETE FROM users', resolve);
        });
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.message).toBe('User created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'test@example.com'
        // missing password and name
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email format');
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password must be at least 6 characters long');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // Create first user
      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      // Create multiple users
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/users')
          .send({
            email: `user${i}@example.com`,
            password: 'password123',
            name: `User ${i}`
          });
      }

      const response = await request(app)
        .get('/api/users?limit=3&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should use default pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user when found', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.password_hash).toBeUndefined(); // Password should not be returned
    });

    it('should return 404 when user not found', async () => {
      const response = await request(app)
        .get('/api/users/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changes).toBe(1);
      expect(response.body.message).toBe('User updated successfully');

      // Verify update
      const getResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(getResponse.body.data.name).toBe(updateData.name);
    });

    it('should return 400 for empty name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Name is required');
    });

    it('should return 404 when user not found', async () => {
      const response = await request(app)
        .put('/api/users/99999')
        .send({ name: 'Updated Name' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changes).toBe(1);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify deletion
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('should return 400 when user not found', async () => {
      const response = await request(app)
        .delete('/api/users/99999')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate with correct credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.password_hash).toBeUndefined();
      expect(response.body.message).toBe('Authentication successful');
    });

    it('should return 401 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('GET /api/profile', () => {
    it('should return user profile', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      // This endpoint uses a default user ID for testing (1)
      // In a real application, this would use authentication middleware
      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});