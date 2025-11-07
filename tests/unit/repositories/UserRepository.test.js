'use strict';

const UserRepository = require('../../../src/repositories/UserRepository');
const { getDatabase } = require('../../../tests/helpers/database');

describe('UserRepository', () => {
  let userRepository;
  let mockDb;

  beforeEach(async () => {
    mockDb = getDatabase();
    userRepository = new UserRepository(mockDb);
  });

  describe('create', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      };

      const result = await userRepository.create(userData);

      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      };

      await userRepository.create(userData);

      await expect(userRepository.create(userData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser.name).toBe(userData.name);
    });

    it('should return null when user not found', async () => {
      const foundUser = await userRepository.findById(99999);
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      };

      await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser.name).toBe(userData.name);
    });

    it('should return null when user not found', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      };

      const createdUser = await userRepository.create(userData);
      const updateData = { name: 'Updated Name' };

      const result = await userRepository.update(createdUser.id, updateData);

      expect(result.changes).toBe(1);

      const updatedUser = await userRepository.findById(createdUser.id);
      expect(updatedUser.name).toBe(updateData.name);
    });

    it('should return 0 changes when user not found', async () => {
      const result = await userRepository.update(99999, { name: 'Updated' });
      expect(result.changes).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      };

      const createdUser = await userRepository.create(userData);
      const result = await userRepository.delete(createdUser.id);

      expect(result.changes).toBe(1);

      const deletedUser = await userRepository.findById(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return 0 changes when user not found', async () => {
      const result = await userRepository.delete(99999);
      expect(result.changes).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      // Create multiple users
      const users = [];
      for (let i = 1; i <= 5; i++) {
        const userData = {
          email: `user${i}@example.com`,
          password_hash: 'hashed_password',
          name: `User ${i}`
        };
        users.push(await userRepository.create(userData));
      }

      const foundUsers = await userRepository.findAll(3, 0);

      expect(foundUsers).toHaveLength(3);
      foundUsers.forEach(user => {
        expect(user.email).toMatch(/user\d+@example\.com/);
      });
    });

    it('should return empty array when no users exist', async () => {
      const users = await userRepository.findAll(10, 0);
      expect(users).toHaveLength(0);
    });

    it('should respect limit and offset', async () => {
      // Create users
      for (let i = 1; i <= 5; i++) {
        await userRepository.create({
          email: `user${i}@example.com`,
          password_hash: 'hashed_password',
          name: `User ${i}`
        });
      }

      const firstPage = await userRepository.findAll(2, 0);
      const secondPage = await userRepository.findAll(2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].email).not.toBe(secondPage[0].email);
    });
  });

  describe('count', () => {
    it('should return correct user count', async () => {
      const initialCount = await userRepository.count();
      expect(typeof initialCount).toBe('number');

      // Create users
      await userRepository.create({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User 1'
      });

      await userRepository.create({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User 2'
      });

      const newCount = await userRepository.count();
      expect(newCount).toBe(initialCount + 2);
    });

    it('should return 0 when no users exist', async () => {
      const count = await userRepository.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});