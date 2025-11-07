'use strict';

const AuditService = require('../../../src/services/AuditService');
const { getDatabase } = require('../../../tests/helpers/database');

describe('AuditService', () => {
  let auditService;
  let mockDb;
  let testUser;

  beforeEach(async () => {
    mockDb = getDatabase();
    auditService = new AuditService(mockDb);
    
    // Create a test user for audit tests
    testUser = await auditService.auditLogRepository.db.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      ['test@example.com', 'hashed_password', 'Test User']
    );
    testUser.id = testUser.lastID;
  });

  describe('logAction', () => {
    it('should log action with valid data', async () => {
      const logData = {
        user_id: testUser.id,
        action: 'CREATE',
        resource_type: 'user',
        resource_id: testUser.id.toString(),
        details: { email: 'test@example.com' }
      };

      const result = await auditService.logAction(
        logData.user_id,
        logData.action,
        logData.resource_type,
        logData.resource_id,
        logData.details
      );

      expect(result).toBeDefined();
      expect(result.user_id).toBe(logData.user_id);
      expect(result.action).toBe(logData.action);
      expect(result.resource_type).toBe(logData.resource_type);
      expect(result.resource_id).toBe(logData.resource_id);
    });

    it('should log action without resource_id and details', async () => {
      const result = await auditService.logAction(
        testUser.id,
        'LOGIN',
        'user'
      );

      expect(result.resource_id).toBeNull();
      expect(result.details).toBeNull();
    });

    it('should throw error for missing action', async () => {
      await expect(auditService.logAction(testUser.id, null, 'user'))
        .rejects.toThrow('Action and resource type are required');
    });

    it('should throw error for missing resource type', async () => {
      await expect(auditService.logAction(testUser.id, 'CREATE', null))
        .rejects.toThrow('Action and resource type are required');
    });

    it('should throw error for invalid action', async () => {
      await expect(auditService.logAction(testUser.id, 'INVALID', 'user'))
        .rejects.toThrow('Invalid action');
    });

    it('should throw error for invalid resource type', async () => {
      await expect(auditService.logAction(testUser.id, 'CREATE', 'invalid'))
        .rejects.toThrow('Invalid resource type');
    });
  });

  describe('getAuditLogsByUserId', () => {
    it('should return audit logs for user', async () => {
      // Create multiple audit logs for the test user
      await auditService.logAction(testUser.id, 'CREATE', 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, 'LOGIN', 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, 'UPDATE', 'user', testUser.id.toString());

      const logs = await auditService.getAuditLogsByUserId(testUser.id);

      expect(logs).toHaveLength(3);
      logs.forEach(log => {
        expect(log.user_id).toBe(testUser.id);
      });
    });

    it('should throw error for invalid user ID', async () => {
      await expect(auditService.getAuditLogsByUserId('invalid'))
        .rejects.toThrow('Valid user ID is required');
    });

    it('should return empty array for user with no logs', async () => {
      const logs = await auditService.getAuditLogsByUserId(testUser.id);
      expect(logs).toHaveLength(0);
    });
  });

  describe('getAuditLogsByResource', () => {
    it('should return audit logs for resource', async () => {
      const resourceType = 'user';
      const resourceId = testUser.id.toString();

      // Create logs for the resource
      await auditService.logAction(testUser.id, 'CREATE', resourceType, resourceId);
      await auditService.logAction(testUser.id, 'UPDATE', resourceType, resourceId);

      const logs = await auditService.getAuditLogsByResource(resourceType, resourceId);

      expect(logs).toHaveLength(2);
      logs.forEach(log => {
        expect(log.resource_type).toBe(resourceType);
        expect(log.resource_id).toBe(resourceId);
      });
    });

    it('should throw error for missing resource type', async () => {
      await expect(auditService.getAuditLogsByResource(null, '123'))
        .rejects.toThrow('Resource type and resource ID are required');
    });

    it('should throw error for missing resource ID', async () => {
      await expect(auditService.getAuditLogsByResource('user', null))
        .rejects.toThrow('Resource type and resource ID are required');
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should return audit logs by action', async () => {
      const action = 'CREATE';

      // Create logs with the same action
      await auditService.logAction(testUser.id, action, 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, action, 'deployment', '123');

      const logs = await auditService.getAuditLogsByAction(action);

      expect(logs).toHaveLength(2);
      logs.forEach(log => {
        expect(log.action).toBe(action);
      });
    });

    it('should throw error for missing action', async () => {
      await expect(auditService.getAuditLogsByAction(null))
        .rejects.toThrow('Action is required');
    });
  });

  describe('getAllAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      // Create multiple audit logs
      for (let i = 1; i <= 5; i++) {
        await auditService.logAction(testUser.id, 'CREATE', 'user', testUser.id.toString());
      }

      const logs = await auditService.getAllAuditLogs(3, 0);

      expect(logs).toHaveLength(3);
    });

    it('should throw error for invalid limit', async () => {
      await expect(auditService.getAllAuditLogs(0, 0))
        .rejects.toThrow('Limit must be between 1 and 100');
      await expect(auditService.getAllAuditLogs(101, 0))
        .rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for invalid offset', async () => {
      await expect(auditService.getAllAuditLogs(10, -1))
        .rejects.toThrow('Offset must be non-negative');
    });
  });

  describe('getAuditLogCount', () => {
    it('should return correct audit log count', async () => {
      const initialCount = await auditService.getAuditLogCount();
      expect(typeof initialCount).toBe('number');

      // Create audit logs
      await auditService.logAction(testUser.id, 'CREATE', 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, 'LOGIN', 'user', testUser.id.toString());

      const newCount = await auditService.getAuditLogCount();
      expect(newCount).toBe(initialCount + 2);
    });
  });

  describe('getUserActivitySummary', () => {
    it('should return user activity summary', async () => {
      // Create audit logs for the user
      await auditService.logAction(testUser.id, 'CREATE', 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, 'LOGIN', 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, 'CREATE', 'deployment', '123');

      const summary = await auditService.getUserActivitySummary(testUser.id);

      expect(summary.total_actions).toBe(3);
      expect(summary.actions_by_type.CREATE).toBe(2);
      expect(summary.actions_by_type.LOGIN).toBe(1);
      expect(summary.resources_accessed['user:' + testUser.id]).toBe(2);
      expect(summary.resources_accessed['deployment:123']).toBe(1);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(auditService.getUserActivitySummary('invalid'))
        .rejects.toThrow('Valid user ID is required');
    });

    it('should filter by date range', async () => {
      // Create audit logs
      await auditService.logAction(testUser.id, 'CREATE', 'user', testUser.id.toString());
      
      // Get summary with future date range
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const summary = await auditService.getUserActivitySummary(
        testUser.id,
        futureDate.toISOString()
      );

      expect(summary.total_actions).toBe(0);
    });
  });

  describe('getSystemActivitySummary', () => {
    it('should return system activity summary', async () => {
      // Create audit logs
      await auditService.logAction(testUser.id, 'CREATE', 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, 'LOGIN', 'user', testUser.id.toString());
      await auditService.logAction(testUser.id, 'CREATE', 'deployment', '123');

      const summary = await auditService.getSystemActivitySummary();

      expect(summary.total_actions).toBe(3);
      expect(summary.actions_by_type.CREATE).toBe(2);
      expect(summary.actions_by_type.LOGIN).toBe(1);
      expect(summary.resources_by_type.user).toBe(2);
      expect(summary.resources_by_type.deployment).toBe(1);
      expect(summary.active_users).toBe(1);
    });

    it('should filter by date range', async () => {
      // Create audit logs
      await auditService.logAction(testUser.id, 'CREATE', 'user', testUser.id.toString());
      
      // Get summary with future date range
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const summary = await auditService.getSystemActivitySummary(
        futureDate.toISOString()
      );

      expect(summary.total_actions).toBe(0);
    });
  });
});