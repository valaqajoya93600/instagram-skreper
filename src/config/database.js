'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db = null;

function initializeDatabase() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        // Create tables if they don't exist
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
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    });
  });
}

function getDatabase() {
  // For tests, return the test database if available
  if (process.env.NODE_ENV === 'test') {
    const { getDatabase: getTestDatabase } = require('../../tests/helpers/database');
    const testDb = getTestDatabase();
    if (testDb) return testDb;
  }
  
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  if (db) {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        db = null;
        resolve();
      });
    });
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};