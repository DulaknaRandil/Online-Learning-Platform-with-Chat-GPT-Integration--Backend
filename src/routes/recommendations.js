const express = require('express');
const { recommendationController } = require('../controllers');
const { auth, optionalAuth } = require('../middleware');

const router = express.Router();

// GPT-powered recommendations
router.post('/gpt-recommendations',
  auth,
  recommendationController.getCourseRecommendations
);

router.post('/generate-content',
  auth,
  recommendationController.generateCourseContent
);

router.post('/chat',
  auth,
  recommendationController.getChatResponse
);

// Public routes (for anonymous users)
router.get('/trending',
  optionalAuth,
  recommendationController.getTrendingCourses
);

router.get('/anonymous',
  recommendationController.getAnonymousRecommendations
);

router.get('/category/:category',
  optionalAuth,
  recommendationController.getCoursesByCategory
);

router.get('/similar/:courseId',
  optionalAuth,
  (req, res, next) => {
    const { courseId } = req.params;
    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid course ID format',
        errors: [{
          field: 'courseId',
          message: 'Course ID must be a valid MongoDB ObjectId'
        }],
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  recommendationController.getSimilarCourses
);

// AI-powered chat recommendations (optional authentication)
router.post('/chat',
  optionalAuth,
  recommendationController.getChatRecommendations
);

// Protected routes (for authenticated users)
router.use(auth);

router.get('/personalized',
  recommendationController.getPersonalizedRecommendations
);

router.get('/learning-path/:skill',
  recommendationController.getLearningPath
);

// API usage stats (for admins and monitoring)
router.get('/usage',
  auth,
  recommendationController.getApiUsageStats
);

module.exports = router;
