const { recommendationService } = require('../services');
const gptService = require('../services/gptService');
const courseService = require('../services/courseService');
const { HTTP_STATUS } = require('../constants');
const { successResponse, errorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware');
const logger = require('../utils/logger');

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

    // Get available courses to provide context
    const coursesResponse = await courseService.getCourses({ status: 'published' });
    const availableCourses = coursesResponse.data || [];

    // Get recommendations from GPT
    const recommendations = await gptService.getCourseRecommendations(prompt, availableCourses);

    // Match recommendations with actual courses
    const matchedCourses = [];
    
    if (recommendations.recommendations) {
      for (const rec of recommendations.recommendations) {
        if (rec.courseId) {
          const course = availableCourses.find(c => c._id.toString() === rec.courseId);
          if (course) {
            matchedCourses.push({
              ...course.toObject(),
              recommendationReason: rec.reason,
              priority: rec.priority
            });
          }
        } else {
          // If no specific course ID, try to find by title
          const course = availableCourses.find(c => 
            c.title.toLowerCase().includes(rec.title.toLowerCase()) ||
            rec.title.toLowerCase().includes(c.title.toLowerCase())
          );
          if (course) {
            matchedCourses.push({
              ...course.toObject(),
              recommendationReason: rec.reason,
              priority: rec.priority
            });
          }
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
    const { message, context } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(res, 'Please provide a valid message', 400);
    }

    // For now, redirect to course recommendations
    // This can be expanded for general chat functionality
    if (message.toLowerCase().includes('course') || message.toLowerCase().includes('learn')) {
      req.body.prompt = message;
      return this.getCourseRecommendations(req, res);
    }

    return successResponse(res, {
      message: "I'm here to help with course recommendations! Try asking me something like 'I want to be a software engineer, what courses should I take?'"
    }, 'Chat response generated');
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
      'Personalized recommendations retrieved successfully',
      recommendations
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
      'Similar courses retrieved successfully',
      similarCourses
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
      'Trending courses retrieved successfully',
      trendingCourses
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
      `Courses in ${category} category retrieved successfully`,
      courses
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
      `Learning path for ${skill} retrieved successfully`,
      learningPath
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

    const userId = req.user ? req.user._id : null;
    const recommendations = await recommendationService.getChatRecommendations(
      query.trim(),
      userId,
      parseInt(limit)
    );

    return successResponse(
      res,
      'AI-powered course recommendations generated successfully',
      recommendations
    );
  });

  // Get API usage statistics
  getApiUsageStats = asyncHandler(async (req, res) => {
    const stats = recommendationService.getApiUsageStats();

    return successResponse(
      res,
      'API usage statistics retrieved successfully',
      stats
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
      'Popular courses retrieved successfully',
      trendingCourses
    );
  });
}

module.exports = new RecommendationController();
