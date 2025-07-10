const { auth, optionalAuth, requireRole, isInstructor, isAdmin, isStudent, isInstructorOrAdmin, isStudentOrInstructor, isOwnerOrAdmin, isCourseInstructorOrAdmin } = require('./auth');
const { errorHandler, notFoundHandler, asyncHandler } = require('./errorHandler');
const { generalLimiter, authLimiter, apiLimiter, uploadLimiter } = require('./rateLimiter');
const { 
  validateRequest, 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate, 
  validatePasswordChange, 
  validateCourseCreation, 
  validateCourseUpdate, 
  validateEnrollment 
} = require('./validation');

module.exports = {
  // Authentication middleware
  auth,
  optionalAuth,
  requireRole,
  isInstructor,
  isAdmin,
  isStudent,
  isInstructorOrAdmin,
  isStudentOrInstructor,
  isOwnerOrAdmin,
  isCourseInstructorOrAdmin,
  
  // Error handling middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Rate limiting middleware
  generalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  
  // Validation middleware
  validateRequest,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateCourseCreation,
  validateCourseUpdate,
  validateEnrollment
};
