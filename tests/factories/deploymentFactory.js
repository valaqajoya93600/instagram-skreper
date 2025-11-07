'use strict';

class DeploymentFactory {
  static create(overrides = {}) {
    const defaultDeployment = {
      id: Math.floor(Math.random() * 1000) + 1,
      user_id: Math.floor(Math.random() * 100) + 1,
      project_name: `project-${Math.floor(Math.random() * 100)}`,
      environment: 'production',
      status: 'pending',
      config: JSON.stringify({
        memory: '512MB',
        cpu: '1',
        region: 'us-east-1'
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return { ...defaultDeployment, ...overrides };
  }

  static createMany(count, overrides = {}) {
    return Array.from({ length: count }, (_, index) => 
      this.create({ 
        ...overrides, 
        project_name: `project-${index}`,
        id: index + 1 
      })
    );
  }

  static createPending() {
    return this.create({ status: 'pending' });
  }

  static createRunning() {
    return this.create({ 
      status: 'running',
      environment: 'production'
    });
  }

  static createFailed() {
    return this.create({ 
      status: 'failed',
      config: JSON.stringify({
        error: 'Deployment failed due to configuration error'
      })
    });
  }

  static createSuccessful() {
    return this.create({ 
      status: 'successful',
      environment: 'production'
    });
  }

  static createForEnvironment(environment) {
    return this.create({ environment });
  }

  static createForUser(userId) {
    return this.create({ user_id: userId });
  }
}

module.exports = DeploymentFactory;