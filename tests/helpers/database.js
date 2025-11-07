'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db = null;

async function setupDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
      } else {
        // Create tables
        db.serialize(() => {
          db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              name TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS deployments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              project_name TEXT NOT NULL,
              environment TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'pending',
              config TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id)
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              action TEXT NOT NULL,
              resource_type TEXT NOT NULL,
              resource_id TEXT,
              details TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id)
            )
          `);
        });
        resolve();
      }
    });
  });
}

async function teardownDatabase() {
  if (!db) return;
  
  return new Promise((resolve, reject) => {
    // Clear all tables but keep structure
    db.serialize(() => {
      db.run('DELETE FROM audit_logs');
      db.run('DELETE FROM deployments');
      db.run('DELETE FROM users', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

function getDatabase() {
  return db;
}

module.exports = {
  setupDatabase,
  teardownDatabase,
  getDatabase,
};