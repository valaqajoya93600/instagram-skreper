'use strict';

const AuditLogRepository = require('../repositories/AuditLogRepository');

class AuditService {
  constructor(db) {
    this.auditLogRepository = new AuditLogRepository(db);
  }

  async logAction(userId, action, resourceType, resourceId = null, details = null) {
    if (!action || !resourceType) {
      throw new Error('Action and resource type are required');
    }

    const validActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CANCEL', 'UPDATE_STATUS'];
    if (!validActions.includes(action)) {
      throw new Error('Invalid action');
    }

    const validResourceTypes = ['user', 'deployment', 'audit_log'];
    if (!validResourceTypes.includes(resourceType)) {
      throw new Error('Invalid resource type');
    }

    return await this.auditLogRepository.create({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    });
  }

  async getAuditLogsByUserId(userId, limit = 50, offset = 0) {
    if (!userId || isNaN(userId)) {
      throw new Error('Valid user ID is required');
    }

    return await this.auditLogRepository.findByUserId(userId, limit, offset);
  }

  async getAuditLogsByResource(resourceType, resourceId, limit = 50, offset = 0) {
    if (!resourceType || !resourceId) {
      throw new Error('Resource type and resource ID are required');
    }

    return await this.auditLogRepository.findByResource(resourceType, resourceId, limit, offset);
  }

  async getAuditLogsByAction(action, limit = 50, offset = 0) {
    if (!action) {
      throw new Error('Action is required');
    }

    return await this.auditLogRepository.findByAction(action, limit, offset);
  }

  async getAllAuditLogs(limit = 50, offset = 0) {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    return await this.auditLogRepository.findAll(limit, offset);
  }

  async getAuditLogCount() {
    return await this.auditLogRepository.count();
  }

  async getUserActivitySummary(userId, startDate = null, endDate = null) {
    if (!userId || isNaN(userId)) {
      throw new Error('Valid user ID is required');
    }

    const logs = await this.getAuditLogsByUserId(userId, 1000, 0);
    
    // Filter by date range if provided
    let filteredLogs = logs;
    if (startDate || endDate) {
      filteredLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Generate summary
    const summary = {
      total_actions: filteredLogs.length,
      actions_by_type: {},
      resources_accessed: {},
      date_range: {
        start: startDate || (filteredLogs.length > 0 ? filteredLogs[filteredLogs.length - 1].created_at : null),
        end: endDate || (filteredLogs.length > 0 ? filteredLogs[0].created_at : null)
      }
    };

    filteredLogs.forEach(log => {
      // Count actions by type
      summary.actions_by_type[log.action] = (summary.actions_by_type[log.action] || 0) + 1;
      
      // Count resources accessed
      const resourceKey = `${log.resource_type}:${log.resource_id || 'unknown'}`;
      summary.resources_accessed[resourceKey] = (summary.resources_accessed[resourceKey] || 0) + 1;
    });

    return summary;
  }

  async getSystemActivitySummary(startDate = null, endDate = null) {
    const logs = await this.getAllAuditLogs(1000, 0);
    
    // Filter by date range if provided
    let filteredLogs = logs;
    if (startDate || endDate) {
      filteredLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Generate summary
    const summary = {
      total_actions: filteredLogs.length,
      actions_by_type: {},
      resources_by_type: {},
      active_users: new Set(),
      date_range: {
        start: startDate || (filteredLogs.length > 0 ? filteredLogs[filteredLogs.length - 1].created_at : null),
        end: endDate || (filteredLogs.length > 0 ? filteredLogs[0].created_at : null)
      }
    };

    filteredLogs.forEach(log => {
      // Count actions by type
      summary.actions_by_type[log.action] = (summary.actions_by_type[log.action] || 0) + 1;
      
      // Count resources by type
      summary.resources_by_type[log.resource_type] = (summary.resources_by_type[log.resource_type] || 0) + 1;
      
      // Track active users
      if (log.user_id) {
        summary.active_users.add(log.user_id);
      }
    });

    summary.active_users = summary.active_users.size;

    return summary;
  }
}

module.exports = AuditService;