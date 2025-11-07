'use strict';

const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.name = data.name;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;