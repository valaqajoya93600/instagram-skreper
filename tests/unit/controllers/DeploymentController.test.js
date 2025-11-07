'use strict';

const DeploymentController = require('../../../src/controllers/DeploymentController');
const DeploymentService = require('../../../src/services/DeploymentService');

// Mock DeploymentService
jest.mock('../../../src/services/DeploymentService');

describe('DeploymentController', () => {
  let deploymentController;
  let mockReq;
  let mockRes;
  let mockDeploymentService;

  beforeEach(() => {
    mockDeploymentService = new DeploymentService();
    deploymentController = new DeploymentController();
    
    mockReq = {
      params: {},
      body: {},
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createDeployment', () => {
    it('should create deployment successfully', async () => {
      const deploymentData = {
        user_id: 1,
        project_name: 'test-project',
        environment: 'production',
        config: { memory: '512MB' }
      };

      const createdDeployment = { 
        id: 1, 
        user_id: deploymentData.user_id,
        project_name: deploymentData.project_name,
        environment: deploymentData.environment,
        status: 'pending'
      };
      
      mockDeploymentService.createDeployment.mockResolvedValue(createdDeployment);

      mockReq.body = deploymentData;

      await deploymentController.createDeployment(mockReq, mockRes);

      expect(mockDeploymentService.createDeployment).toHaveBeenCalledWith(deploymentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdDeployment,
        message: 'Deployment created successfully'
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Creation failed');
      mockDeploymentService.createDeployment.mockRejectedValue(error);

      mockReq.body = { user_id: 1 };

      await deploymentController.createDeployment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Creation failed'
      });
    });
  });

  describe('getDeploymentById', () => {
    it('should get deployment by ID successfully', async () => {
      const deploymentId = '1';
      const deployment = { 
        id: 1, 
        project_name: 'test-project',
        environment: 'production',
        status: 'pending'
      };
      const deploymentJSON = { 
        id: 1, 
        project_name: 'test-project',
        environment: 'production',
        status: 'pending'
      };
      
      mockDeploymentService.getDeploymentById.mockResolvedValue(deployment);
      deployment.toJSON = jest.fn().mockReturnValue(deploymentJSON);

      mockReq.params.id = deploymentId;

      await deploymentController.getDeploymentById(mockReq, mockRes);

      expect(mockDeploymentService.getDeploymentById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: deploymentJSON
      });
    });

    it('should handle deployment not found', async () => {
      const error = new Error('Deployment not found');
      mockDeploymentService.getDeploymentById.mockRejectedValue(error);

      mockReq.params.id = '999';

      await deploymentController.getDeploymentById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Deployment not found'
      });
    });
  });

  describe('getDeploymentsByUserId', () => {
    it('should get deployments by user ID successfully', async () => {
      const userId = '1';
      const deployments = [
        { id: 1, project_name: 'project-1', user_id: 1 },
        { id: 2, project_name: 'project-2', user_id: 1 }
      ];
      const deploymentsJSON = [
        { id: 1, project_name: 'project-1', user_id: 1 },
        { id: 2, project_name: 'project-2', user_id: 1 }
      ];
      
      mockDeploymentService.getDeploymentsByUserId.mockResolvedValue(deployments);
      mockDeploymentService.getDeploymentCount.mockResolvedValue(2);
      deployments.forEach((deployment, index) => {
        deployment.toJSON = jest.fn().mockReturnValue(deploymentsJSON[index]);
      });

      mockReq.params.userId = userId;
      mockReq.query = { limit: '10', offset: '0' };

      await deploymentController.getDeploymentsByUserId(mockReq, mockRes);

      expect(mockDeploymentService.getDeploymentsByUserId).toHaveBeenCalledWith(1, 10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: deploymentsJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      });
    });

    it('should use default pagination values', async () => {
      mockDeploymentService.getDeploymentsByUserId.mockResolvedValue([]);
      mockDeploymentService.getDeploymentCount.mockResolvedValue(0);

      mockReq.params.userId = '1';
      mockReq.query = {};

      await deploymentController.getDeploymentsByUserId(mockReq, mockRes);

      expect(mockDeploymentService.getDeploymentsByUserId).toHaveBeenCalledWith(1, 50, 0);
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
  });

  describe('updateDeploymentStatus', () => {
    it('should update deployment status successfully', async () => {
      const deploymentId = '1';
      const status = 'running';
      const result = { changes: 1 };
      
      mockDeploymentService.updateDeploymentStatus.mockResolvedValue(result);

      mockReq.params.id = deploymentId;
      mockReq.body = { status };

      await deploymentController.updateDeploymentStatus(mockReq, mockRes);

      expect(mockDeploymentService.updateDeploymentStatus).toHaveBeenCalledWith(1, status);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Deployment status updated successfully'
      });
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      mockDeploymentService.updateDeploymentStatus.mockRejectedValue(error);

      mockReq.params.id = '1';
      mockReq.body = { status: 'running' };

      await deploymentController.updateDeploymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Update failed'
      });
    });
  });

  describe('cancelDeployment', () => {
    it('should cancel deployment successfully', async () => {
      const deploymentId = '1';
      const result = { changes: 1 };
      
      mockDeploymentService.cancelDeployment.mockResolvedValue(result);

      mockReq.params.id = deploymentId;

      await deploymentController.cancelDeployment(mockReq, mockRes);

      expect(mockDeploymentService.cancelDeployment).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Deployment cancelled successfully'
      });
    });

    it('should handle cancellation error', async () => {
      const error = new Error('Cannot cancel');
      mockDeploymentService.cancelDeployment.mockRejectedValue(error);

      mockReq.params.id = '1';

      await deploymentController.cancelDeployment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot cancel'
      });
    });
  });

  describe('deleteDeployment', () => {
    it('should delete deployment successfully', async () => {
      const deploymentId = '1';
      const result = { changes: 1 };
      
      mockDeploymentService.deleteDeployment.mockResolvedValue(result);

      mockReq.params.id = deploymentId;

      await deploymentController.deleteDeployment(mockReq, mockRes);

      expect(mockDeploymentService.deleteDeployment).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Deployment deleted successfully'
      });
    });

    it('should handle deletion error', async () => {
      const error = new Error('Deletion failed');
      mockDeploymentService.deleteDeployment.mockRejectedValue(error);

      mockReq.params.id = '1';

      await deploymentController.deleteDeployment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Deletion failed'
      });
    });
  });

  describe('getAllDeployments', () => {
    it('should get all deployments successfully', async () => {
      const deployments = [
        { id: 1, project_name: 'project-1' },
        { id: 2, project_name: 'project-2' }
      ];
      const deploymentsJSON = [
        { id: 1, project_name: 'project-1' },
        { id: 2, project_name: 'project-2' }
      ];
      
      mockDeploymentService.getAllDeployments.mockResolvedValue(deployments);
      mockDeploymentService.getDeploymentCount.mockResolvedValue(2);
      deployments.forEach((deployment, index) => {
        deployment.toJSON = jest.fn().mockReturnValue(deploymentsJSON[index]);
      });

      mockReq.query = { limit: '10', offset: '0' };

      await deploymentController.getAllDeployments(mockReq, mockRes);

      expect(mockDeploymentService.getAllDeployments).toHaveBeenCalledWith(10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: deploymentsJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      });
    });

    it('should use default pagination values', async () => {
      mockDeploymentService.getAllDeployments.mockResolvedValue([]);
      mockDeploymentService.getDeploymentCount.mockResolvedValue(0);

      mockReq.query = {};

      await deploymentController.getAllDeployments(mockReq, mockRes);

      expect(mockDeploymentService.getAllDeployments).toHaveBeenCalledWith(50, 0);
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
  });

  describe('getDeploymentLogs', () => {
    it('should get deployment logs successfully', async () => {
      const deploymentId = '1';
      const deployment = { 
        id: 1, 
        project_name: 'test-project',
        environment: 'production',
        status: 'successful',
        config: { memory: '512MB' }
      };
      
      mockDeploymentService.getDeploymentById.mockResolvedValue(deployment);

      mockReq.params.id = deploymentId;

      await deploymentController.getDeploymentLogs(mockReq, mockRes);

      expect(mockDeploymentService.getDeploymentById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          deployment_id: 1,
          logs: expect.stringContaining('test-project')
        }
      });
    });

    it('should handle deployment not found', async () => {
      const error = new Error('Deployment not found');
      mockDeploymentService.getDeploymentById.mockRejectedValue(error);

      mockReq.params.id = '999';

      await deploymentController.getDeploymentLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Deployment not found'
      });
    });
  });

  describe('getDeploymentsByStatus', () => {
    it('should get deployments by status successfully', async () => {
      const status = 'pending';
      const deployments = [
        { id: 1, project_name: 'project-1', status: 'pending' }
      ];
      const deploymentsJSON = [
        { id: 1, project_name: 'project-1', status: 'pending' }
      ];
      
      mockDeploymentService.getDeploymentsByStatus.mockResolvedValue(deployments);
      mockDeploymentService.getDeploymentCountByStatus.mockResolvedValue(1);
      deployments.forEach((deployment, index) => {
        deployment.toJSON = jest.fn().mockReturnValue(deploymentsJSON[index]);
      });

      mockReq.params.status = status;
      mockReq.query = { limit: '10', offset: '0' };

      await deploymentController.getDeploymentsByStatus(mockReq, mockRes);

      expect(mockDeploymentService.getDeploymentsByStatus).toHaveBeenCalledWith(status, 10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: deploymentsJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1
        }
      });
    });

    it('should use default pagination values', async () => {
      mockDeploymentService.getDeploymentsByStatus.mockResolvedValue([]);
      mockDeploymentService.getDeploymentCountByStatus.mockResolvedValue(0);

      mockReq.params.status = 'pending';
      mockReq.query = {};

      await deploymentController.getDeploymentsByStatus(mockReq, mockRes);

      expect(mockDeploymentService.getDeploymentsByStatus).toHaveBeenCalledWith('pending', 50, 0);
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
  });
});