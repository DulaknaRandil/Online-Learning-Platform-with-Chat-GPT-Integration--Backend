const { HTTP_STATUS } = require('../constants');

/**
 * Standard API response structure
 */
class ApiResponse {
  constructor(success, message, data = null, statusCode = HTTP_STATUS.OK) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Success response helper
 */
const successResponse = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
  const response = new ApiResponse(true, message, data, statusCode);
  return res.status(statusCode).json(response);
};

/**
 * Error response helper
 */
const errorResponse = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = new ApiResponse(false, message, errors, statusCode);
  return res.status(statusCode).json(response);
};

/**
 * Validation error response helper
 */
const validationErrorResponse = (res, errors) => {
  const response = new ApiResponse(
    false,
    'Validation failed',
    errors,
    HTTP_STATUS.UNPROCESSABLE_ENTITY
  );
  return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
};

/**
 * Paginated response helper
 */
const paginatedResponse = (res, message, data, pagination) => {
  const response = new ApiResponse(true, message, {
    items: data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      hasNext: pagination.hasNext,
      hasPrev: pagination.hasPrev,
      limit: pagination.limit
    }
  });
  return res.status(HTTP_STATUS.OK).json(response);
};

module.exports = {
  ApiResponse,
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse
};
