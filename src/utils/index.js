const logger = require('./logger');
const { successResponse, errorResponse, paginatedResponse, validationErrorResponse } = require('./response');
const { 
  ApiError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  RateLimitError, 
  DatabaseError, 
  ExternalServiceError 
} = require('./errors');

module.exports = {
  // Logger
  logger,
  
  // Response helpers
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  
  // Error classes
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
};
