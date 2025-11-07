'use strict';

const AuditLog = require('../../../src/models/AuditLog');

describe('AuditLog Model', () => {
  describe('constructor', () => {
    it('should create audit log with valid data', () => {
      const logData = {
        id: 1,
        user_id: 1,
        action: 'CREATE',
        resource_type: 'user',
        resource_id: '1',
        details: '{"email": "test@example.com"}',
        created_at: '2023-01-01T00:00:00.000Z'
      };

      const auditLog = new AuditLog(logData);

      expect(auditLog.id).toBe(logData.id);
      expect(auditLog.user_id).toBe(logData.user_id);
      expect(auditLog.action).toBe(logData.action);
      expect(auditLog.resource_type).toBe(logData.resource_type);
      expect(auditLog.resource_id).toBe(logData.resource_id);
      expect(auditLog.details).toEqual({ email: 'test@example.com' });
      expect(auditLog.created_at).toBe(logData.created_at);
    });

    it('should handle null details', () => {
      const logData = {
        id: 1,
        user_id: 1,
        action: 'CREATE',
        resource_type: 'user',
        resource_id: '1',
        details: null,
        created_at: '2023-01-01T00:00:00.000Z'
      };

      const auditLog = new AuditLog(logData);

      expect(auditLog.details).toBeNull();
    });
  });

  describe('createLog', () => {
    it('should create log data with all fields', () => {
      const userId = 1;
      const action = 'CREATE';
      const resourceType = 'user';
      const resourceId = '1';
      const details = { email: 'test@example.com' };

      const logData = AuditLog.createLog(userId, action, resourceType, resourceId, details);

      expect(logData.user_id).toBe(userId);
      expect(logData.action).toBe(action);
      expect(logData.resource_type).toBe(resourceType);
      expect(logData.resource_id).toBe(resourceId);
      expect(logData.details).toBe(JSON.stringify(details));
      expect(logData.created_at).toBeDefined();
    });

    it('should create log data without resource_id and details', () => {
      const userId = 1;
      const action = 'LOGIN';
      const resourceType = 'user';

      const logData = AuditLog.createLog(userId, action, resourceType);

      expect(logData.user_id).toBe(userId);
      expect(logData.action).toBe(action);
      expect(logData.resource_type).toBe(resourceType);
      expect(logData.resource_id).toBeNull();
      expect(logData.details).toBeNull();
      expect(logData.created_at).toBeDefined();
    });
  });

  describe('toJSON', () => {
    it('should return audit log data as JSON', () => {
      const logData = {
        id: 1,
        user_id: 1,
        action: 'CREATE',
        resource_type: 'user',
        resource_id: '1',
        details: { email: 'test@example.com' },
        created_at: '2023-01-01T00:00:00.000Z'
      };

      const auditLog = new AuditLog(logData);
      const json = auditLog.toJSON();

      expect(json).toEqual(logData);
    });
  });
});