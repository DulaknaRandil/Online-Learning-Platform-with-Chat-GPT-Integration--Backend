const { HTTP_STATUS, MESSAGES } = require('../constants');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Global error handler
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    logger.error({
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return errorResponse(res, message, HTTP_STATUS.CONFLICT);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return errorResponse(res, 'Invalid ID format', HTTP_STATUS.BAD_REQUEST);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
  }

  // Default error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = process.env.NODE_ENV === 'production' 
    ? MESSAGES.ERROR.INTERNAL_ERROR 
    : err.message;

  return errorResponse(res, message, statusCode);
};

// 404 handler
const notFoundHandler = (req, res) => errorResponse(res, `Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
