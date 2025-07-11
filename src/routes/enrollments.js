const express = require('express');
const { enrollmentController } = require('../controllers');
const { auth, isInstructor, isStudent } = require('../middleware');
const { validate, enrollmentSchemas, commonSchemas } = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Student routes
router.post('/',
  isStudent,
  validate(enrollmentSchemas.enroll),
  enrollmentController.enrollInCourse
);

router.get('/my-enrollments',
  validate(commonSchemas.pagination, 'query'),
  enrollmentController.getUserEnrollments
);

router.get('/:id',
  (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid enrollment ID format',
        errors: [{
          field: 'id',
          message: 'Enrollment ID must be a valid MongoDB ObjectId'
        }],
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  enrollmentController.getEnrollmentById
);

router.put('/:id/progress',
  isStudent,
  (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid enrollment ID format',
        errors: [{
          field: 'id',
          message: 'Enrollment ID must be a valid MongoDB ObjectId'
        }],
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  validate(enrollmentSchemas.updateProgress),
  enrollmentController.updateProgress
);

router.put('/:id/complete-lesson',
  isStudent,
  (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid enrollment ID format',
        errors: [{
          field: 'id',
          message: 'Enrollment ID must be a valid MongoDB ObjectId'
        }],
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  enrollmentController.completeLesson
);

router.delete('/:id',
  isStudent,
  (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid enrollment ID format',
        errors: [{
          field: 'id',
          message: 'Enrollment ID must be a valid MongoDB ObjectId'
        }],
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  enrollmentController.cancelEnrollment
);

router.get('/:id/summary',
  isStudent,
  (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid enrollment ID format',
        errors: [{
          field: 'id',
          message: 'Enrollment ID must be a valid MongoDB ObjectId'
        }],
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  enrollmentController.getEnrollmentSummary
);

// Instructor routes
router.get('/course/:courseId',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  validate(commonSchemas.pagination, 'query'),
  enrollmentController.getCourseEnrollments
);

// General stats (both students and instructors)
router.get('/stats/overview',
  enrollmentController.getEnrollmentStats
);

module.exports = router;
