'use strict';

function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
}

function errorResponse(res, error, statusCode = 400) {
  const response = {
    success: false,
    error: typeof error === 'string' ? error : error.message || 'An error occurred'
  };
  
  return res.status(statusCode).json(response);
}

function paginatedResponse(res, data, pagination, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message,
    data,
    pagination
  };
  
  return res.status(statusCode).json(response);
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};