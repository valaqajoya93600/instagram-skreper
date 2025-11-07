'use strict';

const UserService = require('../../../src/services/UserService');
const User = require('../../../src/models/User');
const { getDatabase } = require('../../../tests/helpers/database');

describe('UserService', () => {
  let userService;
  let mockDb;

  beforeEach(async () => {
    mockDb = getDatabase();
    userService = new UserService(mockDb);
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const result = await userService.createUser(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.id).toBeDefined();
    });

    it('should throw error for missing required fields', async () => {
      const userData = {
        email: 'test@example.com'
        // missing password and name
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Email, password, and name are required');
    });

    it('should throw error for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // Create first user
      await userService.createUser(userData);

      // Try to create duplicate
      await expect(userService.createUser(userData)).rejects.toThrow('User with this email already exists');
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await userService.createUser(userData);

      const user = await userService.getUserByEmail(userData.email);
      expect(user.password_hash).not.toBe(userData.password);
      expect(user.password_hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createdUser = await userService.createUser(userData);
      const foundUser = await userService.getUserById(createdUser.id);

      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser.name).toBe(userData.name);
    });

    it('should throw error for invalid ID', async () => {
      await expect(userService.getUserById('invalid')).rejects.toThrow('Valid user ID is required');
    });

    it('should throw error when user not found', async () => {
      await expect(userService.getUserById(99999)).rejects.toThrow('User not found');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await userService.createUser(userData);
      const foundUser = await userService.getUserByEmail(userData.email);

      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser.email).toBe(userData.email);
    });

    it('should throw error for invalid email', async () => {
      await expect(userService.getUserByEmail('invalid')).rejects.toThrow('Valid email is required');
    });

    it('should throw error when user not found', async () => {
      await expect(userService.getUserByEmail('nonexistent@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createdUser = await userService.createUser(userData);
      const updateData = { name: 'Updated Name' };

      const result = await userService.updateUser(createdUser.id, updateData);

      expect(result.changes).toBe(1);

      const updatedUser = await userService.getUserById(createdUser.id);
      expect(updatedUser.name).toBe(updateData.name);
    });

    it('should throw error for invalid ID', async () => {
      await expect(userService.updateUser('invalid', {})).rejects.toThrow('Valid user ID is required');
    });

    it('should throw error for empty name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createdUser = await userService.createUser(userData);

      await expect(userService.updateUser(createdUser.id, { name: '' })).rejects.toThrow('Name is required');
    });

    it('should throw error when user not found', async () => {
      await expect(userService.updateUser(99999, { name: 'Updated' })).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const createdUser = await userService.createUser(userData);
      const result = await userService.deleteUser(createdUser.id);

      expect(result.changes).toBe(1);

      await expect(userService.getUserById(createdUser.id)).rejects.toThrow('User not found');
    });

    it('should throw error for invalid ID', async () => {
      await expect(userService.deleteUser('invalid')).rejects.toThrow('Valid user ID is required');
    });

    it('should throw error when user not found', async () => {
      await expect(userService.deleteUser(99999)).rejects.toThrow('User not found');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate with correct credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await userService.createUser(userData);
      const authenticatedUser = await userService.authenticateUser(userData.email, userData.password);

      expect(authenticatedUser).toBeInstanceOf(User);
      expect(authenticatedUser.email).toBe(userData.email);
    });

    it('should throw error for missing credentials', async () => {
      await expect(userService.authenticateUser('', 'password')).rejects.toThrow('Email and password are required');
      await expect(userService.authenticateUser('test@example.com', '')).rejects.toThrow('Email and password are required');
    });

    it('should throw error for invalid email', async () => {
      await expect(userService.authenticateUser('nonexistent@example.com', 'password')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await userService.createUser(userData);

      await expect(userService.authenticateUser(userData.email, 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      // Create multiple users
      for (let i = 1; i <= 5; i++) {
        await userService.createUser({
          email: `user${i}@example.com`,
          password: 'password123',
          name: `User ${i}`
        });
      }

      const users = await userService.getAllUsers(3, 0);

      expect(users).toHaveLength(3);
      expect(users[0]).toBeInstanceOf(User);
    });

    it('should throw error for invalid limit', async () => {
      await expect(userService.getAllUsers(0, 0)).rejects.toThrow('Limit must be between 1 and 100');
      await expect(userService.getAllUsers(101, 0)).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for invalid offset', async () => {
      await expect(userService.getAllUsers(10, -1)).rejects.toThrow('Offset must be non-negative');
    });
  });

  describe('getUserCount', () => {
    it('should return correct user count', async () => {
      const initialCount = await userService.getUserCount();
      expect(typeof initialCount).toBe('number');

      // Create users
      await userService.createUser({
        email: 'user1@example.com',
        password: 'password123',
        name: 'User 1'
      });

      await userService.createUser({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2'
      });

      const newCount = await userService.getUserCount();
      expect(newCount).toBe(initialCount + 2);
    });
  });

  describe('isValidEmail', () => {
    it('should validate email correctly', () => {
      expect(userService.isValidEmail('test@example.com')).toBe(true);
      expect(userService.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(userService.isValidEmail('invalid')).toBe(false);
      expect(userService.isValidEmail('@example.com')).toBe(false);
      expect(userService.isValidEmail('test@')).toBe(false);
      expect(userService.isValidEmail('test@example')).toBe(false);
    });
  });
});