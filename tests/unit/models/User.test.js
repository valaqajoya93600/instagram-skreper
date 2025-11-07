'use strict';

const User = require('../../../src/models/User');

describe('User Model', () => {
  describe('constructor', () => {
    it('should create user with valid data', () => {
      const userData = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const user = new User(userData);

      expect(user.id).toBe(userData.id);
      expect(user.email).toBe(userData.email);
      expect(user.password_hash).toBe(userData.password_hash);
      expect(user.name).toBe(userData.name);
      expect(user.created_at).toBe(userData.created_at);
      expect(user.updated_at).toBe(userData.updated_at);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'password123';
      const hashedPassword = await User.hashPassword(password);
      
      const userData = {
        id: 1,
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const user = new User(userData);
      const isMatch = await user.comparePassword(password);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'password123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await User.hashPassword(password);
      
      const userData = {
        id: 1,
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const user = new User(userData);
      const isMatch = await user.comparePassword(wrongPassword);

      expect(isMatch).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'password123';
      const hashedPassword = await User.hashPassword(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'password123';
      const hash1 = await User.hashPassword(password);
      const hash2 = await User.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('toJSON', () => {
    it('should return user without password hash', () => {
      const userData = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const user = new User(userData);
      const json = user.toJSON();

      expect(json).toEqual({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      });

      expect(json.password_hash).toBeUndefined();
    });
  });
});