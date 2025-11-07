'use strict';

const AuditLog = require('../models/AuditLog');

class AuditLogRepository {
  constructor(db) {
    this.db = db;
  }

  async create(logData) {
    const { user_id, action, resource_type, resource_id, details } = logData;
    const detailsString = details ? JSON.stringify(details) : null;
    
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([user_id, action, resource_type, resource_id, detailsString], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            user_id, 
            action, 
            resource_type, 
            resource_id,
            details
          });
        }
      });
      
      stmt.finalize();
    });
  }

  async findByUserId(userId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new AuditLog(row)));
          }
        }
      );
    });
  }

  async findByResource(resourceType, resourceId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM audit_logs WHERE resource_type = ? AND resource_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [resourceType, resourceId, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new AuditLog(row)));
          }
        }
      );
    });
  }

  async findByAction(action, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [action, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new AuditLog(row)));
          }
        }
      );
    });
  }

  async findAll(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => new AuditLog(row)));
          }
        }
      );
    });
  }

  async count() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM audit_logs',
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

module.exports = AuditLogRepository;