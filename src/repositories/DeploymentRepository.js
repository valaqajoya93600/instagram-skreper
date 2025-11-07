'use strict';

const Deployment = require('../models/Deployment');

class DeploymentRepository {
  constructor(db) {
    this.db = db;
  }

  async create(deploymentData) {
    const { user_id, project_name, environment, status = 'pending', config } = deploymentData;
    const configString = config ? JSON.stringify(config) : null;
    
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO deployments (user_id, project_name, environment, status, config) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([user_id, project_name, environment, status, configString], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            user_id, 
            project_name, 
            environment, 
            status,
            config
          });
        }
      });
      
      stmt.finalize();
    });
  }

  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM deployments WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? new Deployment(row) : null);
          }
        }
      );
    });
  }

  async findByUserId(userId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM deployments WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new Deployment(row)));
          }
        }
      );
    });
  }

  async findByStatus(status, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM deployments WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [status, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new Deployment(row)));
          }
        }
      );
    });
  }

  async update(id, deploymentData) {
    const { status, config } = deploymentData;
    const configString = config ? JSON.stringify(config) : null;
    const updated_at = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      const updates = [];
      const values = [];
      
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      
      if (config !== undefined) {
        updates.push('config = ?');
        values.push(configString);
      }
      
      updates.push('updated_at = ?');
      values.push(updated_at);
      values.push(id);
      
      this.db.run(
        `UPDATE deployments SET ${updates.join(', ')} WHERE id = ?`,
        values,
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
        'DELETE FROM deployments WHERE id = ?',
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
        'SELECT * FROM deployments ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new Deployment(row)));
          }
        }
      );
    });
  }

  async count() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM deployments',
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

  async countByStatus(status) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM deployments WHERE status = ?',
        [status],
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

module.exports = DeploymentRepository;