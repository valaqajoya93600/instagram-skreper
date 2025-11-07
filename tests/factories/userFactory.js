'use strict';

const bcrypt = require('bcryptjs');

class UserFactory {
  static create(overrides = {}) {
    const defaultUser = {
      id: Math.floor(Math.random() * 1000) + 1,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      name: `Test User ${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const user = { ...defaultUser, ...overrides };
    
    // Generate password hash if password is provided
    if (overrides.password) {
      user.password_hash = bcrypt.hashSync(overrides.password, 10);
    } else {
      user.password_hash = bcrypt.hashSync('password123', 10);
    }

    return user;
  }

  static createMany(count, overrides = {}) {
    return Array.from({ length: count }, (_, index) => 
      this.create({ ...overrides, email: `user${index}@example.com` })
    );
  }

  static createValid() {
    return this.create({
      email: 'valid.user@example.com',
      name: 'Valid Test User',
      password: 'ValidPassword123!'
    });
  }

  static createWithRole(role) {
    return this.create({
      email: `${role}@example.com`,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      role
    });
  }
}

module.exports = UserFactory;