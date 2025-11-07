'use strict';

const UserService = require('../services/UserService');
const { getDatabase } = require('../config/database');

class UserController {
  constructor() {
    this.userService = new UserService(getDatabase());
  }

  async createUser(req, res) {
    try {
      const { email, password, name } = req.body;
      const user = await this.userService.createUser({ email, password, name });
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const result = await this.userService.updateUser(parseInt(id), { name });
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await this.userService.deleteUser(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async authenticateUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await this.userService.authenticateUser(email, password);
      
      res.status(200).json({
        success: true,
        data: user.toJSON(),
        message: 'Authentication successful'
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const users = await this.userService.getAllUsers(limit, offset);
      
      res.status(200).json({
        success: true,
        data: users.map(user => user.toJSON()),
        pagination: {
          limit,
          offset,
          total: await this.userService.getUserCount()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getUserProfile(req, res) {
    try {
      // Assuming user ID is available from authentication middleware
      const userId = req.user ? req.user.id : 1; // Default to 1 for testing
      const user = await this.userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = UserController;