'use strict';

const errorHandler = require('../../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1'
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  it('should handle generic error', () => {
    const error = new Error('Test error');
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error'
    });
  });

  it('should handle error without message', () => {
    const error = new Error();
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error'
    });
  });

  it('should handle validation error', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed'
    });
  });

  it('should handle unauthorized error', () => {
    const error = new Error('Unauthorized access');
    error.name = 'UnauthorizedError';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized'
    });
  });

  it('should handle SQLite constraint unique error', () => {
    const error = new Error('Unique constraint failed');
    error.code = 'SQLITE_CONSTRAINT_UNIQUE';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource already exists'
    });
  });

  it('should handle SQLite constraint foreign key error', () => {
    const error = new Error('Foreign key constraint failed');
    error.code = 'SQLITE_CONSTRAINT_FOREIGNKEY';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid reference'
    });
  });

  it('should include stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at test.js:1:1';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      stack: 'Error: Test error\n    at test.js:1:1'
    });

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should not include stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at test.js:1:1';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error'
    });

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle error with custom status', () => {
    const error = new Error('Custom error');
    error.status = 422;
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Custom error'
    });
  });
});