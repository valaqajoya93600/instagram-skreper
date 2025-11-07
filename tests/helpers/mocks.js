'use strict';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://mock-bucket.s3.amazonaws.com/mock-file',
        Key: 'mock-file',
        Bucket: 'mock-bucket'
      })
    }),
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('mock file content')
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    listObjectsV2: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Contents: [
          {
            Key: 'deployment-logs/1/logs.txt',
            LastModified: new Date(),
            Size: 1024,
            ETag: '"etag123"'
          }
        ]
      })
    })
  }))
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'mock-message-id',
      response: '250 OK'
    })
  })
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1)
  })
}));

// Mock WebSocket
jest.mock('ws', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    clients: new Set(),
    emit: jest.fn(),
    broadcast: jest.fn()
  }))
}));

function setupMocks() {
  // Mocks are already set up at the top level
  // Just clear any existing mock calls
  jest.clearAllMocks();
}

function teardownMocks() {
  // Clear all mocks
  jest.clearAllMocks();
}

module.exports = {
  setupMocks,
  teardownMocks
};