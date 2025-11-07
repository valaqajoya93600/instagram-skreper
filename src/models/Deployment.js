'use strict';

class Deployment {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.project_name = data.project_name;
    this.environment = data.environment;
    this.status = data.status;
    this.config = data.config ? JSON.parse(data.config) : null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.updated_at = new Date().toISOString();
  }

  updateConfig(newConfig) {
    this.config = newConfig;
    this.updated_at = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      project_name: this.project_name,
      environment: this.environment,
      status: this.status,
      config: this.config,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static isValidEnvironment(environment) {
    return ['development', 'staging', 'production'].includes(environment);
  }

  static isValidStatus(status) {
    return ['pending', 'running', 'successful', 'failed', 'cancelled'].includes(status);
  }
}

module.exports = Deployment;