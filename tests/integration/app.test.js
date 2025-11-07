'use strict';

const app = require('../../src/index');

describe('Application Integration Tests', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Railway Deployment Automation API',
        version: '1.0.0',
        endpoints: {
          health: '/healthz',
          users: '/api/users',
          deployments: '/api/deployments',
          audit: '/api/audit'
        }
      });
    });
  });

  describe('GET /healthz', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.uptimeSeconds).toBeGreaterThan(0);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Request Body Size Limit', () => {
    it('should handle large request bodies', async () => {
      const largeData = 'x'.repeat(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: largeData
        })
        .expect(413); // Payload Too Large
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Content-Type Handling', () => {
    it('should handle form data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send('email=test@example.com&password=password123&name=Test User')
        .expect(400); // Will fail validation but should be parsed

      expect(response.body.success).toBe(false);
      // Should not be a JSON parsing error
      expect(response.body.error).not.toContain('Unexpected token');
    });
  });

  describe('Rate Limiting (if implemented)', () => {
    it('should handle multiple rapid requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/healthz')
      );

      const responses = await Promise.all(promises);

      // All should succeed unless rate limiting is implemented
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Database Connection', () => {
    it('should handle database operations', async () => {
      // Create a user to verify database is working
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      // Retrieve the user to verify database persistence
      const getResponse = await request(app)
        .get(`/api/users/${createResponse.body.data.id}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.email).toBe('test@example.com');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/users')
          .send({
            email: `user${i}@example.com`,
            password: 'password123',
            name: `User ${i}`
          })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect([201, 400]).toContain(response.status);
        // Should be 201 for unique emails, 400 for duplicates
      });
    });
  });
});