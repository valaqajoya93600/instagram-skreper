'use strict';

const AuditController = require('../../../src/controllers/AuditController');
const AuditService = require('../../../src/services/AuditService');

// Mock AuditService
jest.mock('../../../src/services/AuditService');

describe('AuditController', () => {
  let auditController;
  let mockReq;
  let mockRes;
  let mockAuditService;

  beforeEach(() => {
    mockAuditService = new AuditService();
    auditController = new AuditController();
    
    mockReq = {
      params: {},
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getAuditLogsByUserId', () => {
    it('should get audit logs by user ID successfully', async () => {
      const userId = '1';
      const logs = [
        { id: 1, user_id: 1, action: 'CREATE' },
        { id: 2, user_id: 1, action: 'UPDATE' }
      ];
      const logsJSON = [
        { id: 1, user_id: 1, action: 'CREATE' },
        { id: 2, user_id: 1, action: 'UPDATE' }
      ];
      
      mockAuditService.getAuditLogsByUserId.mockResolvedValue(logs);
      mockAuditService.getAuditLogCount.mockResolvedValue(2);
      logs.forEach((log, index) => {
        log.toJSON = jest.fn().mockReturnValue(logsJSON[index]);
      });

      mockReq.params.userId = userId;
      mockReq.query = { limit: '10', offset: '0' };

      await auditController.getAuditLogsByUserId(mockReq, mockRes);

      expect(mockAuditService.getAuditLogsByUserId).toHaveBeenCalledWith(1, 10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: logsJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      });
    });

    it('should use default pagination values', async () => {
      mockAuditService.getAuditLogsByUserId.mockResolvedValue([]);
      mockAuditService.getAuditLogCount.mockResolvedValue(0);

      mockReq.params.userId = '1';
      mockReq.query = {};

      await auditController.getAuditLogsByUserId(mockReq, mockRes);

      expect(mockAuditService.getAuditLogsByUserId).toHaveBeenCalledWith(1, 50, 0);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          limit: 50,
          offset: 0,
          total: 0
        }
      });
    });

    it('should handle error', async () => {
      const error = new Error('Failed to get logs');
      mockAuditService.getAuditLogsByUserId.mockRejectedValue(error);

      mockReq.params.userId = '1';

      await auditController.getAuditLogsByUserId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get logs'
      });
    });
  });

  describe('getAuditLogsByResource', () => {
    it('should get audit logs by resource successfully', async () => {
      const resourceType = 'user';
      const resourceId = '1';
      const logs = [
        { id: 1, resource_type: resourceType, resource_id: resourceId },
        { id: 2, resource_type: resourceType, resource_id: resourceId }
      ];
      const logsJSON = [
        { id: 1, resource_type: resourceType, resource_id: resourceId },
        { id: 2, resource_type: resourceType, resource_id: resourceId }
      ];
      
      mockAuditService.getAuditLogsByResource.mockResolvedValue(logs);
      mockAuditService.getAuditLogCount.mockResolvedValue(2);
      logs.forEach((log, index) => {
        log.toJSON = jest.fn().mockReturnValue(logsJSON[index]);
      });

      mockReq.params.resourceType = resourceType;
      mockReq.params.resourceId = resourceId;
      mockReq.query = { limit: '10', offset: '0' };

      await auditController.getAuditLogsByResource(mockReq, mockRes);

      expect(mockAuditService.getAuditLogsByResource).toHaveBeenCalledWith(resourceType, resourceId, 10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: logsJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      });
    });

    it('should use default pagination values', async () => {
      mockAuditService.getAuditLogsByResource.mockResolvedValue([]);
      mockAuditService.getAuditLogCount.mockResolvedValue(0);

      mockReq.params.resourceType = 'user';
      mockReq.params.resourceId = '1';
      mockReq.query = {};

      await auditController.getAuditLogsByResource(mockReq, mockRes);

      expect(mockAuditService.getAuditLogsByResource).toHaveBeenCalledWith('user', '1', 50, 0);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          limit: 50,
          offset: 0,
          total: 0
        }
      });
    });

    it('should handle error', async () => {
      const error = new Error('Failed to get logs');
      mockAuditService.getAuditLogsByResource.mockRejectedValue(error);

      mockReq.params.resourceType = 'user';
      mockReq.params.resourceId = '1';

      await auditController.getAuditLogsByResource(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get logs'
      });
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should get audit logs by action successfully', async () => {
      const action = 'CREATE';
      const logs = [
        { id: 1, action: 'CREATE', resource_type: 'user' },
        { id: 2, action: 'CREATE', resource_type: 'deployment' }
      ];
      const logsJSON = [
        { id: 1, action: 'CREATE', resource_type: 'user' },
        { id: 2, action: 'CREATE', resource_type: 'deployment' }
      ];
      
      mockAuditService.getAuditLogsByAction.mockResolvedValue(logs);
      mockAuditService.getAuditLogCount.mockResolvedValue(2);
      logs.forEach((log, index) => {
        log.toJSON = jest.fn().mockReturnValue(logsJSON[index]);
      });

      mockReq.params.action = action;
      mockReq.query = { limit: '10', offset: '0' };

      await auditController.getAuditLogsByAction(mockReq, mockRes);

      expect(mockAuditService.getAuditLogsByAction).toHaveBeenCalledWith(action, 10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: logsJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      });
    });

    it('should use default pagination values', async () => {
      mockAuditService.getAuditLogsByAction.mockResolvedValue([]);
      mockAuditService.getAuditLogCount.mockResolvedValue(0);

      mockReq.params.action = 'CREATE';
      mockReq.query = {};

      await auditController.getAuditLogsByAction(mockReq, mockRes);

      expect(mockAuditService.getAuditLogsByAction).toHaveBeenCalledWith('CREATE', 50, 0);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          limit: 50,
          offset: 0,
          total: 0
        }
      });
    });

    it('should handle error', async () => {
      const error = new Error('Failed to get logs');
      mockAuditService.getAuditLogsByAction.mockRejectedValue(error);

      mockReq.params.action = 'CREATE';

      await auditController.getAuditLogsByAction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get logs'
      });
    });
  });

  describe('getAllAuditLogs', () => {
    it('should get all audit logs successfully', async () => {
      const logs = [
        { id: 1, action: 'CREATE', resource_type: 'user' },
        { id: 2, action: 'UPDATE', resource_type: 'deployment' }
      ];
      const logsJSON = [
        { id: 1, action: 'CREATE', resource_type: 'user' },
        { id: 2, action: 'UPDATE', resource_type: 'deployment' }
      ];
      
      mockAuditService.getAllAuditLogs.mockResolvedValue(logs);
      mockAuditService.getAuditLogCount.mockResolvedValue(2);
      logs.forEach((log, index) => {
        log.toJSON = jest.fn().mockReturnValue(logsJSON[index]);
      });

      mockReq.query = { limit: '10', offset: '0' };

      await auditController.getAllAuditLogs(mockReq, mockRes);

      expect(mockAuditService.getAllAuditLogs).toHaveBeenCalledWith(10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: logsJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      });
    });

    it('should use default pagination values', async () => {
      mockAuditService.getAllAuditLogs.mockResolvedValue([]);
      mockAuditService.getAuditLogCount.mockResolvedValue(0);

      mockReq.query = {};

      await auditController.getAllAuditLogs(mockReq, mockRes);

      expect(mockAuditService.getAllAuditLogs).toHaveBeenCalledWith(50, 0);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          limit: 50,
          offset: 0,
          total: 0
        }
      });
    });

    it('should handle error', async () => {
      const error = new Error('Failed to get logs');
      mockAuditService.getAllAuditLogs.mockRejectedValue(error);

      await auditController.getAllAuditLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get logs'
      });
    });
  });

  describe('getUserActivitySummary', () => {
    it('should get user activity summary successfully', async () => {
      const userId = '1';
      const summary = {
        total_actions: 5,
        actions_by_type: { CREATE: 2, UPDATE: 3 },
        resources_accessed: { 'user:1': 2, 'deployment:123': 3 }
      };
      
      mockAuditService.getUserActivitySummary.mockResolvedValue(summary);

      mockReq.params.userId = userId;
      mockReq.query = {};

      await auditController.getUserActivitySummary(mockReq, mockRes);

      expect(mockAuditService.getUserActivitySummary).toHaveBeenCalledWith(1, undefined, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: summary
      });
    });

    it('should pass date range parameters', async () => {
      const userId = '1';
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const summary = { total_actions: 0 };
      
      mockAuditService.getUserActivitySummary.mockResolvedValue(summary);

      mockReq.params.userId = userId;
      mockReq.query = { startDate, endDate };

      await auditController.getUserActivitySummary(mockReq, mockRes);

      expect(mockAuditService.getUserActivitySummary).toHaveBeenCalledWith(1, startDate, endDate);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: summary
      });
    });

    it('should handle error', async () => {
      const error = new Error('Failed to get summary');
      mockAuditService.getUserActivitySummary.mockRejectedValue(error);

      mockReq.params.userId = '1';

      await auditController.getUserActivitySummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get summary'
      });
    });
  });

  describe('getSystemActivitySummary', () => {
    it('should get system activity summary successfully', async () => {
      const summary = {
        total_actions: 10,
        actions_by_type: { CREATE: 4, UPDATE: 6 },
        resources_by_type: { user: 4, deployment: 6 },
        active_users: 2
      };
      
      mockAuditService.getSystemActivitySummary.mockResolvedValue(summary);

      mockReq.query = {};

      await auditController.getSystemActivitySummary(mockReq, mockRes);

      expect(mockAuditService.getSystemActivitySummary).toHaveBeenCalledWith(undefined, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: summary
      });
    });

    it('should pass date range parameters', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const summary = { total_actions: 0 };
      
      mockAuditService.getSystemActivitySummary.mockResolvedValue(summary);

      mockReq.query = { startDate, endDate };

      await auditController.getSystemActivitySummary(mockReq, mockRes);

      expect(mockAuditService.getSystemActivitySummary).toHaveBeenCalledWith(startDate, endDate);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: summary
      });
    });

    it('should handle error', async () => {
      const error = new Error('Failed to get summary');
      mockAuditService.getSystemActivitySummary.mockRejectedValue(error);

      await auditController.getSystemActivitySummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get summary'
      });
    });
  });
});