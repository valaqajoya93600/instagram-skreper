'use strict';

const { successResponse, errorResponse, paginatedResponse } = require('../../../src/utils/responseHelper');

describe('Response Helper', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('successResponse', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Success';
      const statusCode = 200;

      successResponse(mockRes, data, message, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message,
        data
      });
    });

    it('should return success response without data', () => {
      const message = 'Operation completed';
      const statusCode = 204;

      successResponse(mockRes, null, message, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message
      });
    });

    it('should use default values', () => {
      const data = { id: 1 };

      successResponse(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data
      });
    });
  });

  describe('errorResponse', () => {
    it('should return error response with string error', () => {
      const error = 'Something went wrong';
      const statusCode = 400;

      errorResponse(mockRes, error, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error
      });
    });

    it('should return error response with error object', () => {
      const error = new Error('Detailed error message');
      const statusCode = 500;

      errorResponse(mockRes, error, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Detailed error message'
      });
    });

    it('should use default error message', () => {
      const error = new Error();

      errorResponse(mockRes, error);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'An error occurred'
      });
    });

    it('should use default status code', () => {
      const error = 'Test error';

      errorResponse(mockRes, error);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('paginatedResponse', () => {
    it('should return paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { limit: 10, offset: 0, total: 50 };
      const message = 'Data retrieved';
      const statusCode = 200;

      paginatedResponse(mockRes, data, pagination, message, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message,
        data,
        pagination
      });
    });

    it('should use default values', () => {
      const data = [{ id: 1 }];
      const pagination = { limit: 10, offset: 0, total: 1 };

      paginatedResponse(mockRes, data, pagination);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        pagination
      });
    });
  });
});