const { recommendationService } = require('../services');
const gptService = require('../services/gptService');
const courseService = require('../services/courseService');
const { HTTP_STATUS } = require('../constants');
const { successResponse, errorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware');

class RecommendationController {
  // Get GPT-powered course recommendations
  getCourseRecommendations = asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return errorResponse(res, 'Please provide a valid prompt for course recommendations', 400);
    }

    if (prompt.length > 500) {
      return errorResponse(res, 'Prompt is too long. Please keep it under 500 characters.', 400);
    }

    try {
      // Get available courses to provide context
      const coursesResponse = await courseService.getAllCourses({ status: 'published' });
      const availableCourses = coursesResponse.courses || [];

      // Get recommendations from GPT
      const recommendations = await gptService.getCourseRecommendations(prompt, availableCourses);

      // Match recommendations with actual courses
      const matchedCourses = [];
    
      if (recommendations.recommendations) {
        for (const rec of recommendations.recommendations) {
          let course = null;
          
          // Try to find course by ID first
          if (rec.courseId) {
            course = availableCourses.find(c => c._id.toString() === rec.courseId);
          }
          
          // If not found by ID, try to find by exact title match
          if (!course && rec.courseId) {
            course = availableCourses.find(c => 
              c.title.toLowerCase() === rec.courseId.toLowerCase()
            );
          }
          
          // If still not found, try partial title matching
          if (!course && (rec.title || rec.courseId)) {
            const searchTitle = rec.title || rec.courseId;
            course = availableCourses.find(c => 
              c.title.toLowerCase().includes(searchTitle.toLowerCase()) ||
              searchTitle.toLowerCase().includes(c.title.toLowerCase())
            );
          }
          
          if (course) {
            matchedCourses.push({
              ...course.toObject(),
              recommendationReason: rec.reason || 'Recommended for your learning goals',
              recommendationScore: rec.priority === 'high' ? 0.9 : rec.priority === 'medium' ? 0.7 : 0.5,
              priority: rec.priority || 'medium'
            });
          }
        }
      }

      return successResponse(res, {
        prompt,
        recommendations: matchedCourses,
        gptResponse: recommendations.textResponse,
        totalRecommendations: recommendations.recommendations?.length || 0,
        matchedCourses: matchedCourses.length,
        fallback: recommendations.fallback || false
      }, 'Course recommendations generated successfully');
    } catch (error) {
      console.error('Error in getCourseRecommendations:', error);
      return errorResponse(res, 'Failed to generate recommendations: ' + error.message, 500);
    }
  });

  // Generate course content using GPT
  generateCourseContent = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return errorResponse(res, 'Course title and description are required', 400);
    }

    const content = await gptService.generateCourseContent(title, description);
    
    if (!content.success) {
      return errorResponse(res, content.error || 'Failed to generate course content', 500);
    }

    return successResponse(res, content.content, 'Course content generated successfully');
  });

  // Get chat response
  getChatResponse = asyncHandler(async (req, res) => {
    // Accept both 'message' and 'query' for compatibility
    const message = req.body.message || req.body.query;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(res, 'Please provide a valid message or query', 400);
    }

    // Always redirect to course recommendations as this is our main AI feature
    req.body.prompt = message;
    return this.getCourseRecommendations(req, res);
  });
  // Get personalized recommendations
  getPersonalizedRecommendations = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const recommendations = await recommendationService.getPersonalizedRecommendations(
      req.user._id,
      parseInt(limit)
    );

    return successResponse(
      res,
      recommendations,
      'Personalized recommendations retrieved successfully'
    );
  });

  // Get similar courses
  getSimilarCourses = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { limit = 5 } = req.query;

    const similarCourses = await recommendationService.getSimilarCourses(
      courseId,
      parseInt(limit)
    );

    return successResponse(
      res,
      similarCourses,
      'Similar courses retrieved successfully'
    );
  });

  // Get trending courses
  getTrendingCourses = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const trendingCourses = await recommendationService.getTrendingCourses(
      parseInt(limit)
    );

    return successResponse(
      res,
      trendingCourses,
      'Trending courses retrieved successfully'
    );
  });

  // Get courses by category
  getCoursesByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const courses = await recommendationService.getCoursesByCategory(
      category,
      req.user?._id,
      parseInt(limit)
    );

    return successResponse(
      res,
      courses,
      `Courses in ${category} category retrieved successfully`
    );
  });

  // Get learning path
  getLearningPath = asyncHandler(async (req, res) => {
    const { skill } = req.params;

    const learningPath = await recommendationService.getLearningPath(
      req.user._id,
      skill
    );

    return successResponse(
      res,
      learningPath,
      `Learning path for ${skill} retrieved successfully`
    );
  });

  // Get AI-powered chat recommendations
  getChatRecommendations = asyncHandler(async (req, res) => {
    const { query, limit = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return errorResponse(
        res,
        'Please provide a query for course recommendations',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    try {
      const userId = req.user ? req.user._id : null;
      const recommendations = await recommendationService.getChatRecommendations(
        query.trim(),
        userId,
        parseInt(limit)
      );
      
      return successResponse(
        res,
        recommendations,
        'AI-powered course recommendations generated successfully'
      );
    } catch (error) {
      console.error('Error generating chat recommendations:', error);
      return errorResponse(
        res,
        'Failed to generate recommendations. Please try again.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  });

  // Get API usage statistics
  getApiUsageStats = asyncHandler(async (req, res) => {
    const stats = recommendationService.getApiUsageStats();

    return successResponse(
      res,
      stats,
      'API usage statistics retrieved successfully'
    );
  });

  // Get recommendations for anonymous users
  getAnonymousRecommendations = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const trendingCourses = await recommendationService.getTrendingCourses(
      parseInt(limit)
    );

    return successResponse(
      res,
      trendingCourses,
      'Popular courses retrieved successfully'
    );
  });
}

module.exports = new RecommendationController();
