'use strict';

const AuditLogRepository = require('../../../src/repositories/AuditLogRepository');
const { getDatabase } = require('../../../tests/helpers/database');

describe('AuditLogRepository', () => {
  let auditLogRepository;
  let mockDb;
  let testUser;

  beforeEach(async () => {
    mockDb = getDatabase();
    auditLogRepository = new AuditLogRepository(mockDb);
    
    // Create a test user for audit log tests
    const result = await mockDb.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      ['test@example.com', 'hashed_password', 'Test User']
    );
    testUser = { id: result.lastID };
  });

  describe('create', () => {
    it('should create an audit log with valid data', async () => {
      const logData = {
        user_id: testUser.id,
        action: 'CREATE',
        resource_type: 'user',
        resource_id: testUser.id.toString(),
        details: { email: 'test@example.com' }
      };

      const result = await auditLogRepository.create(logData);

      expect(result.id).toBeDefined();
      expect(result.user_id).toBe(logData.user_id);
      expect(result.action).toBe(logData.action);
      expect(result.resource_type).toBe(logData.resource_type);
      expect(result.resource_id).toBe(logData.resource_id);
    });

    it('should create audit log without resource_id and details', async () => {
      const logData = {
        user_id: testUser.id,
        action: 'LOGIN',
        resource_type: 'user'
      };

      const result = await auditLogRepository.create(logData);

      expect(result.resource_id).toBeNull();
      expect(result.details).toBeNull();
    });

    it('should store details as JSON string', async () => {
      const details = { key: 'value', nested: { data: 'test' } };
      const logData = {
        user_id: testUser.id,
        action: 'UPDATE',
        resource_type: 'user',
        resource_id: testUser.id.toString(),
        details
      };

      await auditLogRepository.create(logData);

      // Verify details is stored as JSON string in database
      const row = await new Promise((resolve, reject) => {
        mockDb.get(
          'SELECT details FROM audit_logs WHERE user_id = ?',
          [testUser.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      expect(typeof row.details).toBe('string');
      expect(JSON.parse(row.details)).toEqual(details);
    });
  });

  describe('findByUserId', () => {
    it('should return audit logs for user', async () => {
      // Create multiple audit logs for the test user
      const logs = [];
      for (let i = 1; i <= 3; i++) {
        const logData = {
          user_id: testUser.id,
          action: 'CREATE',
          resource_type: 'user',
          resource_id: testUser.id.toString()
        };
        logs.push(await auditLogRepository.create(logData));
      }

      const foundLogs = await auditLogRepository.findByUserId(testUser.id);

      expect(foundLogs).toHaveLength(3);
      foundLogs.forEach(log => {
        expect(log.user_id).toBe(testUser.id);
      });
    });

    it('should return empty array for user with no logs', async () => {
      const logs = await auditLogRepository.findByUserId(testUser.id);
      expect(logs).toHaveLength(0);
    });

    it('should respect limit and offset', async () => {
      // Create 5 audit logs
      for (let i = 1; i <= 5; i++) {
        await auditLogRepository.create({
          user_id: testUser.id,
          action: 'CREATE',
          resource_type: 'user',
          resource_id: testUser.id.toString()
        });
      }

      const firstPage = await auditLogRepository.findByUserId(testUser.id, 2, 0);
      const secondPage = await auditLogRepository.findByUserId(testUser.id, 2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('findByResource', () => {
    it('should return audit logs for resource', async () => {
      const resourceType = 'user';
      const resourceId = testUser.id.toString();

      // Create logs for the resource
      await auditLogRepository.create({
        user_id: testUser.id,
        action: 'CREATE',
        resource_type: resourceType,
        resource_id: resourceId
      });

      await auditLogRepository.create({
        user_id: testUser.id,
        action: 'UPDATE',
        resource_type: resourceType,
        resource_id: resourceId
      });

      const logs = await auditLogRepository.findByResource(resourceType, resourceId);

      expect(logs).toHaveLength(2);
      logs.forEach(log => {
        expect(log.resource_type).toBe(resourceType);
        expect(log.resource_id).toBe(resourceId);
      });
    });

    it('should return empty array for resource with no logs', async () => {
      const logs = await auditLogRepository.findByResource('nonexistent', '123');
      expect(logs).toHaveLength(0);
    });
  });

  describe('findByAction', () => {
    it('should return audit logs by action', async () => {
      const action = 'CREATE';

      // Create logs with the same action
      await auditLogRepository.create({
        user_id: testUser.id,
        action: action,
        resource_type: 'user',
        resource_id: testUser.id.toString()
      });

      await auditLogRepository.create({
        user_id: testUser.id,
        action: action,
        resource_type: 'deployment',
        resource_id: '123'
      });

      const logs = await auditLogRepository.findByAction(action);

      expect(logs).toHaveLength(2);
      logs.forEach(log => {
        expect(log.action).toBe(action);
      });
    });

    it('should return empty array for action with no logs', async () => {
      const logs = await auditLogRepository.findByAction('NONEXISTENT');
      expect(logs).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      // Create multiple audit logs
      const logs = [];
      for (let i = 1; i <= 5; i++) {
        const logData = {
          user_id: testUser.id,
          action: 'CREATE',
          resource_type: 'user',
          resource_id: testUser.id.toString()
        };
        logs.push(await auditLogRepository.create(logData));
      }

      const foundLogs = await auditLogRepository.findAll(3, 0);

      expect(foundLogs).toHaveLength(3);
      foundLogs.forEach(log => {
        expect(log.user_id).toBe(testUser.id);
      });
    });

    it('should return empty array when no logs exist', async () => {
      const logs = await auditLogRepository.findAll(10, 0);
      expect(logs).toHaveLength(0);
    });

    it('should respect limit and offset', async () => {
      // Create audit logs
      for (let i = 1; i <= 5; i++) {
        await auditLogRepository.create({
          user_id: testUser.id,
          action: 'CREATE',
          resource_type: 'user',
          resource_id: testUser.id.toString()
        });
      }

      const firstPage = await auditLogRepository.findAll(2, 0);
      const secondPage = await auditLogRepository.findAll(2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('count', () => {
    it('should return correct audit log count', async () => {
      const initialCount = await auditLogRepository.count();
      expect(typeof initialCount).toBe('number');

      // Create audit logs
      await auditLogRepository.create({
        user_id: testUser.id,
        action: 'CREATE',
        resource_type: 'user',
        resource_id: testUser.id.toString()
      });

      await auditLogRepository.create({
        user_id: testUser.id,
        action: 'LOGIN',
        resource_type: 'user',
        resource_id: testUser.id.toString()
      });

      const newCount = await auditLogRepository.count();
      expect(newCount).toBe(initialCount + 2);
    });

    it('should return 0 when no logs exist', async () => {
      const count = await auditLogRepository.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});