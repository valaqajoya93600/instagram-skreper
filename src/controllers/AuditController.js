'use strict';

const AuditService = require('../services/AuditService');
const { getDatabase } = require('../config/database');

class AuditController {
  constructor() {
    this.auditService = new AuditService(getDatabase());
  }

  async getAuditLogsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const logs = await this.auditService.getAuditLogsByUserId(
        parseInt(userId), 
        limit, 
        offset
      );
      
      res.status(200).json({
        success: true,
        data: logs.map(log => log.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.auditService.getAuditLogCount()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAuditLogsByResource(req, res) {
    try {
      const { resourceType, resourceId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const logs = await this.auditService.getAuditLogsByResource(
        resourceType, 
        resourceId, 
        limit, 
        offset
      );
      
      res.status(200).json({
        success: true,
        data: logs.map(log => log.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.auditService.getAuditLogCount()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAuditLogsByAction(req, res) {
    try {
      const { action } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const logs = await this.auditService.getAuditLogsByAction(
        action, 
        limit, 
        offset
      );
      
      res.status(200).json({
        success: true,
        data: logs.map(log => log.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.auditService.getAuditLogCount()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllAuditLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const logs = await this.auditService.getAllAuditLogs(limit, offset);
      
      res.status(200).json({
        success: true,
        data: logs.map(log => log.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.auditService.getAuditLogCount()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getUserActivitySummary(req, res) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      const summary = await this.auditService.getUserActivitySummary(
        parseInt(userId),
        startDate,
        endDate
      );
      
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSystemActivitySummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await this.auditService.getSystemActivitySummary(
        startDate,
        endDate
      );
      
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AuditController;