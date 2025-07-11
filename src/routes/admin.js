const express = require('express');
const { userController, courseController, enrollmentController } = require('../controllers');
const { auth, isAdmin } = require('../middleware');
const { validate, commonSchemas } = require('../validators');

const router = express.Router();

// All admin routes require admin authentication
router.use(auth, isAdmin);

// User management routes
router.get('/users', userController.getAllUsers);

router.put('/users/:id/toggle-status',
  validate(commonSchemas.mongoId, 'params'),
  userController.toggleUserStatus
);

// User delete route (admin only)
router.delete('/users/:id',
  validate(commonSchemas.mongoId, 'params'),
  userController.deleteUser
);

// Course management routes
router.get('/courses', courseController.getAllCourses);

router.put('/courses/:id/toggle-status',
  validate(commonSchemas.mongoId, 'params'),
  courseController.publishCourse
);

// Course delete route (admin only)
router.delete('/courses/:id',
  validate(commonSchemas.mongoId, 'params'),
  courseController.deleteCourse
);

// Dashboard statistics route
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get user statistics
    const userStats = await userController.getUserStatsData();
    
    // Get course statistics
    const courseStats = await courseController.getCourseStatsData();
    
    // Get enrollment statistics
    const enrollmentStats = await enrollmentController.getEnrollmentStatsData();
    
    return res.status(200).json({
      success: true,
      data: {
        users: userStats,
        courses: courseStats,
        enrollments: enrollmentStats
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard statistics'
    });
  }
});

module.exports = router;
