'use strict';

const Deployment = require('../../../src/models/Deployment');

describe('Deployment Model', () => {
  describe('constructor', () => {
    it('should create deployment with valid data', () => {
      const deploymentData = {
        id: 1,
        user_id: 1,
        project_name: 'test-project',
        environment: 'production',
        status: 'pending',
        config: '{"memory": "512MB"}',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const deployment = new Deployment(deploymentData);

      expect(deployment.id).toBe(deploymentData.id);
      expect(deployment.user_id).toBe(deploymentData.user_id);
      expect(deployment.project_name).toBe(deploymentData.project_name);
      expect(deployment.environment).toBe(deploymentData.environment);
      expect(deployment.status).toBe(deploymentData.status);
      expect(deployment.config).toEqual({ memory: '512MB' });
      expect(deployment.created_at).toBe(deploymentData.created_at);
      expect(deployment.updated_at).toBe(deploymentData.updated_at);
    });

    it('should handle null config', () => {
      const deploymentData = {
        id: 1,
        user_id: 1,
        project_name: 'test-project',
        environment: 'production',
        status: 'pending',
        config: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const deployment = new Deployment(deploymentData);

      expect(deployment.config).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update status and updated_at', () => {
      const deploymentData = {
        id: 1,
        user_id: 1,
        project_name: 'test-project',
        environment: 'production',
        status: 'pending',
        config: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const deployment = new Deployment(deploymentData);
      const originalUpdatedAt = deployment.updated_at;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        deployment.updateStatus('running');

        expect(deployment.status).toBe('running');
        expect(deployment.updated_at).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('updateConfig', () => {
    it('should update config and updated_at', () => {
      const deploymentData = {
        id: 1,
        user_id: 1,
        project_name: 'test-project',
        environment: 'production',
        status: 'pending',
        config: { memory: '512MB' },
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const deployment = new Deployment(deploymentData);
      const originalUpdatedAt = deployment.updated_at;
      const newConfig = { memory: '1GB', cpu: '2' };
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        deployment.updateConfig(newConfig);

        expect(deployment.config).toEqual(newConfig);
        expect(deployment.updated_at).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('toJSON', () => {
    it('should return deployment data as JSON', () => {
      const deploymentData = {
        id: 1,
        user_id: 1,
        project_name: 'test-project',
        environment: 'production',
        status: 'pending',
        config: { memory: '512MB' },
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const deployment = new Deployment(deploymentData);
      const json = deployment.toJSON();

      expect(json).toEqual(deploymentData);
    });
  });

  describe('isValidEnvironment', () => {
    it('should return true for valid environments', () => {
      expect(Deployment.isValidEnvironment('development')).toBe(true);
      expect(Deployment.isValidEnvironment('staging')).toBe(true);
      expect(Deployment.isValidEnvironment('production')).toBe(true);
    });

    it('should return false for invalid environments', () => {
      expect(Deployment.isValidEnvironment('invalid')).toBe(false);
      expect(Deployment.isValidEnvironment('prod')).toBe(false);
      expect(Deployment.isValidEnvironment('dev')).toBe(false);
      expect(Deployment.isValidEnvironment('')).toBe(false);
      expect(Deployment.isValidEnvironment(null)).toBe(false);
    });
  });

  describe('isValidStatus', () => {
    it('should return true for valid statuses', () => {
      expect(Deployment.isValidStatus('pending')).toBe(true);
      expect(Deployment.isValidStatus('running')).toBe(true);
      expect(Deployment.isValidStatus('successful')).toBe(true);
      expect(Deployment.isValidStatus('failed')).toBe(true);
      expect(Deployment.isValidStatus('cancelled')).toBe(true);
    });

    it('should return false for invalid statuses', () => {
      expect(Deployment.isValidStatus('invalid')).toBe(false);
      expect(Deployment.isValidStatus('success')).toBe(false);
      expect(Deployment.isValidStatus('error')).toBe(false);
      expect(Deployment.isValidStatus('')).toBe(false);
      expect(Deployment.isValidStatus(null)).toBe(false);
    });
  });
});