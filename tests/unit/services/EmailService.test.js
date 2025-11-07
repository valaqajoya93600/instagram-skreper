'use strict';

const EmailService = require('../../../src/services/EmailService');
const nodemailer = require('nodemailer');

describe('EmailService', () => {
  let emailService;
  let mockTransporter;

  beforeEach(() => {
    // Get the mocked transporter
    mockTransporter = nodemailer.createTransporter();
    emailService = new EmailService();
  });

  describe('sendDeploymentNotification', () => {
    it('should send deployment notification email', async () => {
      const email = 'test@example.com';
      const deploymentData = {
        project_name: 'test-project',
        environment: 'production',
        status: 'successful'
      };

      const mockSendResult = {
        messageId: 'mock-message-id',
        response: '250 OK'
      };

      mockTransporter.sendMail.mockResolvedValue(mockSendResult);

      const result = await emailService.sendDeploymentNotification(email, deploymentData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.FROM_EMAIL || 'noreply@railway-deploy.com',
        to: email,
        subject: 'Deployment successful: test-project (production)',
        html: expect.stringContaining('Deployment successful')
      });

      expect(result).toEqual({
        messageId: mockSendResult.messageId,
        response: mockSendResult.response
      });
    });

    it('should handle failed deployment status', async () => {
      const email = 'test@example.com';
      const deploymentData = {
        project_name: 'test-project',
        environment: 'production',
        status: 'failed'
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'mock-message-id',
        response: '250 OK'
      });

      await emailService.sendDeploymentNotification(email, deploymentData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Deployment failed: test-project (production)',
          html: expect.stringContaining('❌')
        })
      );
    });

    it('should throw error for missing email', async () => {
      const deploymentData = {
        project_name: 'test-project',
        environment: 'production',
        status: 'successful'
      };

      await expect(emailService.sendDeploymentNotification(null, deploymentData))
        .rejects.toThrow('Email, project name, environment, and status are required');
    });

    it('should throw error for missing deployment data', async () => {
      await expect(emailService.sendDeploymentNotification('test@example.com', null))
        .rejects.toThrow('Email, project name, environment, and status are required');
    });

    it('should handle send error', async () => {
      const email = 'test@example.com';
      const deploymentData = {
        project_name: 'test-project',
        environment: 'production',
        status: 'successful'
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      await expect(emailService.sendDeploymentNotification(email, deploymentData))
        .rejects.toThrow('Failed to send deployment notification: Send failed');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const email = 'test@example.com';
      const userData = { name: 'Test User' };

      const mockSendResult = {
        messageId: 'mock-message-id',
        response: '250 OK'
      };

      mockTransporter.sendMail.mockResolvedValue(mockSendResult);

      const result = await emailService.sendWelcomeEmail(email, userData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.FROM_EMAIL || 'noreply@railway-deploy.com',
        to: email,
        subject: 'Welcome to Railway Deployment Automation',
        html: expect.stringContaining('Welcome to Railway Deployment Automation')
      });

      expect(result).toEqual({
        messageId: mockSendResult.messageId,
        response: mockSendResult.response
      });
    });

    it('should throw error for missing email', async () => {
      const userData = { name: 'Test User' };

      await expect(emailService.sendWelcomeEmail(null, userData))
        .rejects.toThrow('Email and name are required');
    });

    it('should throw error for missing name', async () => {
      const email = 'test@example.com';

      await expect(emailService.sendWelcomeEmail(email, null))
        .rejects.toThrow('Email and name are required');
    });

    it('should handle send error', async () => {
      const email = 'test@example.com';
      const userData = { name: 'Test User' };

      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      await expect(emailService.sendWelcomeEmail(email, userData))
        .rejects.toThrow('Failed to send welcome email: Send failed');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      const resetToken = 'reset-token-123';

      const mockSendResult = {
        messageId: 'mock-message-id',
        response: '250 OK'
      };

      mockTransporter.sendMail.mockResolvedValue(mockSendResult);

      const result = await emailService.sendPasswordResetEmail(email, resetToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.FROM_EMAIL || 'noreply@railway-deploy.com',
        to: email,
        subject: 'Password Reset Request',
        html: expect.stringContaining('Password Reset Request')
      });

      expect(result).toEqual({
        messageId: mockSendResult.messageId,
        response: mockSendResult.response
      });
    });

    it('should include reset token in email', async () => {
      const email = 'test@example.com';
      const resetToken = 'reset-token-123';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'mock-message-id',
        response: '250 OK'
      });

      await emailService.sendPasswordResetEmail(email, resetToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(resetToken)
        })
      );
    });

    it('should throw error for missing email', async () => {
      await expect(emailService.sendPasswordResetEmail(null, 'token'))
        .rejects.toThrow('Email and reset token are required');
    });

    it('should throw error for missing reset token', async () => {
      await expect(emailService.sendPasswordResetEmail('test@example.com', null))
        .rejects.toThrow('Email and reset token are required');
    });

    it('should handle send error', async () => {
      const email = 'test@example.com';
      const resetToken = 'reset-token-123';

      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      await expect(emailService.sendPasswordResetEmail(email, resetToken))
        .rejects.toThrow('Failed to send password reset email: Send failed');
    });
  });

  describe('generateDeploymentEmailHTML', () => {
    it('should generate HTML for successful deployment', () => {
      const projectName = 'test-project';
      const environment = 'production';
      const status = 'successful';

      const html = emailService.generateDeploymentEmailHTML(projectName, environment, status);

      expect(html).toContain('Deployment SUCCESSFUL');
      expect(html).toContain('✅');
      expect(html).toContain(projectName);
      expect(html).toContain(environment);
      expect(html).toContain('#28a745'); // Green color for success
    });

    it('should generate HTML for failed deployment', () => {
      const projectName = 'test-project';
      const environment = 'production';
      const status = 'failed';

      const html = emailService.generateDeploymentEmailHTML(projectName, environment, status);

      expect(html).toContain('Deployment FAILED');
      expect(html).toContain('❌');
      expect(html).toContain(projectName);
      expect(html).toContain(environment);
      expect(html).toContain('#dc3545'); // Red color for failure
    });

    it('should generate HTML for pending deployment', () => {
      const projectName = 'test-project';
      const environment = 'production';
      const status = 'pending';

      const html = emailService.generateDeploymentEmailHTML(projectName, environment, status);

      expect(html).toContain('Deployment PENDING');
      expect(html).toContain('⏳');
      expect(html).toContain(projectName);
      expect(html).toContain(environment);
      expect(html).toContain('#ffc107'); // Yellow color for pending
    });
  });

  describe('generateWelcomeEmailHTML', () => {
    it('should generate welcome email HTML', () => {
      const name = 'Test User';

      const html = emailService.generateWelcomeEmailHTML(name);

      expect(html).toContain('Welcome to Railway Deployment Automation');
      expect(html).toContain(name);
      expect(html).toContain('🚀');
      expect(html).toContain('Deploy applications with ease');
    });
  });

  describe('generatePasswordResetEmailHTML', () => {
    it('should generate password reset email HTML', () => {
      const resetToken = 'reset-token-123';

      const html = emailService.generatePasswordResetEmailHTML(resetToken);

      expect(html).toContain('Password Reset Request');
      expect(html).toContain(resetToken);
      expect(html).toContain('Reset Password');
      expect(html).toContain('This link will expire in 1 hour');
    });
  });
});