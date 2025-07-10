const Joi = require('joi');
const { VALIDATION_RULES, USER_ROLES, COURSE_STATUS, DIFFICULTY_LEVELS } = require('../constants');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string()
      .min(VALIDATION_RULES.USERNAME_MIN_LENGTH)
      .max(VALIDATION_RULES.USERNAME_MAX_LENGTH)
      .required(),
    email: Joi.string()
      .email()
      .pattern(VALIDATION_RULES.EMAIL_REGEX)
      .required(),
    password: Joi.string()
      .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH)
      .required(),
    role: Joi.string()
      .valid(...Object.values(USER_ROLES))
      .default(USER_ROLES.STUDENT)
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .pattern(VALIDATION_RULES.EMAIL_REGEX)
      .required(),
    password: Joi.string()
      .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH)
      .required()
  }),

  updateProfile: Joi.object({
    username: Joi.string()
      .min(VALIDATION_RULES.USERNAME_MIN_LENGTH)
      .max(VALIDATION_RULES.USERNAME_MAX_LENGTH),
    email: Joi.string()
      .email()
      .pattern(VALIDATION_RULES.EMAIL_REGEX),
    bio: Joi.string().max(500),
    avatar: Joi.string().uri()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH)
      .required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
  })
};

// Course validation schemas
const courseSchemas = {
  create: Joi.object({
    title: Joi.string()
      .max(VALIDATION_RULES.COURSE_TITLE_MAX_LENGTH)
      .required(),
    description: Joi.string()
      .max(VALIDATION_RULES.COURSE_DESCRIPTION_MAX_LENGTH)
      .required(),
    category: Joi.string().required(),
    difficulty: Joi.string()
      .valid(...Object.values(DIFFICULTY_LEVELS))
      .required(),
    duration: Joi.number().positive().required(),
    price: Joi.number().min(0).required(),
    maxStudents: Joi.number().positive(),
    prerequisites: Joi.array().items(Joi.string()),
    learningOutcomes: Joi.array().items(Joi.string()),
    thumbnail: Joi.string().uri(),
    status: Joi.string()
      .valid(...Object.values(COURSE_STATUS))
      .default(COURSE_STATUS.DRAFT)
  }),

  update: Joi.object({
    title: Joi.string()
      .max(VALIDATION_RULES.COURSE_TITLE_MAX_LENGTH),
    description: Joi.string()
      .max(VALIDATION_RULES.COURSE_DESCRIPTION_MAX_LENGTH),
    category: Joi.string(),
    difficulty: Joi.string()
      .valid(...Object.values(DIFFICULTY_LEVELS)),
    duration: Joi.number().positive(),
    price: Joi.number().min(0),
    maxStudents: Joi.number().positive(),
    prerequisites: Joi.array().items(Joi.string()),
    learningOutcomes: Joi.array().items(Joi.string()),
    thumbnail: Joi.string().uri(),
    status: Joi.string()
      .valid(...Object.values(COURSE_STATUS))
  })
};

// Enrollment validation schemas
const enrollmentSchemas = {
  enroll: Joi.object({
    courseId: Joi.string().required()
  }),

  updateProgress: Joi.object({
    progress: Joi.number().min(0).max(100).required(),
    completedLessons: Joi.array().items(Joi.string()),
    lastAccessedLesson: Joi.string()
  })
};

// Generic validation schemas
const commonSchemas = {
  pagination: Joi.object({
    page: Joi.number().positive().default(1),
    limit: Joi.number().positive().max(100).default(10),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

  search: Joi.object({
    q: Joi.string().min(1).max(100),
    category: Joi.string(),
    difficulty: Joi.string().valid(...Object.values(DIFFICULTY_LEVELS)),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    instructor: Joi.string()
  })
};

// Validation middleware factory
const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    req[source] = value;
    next();
  };

module.exports = {
  userSchemas,
  courseSchemas,
  enrollmentSchemas,
  commonSchemas,
  validate
};
