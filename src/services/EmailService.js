'use strict';

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password'
      }
    });
  }

  async sendDeploymentNotification(email, deploymentData) {
    const { project_name, environment, status } = deploymentData;

    if (!email || !project_name || !environment || !status) {
      throw new Error('Email, project name, environment, and status are required');
    }

    const subject = `Deployment ${status}: ${project_name} (${environment})`;
    const html = this.generateDeploymentEmailHTML(project_name, environment, status);

    try {
      const result = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@railway-deploy.com',
        to: email,
        subject,
        html
      });

      return {
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      throw new Error(`Failed to send deployment notification: ${error.message}`);
    }
  }

  async sendWelcomeEmail(email, userData) {
    const { name } = userData;

    if (!email || !name) {
      throw new Error('Email and name are required');
    }

    const subject = 'Welcome to Railway Deployment Automation';
    const html = this.generateWelcomeEmailHTML(name);

    try {
      const result = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@railway-deploy.com',
        to: email,
        subject,
        html
      });

      return {
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email, resetToken) {
    if (!email || !resetToken) {
      throw new Error('Email and reset token are required');
    }

    const subject = 'Password Reset Request';
    const html = this.generatePasswordResetEmailHTML(resetToken);

    try {
      const result = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@railway-deploy.com',
        to: email,
        subject,
        html
      });

      return {
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  generateDeploymentEmailHTML(projectName, environment, status) {
    const statusColor = status === 'successful' ? '#28a745' : status === 'failed' ? '#dc3545' : '#ffc107';
    const statusIcon = status === 'successful' ? '✅' : status === 'failed' ? '❌' : '⏳';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Deployment Notification</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>${statusIcon} Deployment ${status.toUpperCase()}</h3>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Environment:</strong> ${environment}</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          This is an automated message from Railway Deployment Automation.
        </p>
      </div>
    `;
  }

  generateWelcomeEmailHTML(name) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Railway Deployment Automation! 🚀</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Welcome aboard! We're excited to have you join our platform.</p>
          <p>With Railway Deployment Automation, you can:</p>
          <ul>
            <li>Deploy applications with ease</li>
            <li>Monitor deployment status in real-time</li>
            <li>Manage multiple environments</li>
            <li>Access detailed deployment logs</li>
          </ul>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
    `;
  }

  generatePasswordResetEmailHTML(resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p>You requested a password reset for your account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
          </p>
        </div>
      </div>
    `;
  }
}

module.exports = EmailService;