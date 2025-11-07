'use strict';

const User = require('../models/User');
const UserRepository = require('../repositories/UserRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');

class UserService {
  constructor(db) {
    this.userRepository = new UserRepository(db);
    this.auditLogRepository = new AuditLogRepository(db);
  }

  async createUser(userData) {
    const { email, password, name } = userData;

    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      password_hash,
      name
    });

    // Log audit trail
    await this.auditLogRepository.create({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'user',
      resource_id: user.id.toString(),
      details: { email, name }
    });

    return user;
  }

  async getUserById(id) {
    if (!id || isNaN(id)) {
      throw new Error('Valid user ID is required');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getUserByEmail(email) {
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Valid email is required');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id, userData) {
    const { name } = userData;

    if (!id || isNaN(id)) {
      throw new Error('Valid user ID is required');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const result = await this.userRepository.update(id, { name });

    // Log audit trail
    await this.auditLogRepository.create({
      user_id: id,
      action: 'UPDATE',
      resource_type: 'user',
      resource_id: id.toString(),
      details: { name }
    });

    return result;
  }

  async deleteUser(id) {
    if (!id || isNaN(id)) {
      throw new Error('Valid user ID is required');
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const result = await this.userRepository.delete(id);

    // Log audit trail
    await this.auditLogRepository.create({
      user_id: id,
      action: 'DELETE',
      resource_type: 'user',
      resource_id: id.toString(),
      details: { email: existingUser.email }
    });

    return result;
  }

  async authenticateUser(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Log successful authentication
    await this.auditLogRepository.create({
      user_id: user.id,
      action: 'LOGIN',
      resource_type: 'user',
      resource_id: user.id.toString(),
      details: { email }
    });

    return user;
  }

  async getAllUsers(limit = 50, offset = 0) {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    return await this.userRepository.findAll(limit, offset);
  }

  async getUserCount() {
    return await this.userRepository.count();
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = UserService;