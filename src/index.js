'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { initializeDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Import controllers
const UserController = require('./controllers/UserController');
const DeploymentController = require('./controllers/DeploymentController');
const AuditController = require('./controllers/AuditController');

// Initialize Express app
const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);

// Initialize controllers
const userController = new UserController();
const deploymentController = new DeploymentController();
const auditController = new AuditController();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Railway Deployment Automation API',
    version: '1.0.0',
    endpoints: {
      health: '/healthz',
      users: '/api/users',
      deployments: '/api/deployments',
      audit: '/api/audit'
    }
  });
});

// User routes
app.post('/api/users', userController.createUser.bind(userController));
app.get('/api/users', userController.getAllUsers.bind(userController));
app.get('/api/users/:id', userController.getUserById.bind(userController));
app.put('/api/users/:id', userController.updateUser.bind(userController));
app.delete('/api/users/:id', userController.deleteUser.bind(userController));
app.post('/api/auth/login', userController.authenticateUser.bind(userController));
app.get('/api/profile', userController.getUserProfile.bind(userController));

// Deployment routes
app.post('/api/deployments', deploymentController.createDeployment.bind(deploymentController));
app.get('/api/deployments', deploymentController.getAllDeployments.bind(deploymentController));
app.get('/api/deployments/:id', deploymentController.getDeploymentById.bind(deploymentController));
app.put('/api/deployments/:id/status', deploymentController.updateDeploymentStatus.bind(deploymentController));
app.post('/api/deployments/:id/cancel', deploymentController.cancelDeployment.bind(deploymentController));
app.delete('/api/deployments/:id', deploymentController.deleteDeployment.bind(deploymentController));
app.get('/api/deployments/:id/logs', deploymentController.getDeploymentLogs.bind(deploymentController));
app.get('/api/users/:userId/deployments', deploymentController.getDeploymentsByUserId.bind(deploymentController));
app.get('/api/deployments/status/:status', deploymentController.getDeploymentsByStatus.bind(deploymentController));

// Audit routes
app.get('/api/audit', auditController.getAllAuditLogs.bind(auditController));
app.get('/api/audit/users/:userId', auditController.getAuditLogsByUserId.bind(auditController));
app.get('/api/audit/resource/:resourceType/:resourceId', auditController.getAuditLogsByResource.bind(auditController));
app.get('/api/audit/action/:action', auditController.getAuditLogsByAction.bind(auditController));
app.get('/api/audit/users/:userId/summary', auditController.getUserActivitySummary.bind(auditController));
app.get('/api/audit/system/summary', auditController.getSystemActivitySummary.bind(auditController));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Railway Deployment Automation API listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
      console.log(`📚 API documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the application
startServer();

module.exports = app;
