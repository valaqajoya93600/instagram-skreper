'use strict';

const S3Service = require('../../../src/services/S3Service');
const AWS = require('aws-sdk');

describe('S3Service', () => {
  let s3Service;
  let mockS3;

  beforeEach(() => {
    // Get the mocked S3 instance
    mockS3 = new AWS.S3();
    s3Service = new S3Service();
  });

  describe('uploadLogs', () => {
    it('should upload logs successfully', async () => {
      const deploymentId = 1;
      const logContent = 'Test log content';
      const mockUploadResult = {
        Location: 'https://bucket.s3.amazonaws.com/key',
        Key: 'deployment-logs/1/logs.txt',
        Bucket: 'test-bucket'
      };

      mockS3.upload.mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockUploadResult)
      });

      const result = await s3Service.uploadLogs(deploymentId, logContent);

      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: s3Service.bucketName,
        Key: 'deployment-logs/1/logs.txt',
        Body: logContent,
        ContentType: 'text/plain'
      });

      expect(result).toEqual({
        location: mockUploadResult.Location,
        key: mockUploadResult.Key,
        bucket: mockUploadResult.Bucket
      });
    });

    it('should throw error for missing deployment ID', async () => {
      await expect(s3Service.uploadLogs(null, 'log content'))
        .rejects.toThrow('Deployment ID and log content are required');
    });

    it('should throw error for missing log content', async () => {
      await expect(s3Service.uploadLogs(1, null))
        .rejects.toThrow('Deployment ID and log content are required');
    });

    it('should handle upload error', async () => {
      mockS3.upload.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Upload failed'))
      });

      await expect(s3Service.uploadLogs(1, 'log content'))
        .rejects.toThrow('Failed to upload logs to S3: Upload failed');
    });
  });

  describe('downloadLogs', () => {
    it('should download logs successfully', async () => {
      const deploymentId = 1;
      const logContent = 'Test log content';
      const mockGetObjectResult = {
        Body: Buffer.from(logContent)
      };

      mockS3.getObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockGetObjectResult)
      });

      const result = await s3Service.downloadLogs(deploymentId);

      expect(mockS3.getObject).toHaveBeenCalledWith({
        Bucket: s3Service.bucketName,
        Key: 'deployment-logs/1/logs.txt'
      });

      expect(result).toBe(logContent);
    });

    it('should throw error for missing deployment ID', async () => {
      await expect(s3Service.downloadLogs(null))
        .rejects.toThrow('Deployment ID is required');
    });

    it('should handle NoSuchKey error', async () => {
      mockS3.getObject.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'NoSuchKey' })
      });

      await expect(s3Service.downloadLogs(1))
        .rejects.toThrow('Logs not found for this deployment');
    });

    it('should handle download error', async () => {
      mockS3.getObject.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Download failed'))
      });

      await expect(s3Service.downloadLogs(1))
        .rejects.toThrow('Failed to download logs from S3: Download failed');
    });
  });

  describe('deleteLogs', () => {
    it('should delete logs successfully', async () => {
      const deploymentId = 1;

      mockS3.deleteObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await s3Service.deleteLogs(deploymentId);

      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: s3Service.bucketName,
        Key: 'deployment-logs/1/logs.txt'
      });

      expect(result).toEqual({ success: true });
    });

    it('should throw error for missing deployment ID', async () => {
      await expect(s3Service.deleteLogs(null))
        .rejects.toThrow('Deployment ID is required');
    });

    it('should handle delete error', async () => {
      mockS3.deleteObject.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Delete failed'))
      });

      await expect(s3Service.deleteLogs(1))
        .rejects.toThrow('Failed to delete logs from S3: Delete failed');
    });
  });

  describe('listDeploymentLogs', () => {
    it('should list deployment logs successfully', async () => {
      const mockListResult = {
        Contents: [
          {
            Key: 'deployment-logs/1/logs.txt',
            LastModified: new Date(),
            Size: 1024,
            ETag: '"etag123"'
          },
          {
            Key: 'deployment-logs/2/logs.txt',
            LastModified: new Date(),
            Size: 2048,
            ETag: '"etag456"'
          }
        ]
      };

      mockS3.listObjectsV2.mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockListResult)
      });

      const result = await s3Service.listDeploymentLogs();

      expect(mockS3.listObjectsV2).toHaveBeenCalledWith({
        Bucket: s3Service.bucketName,
        Prefix: 'deployment-logs/'
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: mockListResult.Contents[0].Key,
        lastModified: mockListResult.Contents[0].LastModified,
        size: mockListResult.Contents[0].Size,
        etag: mockListResult.Contents[0].ETag
      });
    });

    it('should handle list error', async () => {
      mockS3.listObjectsV2.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('List failed'))
      });

      await expect(s3Service.listDeploymentLogs())
        .rejects.toThrow('Failed to list deployment logs: List failed');
    });

    it('should handle custom prefix', async () => {
      mockS3.listObjectsV2.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Contents: [] })
      });

      await s3Service.listDeploymentLogs('custom-prefix/');

      expect(mockS3.listObjectsV2).toHaveBeenCalledWith({
        Bucket: s3Service.bucketName,
        Prefix: 'custom-prefix/'
      });
    });
  });
});