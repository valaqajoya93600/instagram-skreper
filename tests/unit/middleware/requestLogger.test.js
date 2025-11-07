'use strict';

const requestLogger = require('../../../src/middleware/requestLogger');

describe('Request Logger Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleSpy;

  beforeEach(() => {
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    mockReq = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1'
    };
    
    mockRes = {
      end: jest.fn(),
      statusCode: 200
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log request and response', () => {
    requestLogger(mockReq, mockRes, mockNext);

    // Check if request was logged
    expect(consoleSpy).toHaveBeenCalledWith('GET /test - 127.0.0.1');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log response when end is called', () => {
    requestLogger(mockReq, mockRes, mockNext);

    // Simulate response end
    mockRes.end('response data');

    // Should log both request and response
    expect(consoleSpy).toHaveBeenCalledWith('GET /test - 127.0.0.1');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET /test - 200 -'));
  });

  it('should handle different HTTP methods', () => {
    mockReq.method = 'POST';
    mockReq.url = '/api/users';

    requestLogger(mockReq, mockRes, mockNext);

    expect(consoleSpy).toHaveBeenCalledWith('POST /api/users - 127.0.0.1');
  });

  it('should handle different status codes', () => {
    mockRes.statusCode = 404;

    requestLogger(mockReq, mockRes, mockNext);
    mockRes.end();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET /test - 404 -'));
  });

  it('should handle response with encoding', () => {
    requestLogger(mockReq, mockRes, mockNext);

    // Simulate response end with encoding
    mockRes.end('response data', 'utf8');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET /test - 200 -'));
  });

  it('should measure response time', () => {
    requestLogger(mockReq, mockRes, mockNext);
    
    // Mock Date.now to control timing
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => 1000);
    
    try {
      mockRes.end();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET \/test - 200 - \d+ms/)
      );
    } finally {
      Date.now = originalDateNow;
    }
  });

  it('should preserve original end function behavior', () => {
    const originalEnd = jest.fn();
    mockRes.end = originalEnd;

    requestLogger(mockReq, mockRes, mockNext);

    // Call the mocked end function
    mockRes.end('data');

    // Original end should still be called
    expect(originalEnd).toHaveBeenCalledWith('data', undefined);
  });
});