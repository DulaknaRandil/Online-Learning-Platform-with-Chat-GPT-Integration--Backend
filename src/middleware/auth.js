const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { HTTP_STATUS, MESSAGES, USER_ROLES } = require('../constants');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return errorResponse(res, MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.isLocked()) {
      return errorResponse(res, 'Account is temporarily locked', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
    
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
    }
    
    return errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive && !user.isLocked()) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Role-based access control factory
const requireRole = (roles) => (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return errorResponse(res, MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    next();
  };

// Check if user is instructor
const isInstructor = requireRole([USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN]);

// Check if user is admin
const isAdmin = requireRole(USER_ROLES.ADMIN);

// Check if user is student
const isStudent = requireRole(USER_ROLES.STUDENT);

// Check if user is instructor or admin
const isInstructorOrAdmin = requireRole([USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN]);

// Check if user is student or instructor
const isStudentOrInstructor = requireRole([USER_ROLES.STUDENT, USER_ROLES.INSTRUCTOR]);

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceUserField = 'userId') => (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const resourceUserId = req.body[resourceUserField] || req.params[resourceUserField];
    
    if (req.user.role === USER_ROLES.ADMIN || req.user._id.toString() === resourceUserId) {
      return next();
    }

    return errorResponse(res, MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  };

// Check if user is course instructor or admin
const isCourseInstructorOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    const courseId = req.params.courseId || req.body.courseId;
    
    if (!courseId) {
      return errorResponse(res, 'Course ID is required', HTTP_STATUS.BAD_REQUEST);
    }

    const { Course } = require('../models');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return errorResponse(res, MESSAGES.ERROR.COURSE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return errorResponse(res, MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    req.course = course;
    next();
  } catch (error) {
    logger.error('Course instructor check error:', error);
    return errorResponse(res, MESSAGES.ERROR.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  isInstructor,
  isAdmin,
  isStudent,
  isInstructorOrAdmin,
  isStudentOrInstructor,
  isOwnerOrAdmin,
  isCourseInstructorOrAdmin
};
