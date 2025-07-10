const express = require('express');
const { courseController } = require('../controllers');
const { auth, optionalAuth, isInstructor } = require('../middleware');
const { validate, courseSchemas, commonSchemas } = require('../validators');

const router = express.Router();

// Public routes
router.get('/',
  optionalAuth,
  validate(commonSchemas.pagination, 'query'),
  courseController.getAllCourses
);

router.get('/search',
  optionalAuth,
  validate(commonSchemas.search, 'query'),
  courseController.searchCourses
);

router.get('/:id',
  optionalAuth,
  (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid course ID format',
        errors: [{
          field: 'id',
          message: 'Course ID must be a valid MongoDB ObjectId'
        }],
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  courseController.getCourseById
);

// Protected routes
router.use(auth);

// Instructor routes
router.post('/',
  isInstructor,
  validate(courseSchemas.create),
  courseController.createCourse
);

router.get('/instructor/my-courses',
  isInstructor,
  validate(commonSchemas.pagination, 'query'),
  courseController.getInstructorCourses
);

router.put('/:id',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  validate(courseSchemas.update),
  courseController.updateCourse
);

router.delete('/:id',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  courseController.deleteCourse
);

router.put('/:id/publish',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  courseController.publishCourse
);

router.get('/:id/stats',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  courseController.getCourseStats
);

// Lesson management
router.post('/:id/lessons',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  courseController.addLesson
);

router.put('/:id/lessons/:lessonId',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  courseController.updateLesson
);

router.delete('/:id/lessons/:lessonId',
  isInstructor,
  validate(commonSchemas.mongoId, 'params'),
  courseController.deleteLesson
);

// Student routes
router.post('/:id/reviews',
  validate(commonSchemas.mongoId, 'params'),
  courseController.addReview
);

module.exports = router;
