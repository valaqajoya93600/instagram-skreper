'use strict';

const AWS = require('aws-sdk');

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-key',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret',
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.S3_BUCKET_NAME || 'deployment-logs-bucket';
  }

  async uploadLogs(deploymentId, logContent) {
    if (!deploymentId || !logContent) {
      throw new Error('Deployment ID and log content are required');
    }

    const key = `deployment-logs/${deploymentId}/logs.txt`;
    
    try {
      const result = await this.s3.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: logContent,
        ContentType: 'text/plain'
      }).promise();

      return {
        location: result.Location,
        key: result.Key,
        bucket: result.Bucket
      };
    } catch (error) {
      throw new Error(`Failed to upload logs to S3: ${error.message}`);
    }
  }

  async downloadLogs(deploymentId) {
    if (!deploymentId) {
      throw new Error('Deployment ID is required');
    }

    const key = `deployment-logs/${deploymentId}/logs.txt`;
    
    try {
      const result = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      return result.Body.toString('utf-8');
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        throw new Error('Logs not found for this deployment');
      }
      throw new Error(`Failed to download logs from S3: ${error.message}`);
    }
  }

  async deleteLogs(deploymentId) {
    if (!deploymentId) {
      throw new Error('Deployment ID is required');
    }

    const key = `deployment-logs/${deploymentId}/logs.txt`;
    
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete logs from S3: ${error.message}`);
    }
  }

  async listDeploymentLogs(prefix = 'deployment-logs/') {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: prefix
      }).promise();

      return result.Contents.map(obj => ({
        key: obj.Key,
        lastModified: obj.LastModified,
        size: obj.Size,
        etag: obj.ETag
      }));
    } catch (error) {
      throw new Error(`Failed to list deployment logs: ${error.message}`);
    }
  }
}

module.exports = S3Service;