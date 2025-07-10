const { userSchemas, courseSchemas, enrollmentSchemas } = require('../validators');
const { errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../constants');

/**
 * Middleware to validate request data using Joi schemas
 */
const validateRequest = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return errorResponse(
        res,
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        errors
      );
    }
    
    next();
  };

// User validation middlewares
const validateUserRegistration = validateRequest(userSchemas.register);
const validateUserLogin = validateRequest(userSchemas.login);
const validateUserUpdate = validateRequest(userSchemas.updateProfile);
const validatePasswordChange = validateRequest(userSchemas.changePassword);

// Course validation middlewares
const validateCourseCreation = validateRequest(courseSchemas.create);
const validateCourseUpdate = validateRequest(courseSchemas.update);

// Enrollment validation middlewares
const validateEnrollment = validateRequest(enrollmentSchemas.enroll);

module.exports = {
  validateRequest,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateCourseCreation,
  validateCourseUpdate,
  validateEnrollment
};
