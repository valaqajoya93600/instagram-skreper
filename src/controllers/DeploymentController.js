'use strict';

const DeploymentService = require('../services/DeploymentService');
const { getDatabase } = require('../config/database');

class DeploymentController {
  constructor() {
    this.deploymentService = new DeploymentService(getDatabase());
  }

  async createDeployment(req, res) {
    try {
      const { user_id, project_name, environment, config } = req.body;
      const deployment = await this.deploymentService.createDeployment({
        user_id,
        project_name,
        environment,
        config
      });
      
      res.status(201).json({
        success: true,
        data: deployment,
        message: 'Deployment created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDeploymentById(req, res) {
    try {
      const { id } = req.params;
      const deployment = await this.deploymentService.getDeploymentById(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: deployment.toJSON()
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDeploymentsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const deployments = await this.deploymentService.getDeploymentsByUserId(
        parseInt(userId), 
        limit, 
        offset
      );
      
      res.status(200).json({
        success: true,
        data: deployments.map(deployment => deployment.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.deploymentService.getDeploymentCount()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDeploymentsByStatus(req, res) {
    try {
      const { status } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const deployments = await this.deploymentService.getDeploymentsByStatus(
        status, 
        limit, 
        offset
      );
      
      res.status(200).json({
        success: true,
        data: deployments.map(deployment => deployment.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.deploymentService.getDeploymentCountByStatus(status)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateDeploymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await this.deploymentService.updateDeploymentStatus(
        parseInt(id), 
        status
      );
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Deployment status updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async cancelDeployment(req, res) {
    try {
      const { id } = req.params;
      const result = await this.deploymentService.cancelDeployment(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Deployment cancelled successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteDeployment(req, res) {
    try {
      const { id } = req.params;
      const result = await this.deploymentService.deleteDeployment(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Deployment deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllDeployments(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const deployments = await this.deploymentService.getAllDeployments(limit, offset);
      
      res.status(200).json({
        success: true,
        data: deployments.map(deployment => deployment.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.deploymentService.getDeploymentCount()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDeploymentLogs(req, res) {
    try {
      const { id } = req.params;
      const deployment = await this.deploymentService.getDeploymentById(parseInt(id));
      
      // Mock logs for now - in real implementation would fetch from S3
      const mockLogs = `Deployment logs for ${deployment.project_name} (${deployment.environment})\n` +
                      `Status: ${deployment.status}\n` +
                      `Created: ${deployment.created_at}\n` +
                      `Updated: ${deployment.updated_at}\n` +
                      `Config: ${JSON.stringify(deployment.config, null, 2)}`;
      
      res.status(200).json({
        success: true,
        data: {
          deployment_id: deployment.id,
          logs: mockLogs
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = DeploymentController;