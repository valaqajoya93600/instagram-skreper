'use strict';

const UserController = require('../../../src/controllers/UserController');
const UserService = require('../../../src/services/UserService');

// Mock UserService
jest.mock('../../../src/services/UserService');

describe('UserController', () => {
  let userController;
  let mockReq;
  let mockRes;
  let mockUserService;

  beforeEach(() => {
    mockUserService = new UserService();
    userController = new UserController();
    
    mockReq = {
      params: {},
      body: {},
      user: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createdUser = { id: 1, email: userData.email, name: userData.name };
      mockUserService.createUser.mockResolvedValue(createdUser);

      mockReq.body = userData;

      await userController.createUser(mockReq, mockRes);

      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser,
        message: 'User created successfully'
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Creation failed');
      mockUserService.createUser.mockRejectedValue(error);

      mockReq.body = { email: 'test@example.com' };

      await userController.createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Creation failed'
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const userId = '1';
      const user = { id: 1, email: 'test@example.com', name: 'Test User' };
      const userJSON = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockUserService.getUserById.mockResolvedValue(user);
      user.toJSON = jest.fn().mockReturnValue(userJSON);

      mockReq.params.id = userId;

      await userController.getUserById(mockReq, mockRes);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: userJSON
      });
    });

    it('should handle user not found', async () => {
      const error = new Error('User not found');
      mockUserService.getUserById.mockRejectedValue(error);

      mockReq.params.id = '999';

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = '1';
      const updateData = { name: 'Updated Name' };
      const result = { changes: 1 };
      
      mockUserService.updateUser.mockResolvedValue(result);

      mockReq.params.id = userId;
      mockReq.body = updateData;

      await userController.updateUser(mockReq, mockRes);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'User updated successfully'
      });
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      mockUserService.updateUser.mockRejectedValue(error);

      mockReq.params.id = '1';
      mockReq.body = { name: 'Updated Name' };

      await userController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Update failed'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = '1';
      const result = { changes: 1 };
      
      mockUserService.deleteUser.mockResolvedValue(result);

      mockReq.params.id = userId;

      await userController.deleteUser(mockReq, mockRes);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'User deleted successfully'
      });
    });

    it('should handle deletion error', async () => {
      const error = new Error('Deletion failed');
      mockUserService.deleteUser.mockRejectedValue(error);

      mockReq.params.id = '1';

      await userController.deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Deletion failed'
      });
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user successfully', async () => {
      const authData = { email: 'test@example.com', password: 'password123' };
      const user = { id: 1, email: authData.email, name: 'Test User' };
      const userJSON = { id: 1, email: authData.email, name: 'Test User' };
      
      mockUserService.authenticateUser.mockResolvedValue(user);
      user.toJSON = jest.fn().mockReturnValue(userJSON);

      mockReq.body = authData;

      await userController.authenticateUser(mockReq, mockRes);

      expect(mockUserService.authenticateUser).toHaveBeenCalledWith(authData.email, authData.password);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: userJSON,
        message: 'Authentication successful'
      });
    });

    it('should handle authentication error', async () => {
      const error = new Error('Invalid credentials');
      mockUserService.authenticateUser.mockRejectedValue(error);

      mockReq.body = { email: 'test@example.com', password: 'wrongpassword' };

      await userController.authenticateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const users = [
        { id: 1, email: 'user1@example.com', name: 'User 1' },
        { id: 2, email: 'user2@example.com', name: 'User 2' }
      ];
      const usersJSON = [
        { id: 1, email: 'user1@example.com', name: 'User 1' },
        { id: 2, email: 'user2@example.com', name: 'User 2' }
      ];
      
      mockUserService.getAllUsers.mockResolvedValue(users);
      mockUserService.getUserCount.mockResolvedValue(2);
      users.forEach((user, index) => {
        user.toJSON = jest.fn().mockReturnValue(usersJSON[index]);
      });

      mockReq.query = { limit: '10', offset: '0' };

      await userController.getAllUsers(mockReq, mockRes);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: usersJSON,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      });
    });

    it('should use default pagination values', async () => {
      mockUserService.getAllUsers.mockResolvedValue([]);
      mockUserService.getUserCount.mockResolvedValue(0);

      mockReq.query = {};

      await userController.getAllUsers(mockReq, mockRes);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(50, 0);
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

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Test User' };
      const userJSON = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockUserService.getUserById.mockResolvedValue(user);
      user.toJSON = jest.fn().mockReturnValue(userJSON);

      mockReq.user = { id: 1 };

      await userController.getUserProfile(mockReq, mockRes);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: userJSON
      });
    });

    it('should use default user ID when req.user is null', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Test User' };
      const userJSON = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockUserService.getUserById.mockResolvedValue(user);
      user.toJSON = jest.fn().mockReturnValue(userJSON);

      mockReq.user = null;

      await userController.getUserProfile(mockReq, mockRes);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: userJSON
      });
    });

    it('should handle profile error', async () => {
      const error = new Error('User not found');
      mockUserService.getUserById.mockRejectedValue(error);

      mockReq.user = { id: 999 };

      await userController.getUserProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });
});