'use strict';

const User = require('../models/User');

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async create(userData) {
    const { email, password_hash, name } = userData;
    
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO users (email, password_hash, name) 
        VALUES (?, ?, ?)
      `);
      
      stmt.run([email, password_hash, name], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, email, name });
        }
      });
      
      stmt.finalize();
    });
  }

  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? new User(row) : null);
          }
        }
      );
    });
  }

  async findByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? new User(row) : null);
          }
        }
      );
    });
  }

  async update(id, userData) {
    const { name } = userData;
    const updated_at = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET name = ?, updated_at = ? WHERE id = ?',
        [name, updated_at, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM users WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async findAll(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new User(row)));
          }
        }
      );
    });
  }

  async count() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM users',
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        }
      );
    });
  }
}

module.exports = UserRepository;