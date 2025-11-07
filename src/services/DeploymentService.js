'use strict';

const Deployment = require('../models/Deployment');
const DeploymentRepository = require('../repositories/DeploymentRepository');
const UserRepository = require('../repositories/UserRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const S3Service = require('./S3Service');
const EmailService = require('./EmailService');

class DeploymentService {
  constructor(db) {
    this.deploymentRepository = new DeploymentRepository(db);
    this.userRepository = new UserRepository(db);
    this.auditLogRepository = new AuditLogRepository(db);
    this.s3Service = new S3Service();
    this.emailService = new EmailService();
  }

  async createDeployment(deploymentData) {
    const { user_id, project_name, environment, config } = deploymentData;

    // Validate input
    if (!user_id || !project_name || !environment) {
      throw new Error('User ID, project name, and environment are required');
    }

    if (!Deployment.isValidEnvironment(environment)) {
      throw new Error('Invalid environment. Must be development, staging, or production');
    }

    // Check if user exists
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Create deployment
    const deployment = await this.deploymentRepository.create({
      user_id,
      project_name,
      environment,
      status: 'pending',
      config
    });

    // Log audit trail
    await this.auditLogRepository.create({
      user_id,
      action: 'CREATE',
      resource_type: 'deployment',
      resource_id: deployment.id.toString(),
      details: { project_name, environment, config }
    });

    // Start deployment process asynchronously
    this.processDeployment(deployment.id).catch(error => {
      console.error('Deployment processing error:', error);
    });

    return deployment;
  }

  async getDeploymentById(id) {
    if (!id || isNaN(id)) {
      throw new Error('Valid deployment ID is required');
    }

    const deployment = await this.deploymentRepository.findById(id);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    return deployment;
  }

  async getDeploymentsByUserId(userId, limit = 50, offset = 0) {
    if (!userId || isNaN(userId)) {
      throw new Error('Valid user ID is required');
    }

    return await this.deploymentRepository.findByUserId(userId, limit, offset);
  }

  async getDeploymentsByStatus(status, limit = 50, offset = 0) {
    if (!status || !Deployment.isValidStatus(status)) {
      throw new Error('Valid status is required');
    }

    return await this.deploymentRepository.findByStatus(status, limit, offset);
  }

  async updateDeploymentStatus(id, status) {
    if (!id || isNaN(id)) {
      throw new Error('Valid deployment ID is required');
    }

    if (!status || !Deployment.isValidStatus(status)) {
      throw new Error('Valid status is required');
    }

    const deployment = await this.deploymentRepository.findById(id);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const result = await this.deploymentRepository.update(id, { status });

    // Log audit trail
    await this.auditLogRepository.create({
      user_id: deployment.user_id,
      action: 'UPDATE_STATUS',
      resource_type: 'deployment',
      resource_id: id.toString(),
      details: { old_status: deployment.status, new_status: status }
    });

    // Send notification if deployment is complete
    if (status === 'successful' || status === 'failed') {
      const user = await this.userRepository.findById(deployment.user_id);
      if (user) {
        await this.emailService.sendDeploymentNotification(user.email, {
          project_name: deployment.project_name,
          environment: deployment.environment,
          status
        });
      }
    }

    return result;
  }

  async cancelDeployment(id) {
    if (!id || isNaN(id)) {
      throw new Error('Valid deployment ID is required');
    }

    const deployment = await this.deploymentRepository.findById(id);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    if (deployment.status === 'successful' || deployment.status === 'failed') {
      throw new Error('Cannot cancel completed deployment');
    }

    const result = await this.deploymentRepository.update(id, { status: 'cancelled' });

    // Log audit trail
    await this.auditLogRepository.create({
      user_id: deployment.user_id,
      action: 'CANCEL',
      resource_type: 'deployment',
      resource_id: id.toString(),
      details: { project_name: deployment.project_name, environment: deployment.environment }
    });

    return result;
  }

  async deleteDeployment(id) {
    if (!id || isNaN(id)) {
      throw new Error('Valid deployment ID is required');
    }

    const deployment = await this.deploymentRepository.findById(id);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const result = await this.deploymentRepository.delete(id);

    // Log audit trail
    await this.auditLogRepository.create({
      user_id: deployment.user_id,
      action: 'DELETE',
      resource_type: 'deployment',
      resource_id: id.toString(),
      details: { project_name: deployment.project_name, environment: deployment.environment }
    });

    return result;
  }

  async getAllDeployments(limit = 50, offset = 0) {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    return await this.deploymentRepository.findAll(limit, offset);
  }

  async getDeploymentCount() {
    return await this.deploymentRepository.count();
  }

  async getDeploymentCountByStatus(status) {
    if (!status || !Deployment.isValidStatus(status)) {
      throw new Error('Valid status is required');
    }

    return await this.deploymentRepository.countByStatus(status);
  }

  async processDeployment(deploymentId) {
    try {
      // Update status to running
      await this.updateDeploymentStatus(deploymentId, 'running');

      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Upload deployment logs to S3
      const deployment = await this.getDeploymentById(deploymentId);
      const logContent = `Deployment logs for ${deployment.project_name} in ${deployment.environment}`;
      await this.s3Service.uploadLogs(deploymentId, logContent);

      // Update status to successful
      await this.updateDeploymentStatus(deploymentId, 'successful');
    } catch (error) {
      // Update status to failed
      await this.updateDeploymentStatus(deploymentId, 'failed');
      throw error;
    }
  }
}

module.exports = DeploymentService;