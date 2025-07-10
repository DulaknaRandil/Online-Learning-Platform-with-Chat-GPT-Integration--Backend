const OpenAI = require('openai');
const axios = require('axios');
const { Course, User, Enrollment } = require('../models');
const logger = require('../utils/logger');

class RecommendationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // For project API keys (starting with sk-proj-), add baseURL for OpenAI On-Demand
      baseURL: 'https://api.openai.com/v1',
      dangerouslyAllowBrowser: false
    });
    
    // Groq API configuration
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
    
    // API request tracking
    this.apiRequestCount = 0;
    this.maxApiRequests = 250;
    this.rateLimitWindow = 60 * 1000; // 1 minute
    this.requestsInWindow = [];
    this.maxRequestsPerMinute = 10;
    
    // Track which service is being used
    this.lastServiceUsed = null;
  }

  // Check if we can make an API request
  canMakeApiRequest() {
    // Check total request limit
    if (this.apiRequestCount >= this.maxApiRequests) {
      logger.warn(`OpenAI API request limit reached: ${this.apiRequestCount}/${this.maxApiRequests}`);
      return false;
    }

    // Check rate limit (requests per minute)
    const now = Date.now();
    this.requestsInWindow = this.requestsInWindow.filter(time => now - time < this.rateLimitWindow);
    
    if (this.requestsInWindow.length >= this.maxRequestsPerMinute) {
      logger.warn(`OpenAI API rate limit reached: ${this.requestsInWindow.length} requests in last minute`);
      return false;
    }

    return true;
  }

  // Track API request
  trackApiRequest() {
    this.apiRequestCount++;
    this.requestsInWindow.push(Date.now());
    logger.info(`OpenAI API request made. Total: ${this.apiRequestCount}/${this.maxApiRequests}`);
  }

  // Use Groq API as fallback
  async useGroqFallback(prompt, systemPrompt) {
    try {
      logger.info('Attempting to use Groq API as fallback...');
      
      if (!this.groqApiKey) {
        logger.error('Groq API key not configured');
        return null;
      }
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.groqModel,
          messages: [
            {
              role: 'system',
              content: systemPrompt || 'You are a helpful educational assistant that recommends courses based on user queries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqApiKey}`
          },
          timeout: 10000
        }
      );
      
      this.lastServiceUsed = 'groq';
      logger.info('Successfully used Groq API as fallback');
      
      return {
        content: response.data.choices[0].message.content.trim(),
        model: response.data.model,
        service: 'groq'
      };
    } catch (error) {
      logger.error('Groq API fallback error:', error.message);
      return null;
    }
  }

  // Get API usage statistics
  getApiUsageStats() {
    return {
      totalRequests: this.apiRequestCount,
      maxRequests: this.maxApiRequests,
      lastServiceUsed: this.lastServiceUsed,
      apiKeyValid: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-') && process.env.OPENAI_API_KEY.length > 30,
      remainingRequests: this.maxApiRequests - this.apiRequestCount,
      requestsInLastMinute: this.requestsInWindow.filter(time => Date.now() - time < this.rateLimitWindow).length
    };
  }

  // Get personalized course recommendations
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId)
        .populate('enrolledCourses', 'category difficulty tags')
        .populate('createdCourses', 'category difficulty tags');

      if (!user) {
        throw new Error('User not found');
      }

      // Get user's learning history and preferences
      const userProfile = await this.buildUserProfile(user);

      // Get courses user hasn't enrolled in
      const enrolledCourseIds = user.enrolledCourses.map(course => course._id);
      const availableCourses = await Course.find({
        _id: { $nin: enrolledCourseIds },
        status: 'published'
      }).populate('instructor', 'username');

      // Generate AI recommendations
      const recommendations = await this.generateAIRecommendations(
        userProfile,
        availableCourses,
        limit
      );

      return recommendations;
    } catch (error) {
      logger.error('Get personalized recommendations error:', error);
      throw error;
    }
  }

  // Get similar courses
  async getSimilarCourses(courseId, limit = 5) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Find similar courses based on category, difficulty, and tags
      const similarCourses = await Course.find({
        _id: { $ne: courseId },
        status: 'published',
        $or: [
          { category: course.category },
          { difficulty: course.difficulty },
          { tags: { $in: course.tags } }
        ]
      })
      .populate('instructor', 'username')
      .sort({ 'rating.average': -1, enrollmentCount: -1 })
      .limit(limit);

      return similarCourses;
    } catch (error) {
      logger.error('Get similar courses error:', error);
      throw error;
    }
  }

  // Get trending courses
  async getTrendingCourses(limit = 10) {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get courses with high recent enrollment
      const trendingCourses = await Course.aggregate([
        {
          $match: {
            status: 'published',
            createdAt: { $gte: oneWeekAgo }
          }
        },
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'course',
            as: 'recentEnrollments',
            pipeline: [
              {
                $match: {
                  enrollmentDate: { $gte: oneWeekAgo }
                }
              }
            ]
          }
        },
        {
          $addFields: {
            recentEnrollmentCount: { $size: '$recentEnrollments' },
            trendingScore: {
              $add: [
                { $multiply: ['$rating.average', 2] },
                { $multiply: [{ $size: '$recentEnrollments' }, 3] },
                '$enrollmentCount'
              ]
            }
          }
        },
        {
          $sort: { trendingScore: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: 'instructor',
            foreignField: '_id',
            as: 'instructor',
            pipeline: [
              {
                $project: { username: 1, email: 1, avatar: 1 }
              }
            ]
          }
        },
        {
          $unwind: '$instructor'
        }
      ]);

      return trendingCourses;
    } catch (error) {
      logger.error('Get trending courses error:', error);
      throw error;
    }
  }

  // Get course recommendations by category
  async getCoursesByCategory(category, userId = null, limit = 10) {
    try {
      const query = {
        category,
        status: 'published'
      };

      // Exclude enrolled courses if user is provided
      if (userId) {
        const user = await User.findById(userId);
        if (user && user.enrolledCourses.length > 0) {
          query._id = { $nin: user.enrolledCourses };
        }
      }

      const courses = await Course.find(query)
        .populate('instructor', 'username email avatar')
        .sort({ 'rating.average': -1, enrollmentCount: -1 })
        .limit(limit);

      return courses;
    } catch (error) {
      logger.error('Get courses by category error:', error);
      throw error;
    }
  }

  // Build user profile for recommendations
  async buildUserProfile(user) {
    try {
      const enrollments = await Enrollment.find({ student: user._id })
        .populate('course', 'category difficulty tags');

      const preferences = {
        categories: [],
        difficulties: [],
        tags: [],
        completionRate: 0,
        averageRating: 0
      };

      if (enrollments.length > 0) {
        // Extract preferences from enrolled courses
        const categories = enrollments.map(e => e.course.category);
        const difficulties = enrollments.map(e => e.course.difficulty);
        const tags = enrollments.flatMap(e => e.course.tags);

        preferences.categories = [...new Set(categories)];
        preferences.difficulties = [...new Set(difficulties)];
        preferences.tags = [...new Set(tags)];

        // Calculate completion rate
        const completedCourses = enrollments.filter(e => e.status === 'completed').length;
        preferences.completionRate = (completedCourses / enrollments.length) * 100;

        // Calculate average rating given by user
        const ratedCourses = enrollments.filter(e => e.rating.score);
        if (ratedCourses.length > 0) {
          const totalRating = ratedCourses.reduce((sum, e) => sum + e.rating.score, 0);
          preferences.averageRating = totalRating / ratedCourses.length;
        }
      }

      return {
        userId: user._id,
        username: user.username,
        role: user.role,
        expertise: user.expertise,
        preferences,
        enrollmentCount: enrollments.length
      };
    } catch (error) {
      logger.error('Build user profile error:', error);
      throw error;
    }
  }

  // Generate AI-powered recommendations
  async generateAIRecommendations(userProfile, availableCourses, limit) {
    try {
      // Check if OpenAI API is available and configured
      if (!this.openai || !process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API not configured, using fallback recommendations');
        return this.generateBasicRecommendations(userProfile, availableCourses, limit);
      }

      // Check if we can make an API request
      if (!this.canMakeApiRequest()) {
        logger.warn('Cannot make OpenAI API request due to limits, using fallback recommendations');
        return this.generateBasicRecommendations(userProfile, availableCourses, limit);
      }

      // Limit courses to first 20 to reduce token usage
      const limitedCourses = availableCourses.slice(0, 20);

      const prompt = `Based on the user profile below, recommend the top ${Math.min(limit, limitedCourses.length)} courses from the available options.

User Profile:
- Role: ${userProfile.role}
- Expertise: ${userProfile.expertise.join(', ') || 'None specified'}
- Preferred categories: ${userProfile.preferences.categories.join(', ') || 'Any'}
- Preferred difficulties: ${userProfile.preferences.difficulties.join(', ') || 'Any'}
- Completion rate: ${userProfile.preferences.completionRate}%

Available Courses:
${limitedCourses.map((course, index) => `${index + 1}. ${course.title} (${course.category}, ${course.difficulty}, Rating: ${course.rating.average}/5)`).join('\n')}

Return only course numbers separated by commas (e.g., "3,1,7,2").`;

      // Track the API request
      this.trackApiRequest();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an educational course recommendation expert. Provide course recommendations based on user preferences and learning goals. Return only the requested course numbers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
        timeout: 10000 // 10 second timeout
      });

      const content = response.choices[0].message.content.trim();
      logger.info(`OpenAI recommendation response: ${content}`);

      // Parse the response
      const recommendedIndices = content
        .split(',')
        .map(num => parseInt(num.trim()) - 1)
        .filter(index => index >= 0 && index < limitedCourses.length)
        .slice(0, limit);

      if (recommendedIndices.length === 0) {
        logger.warn('No valid recommendations from OpenAI, using fallback');
        return this.generateBasicRecommendations(userProfile, availableCourses, limit);
      }

      const recommendations = recommendedIndices.map((index, rank) => ({
        ...limitedCourses[index].toObject(),
        recommendationScore: (recommendedIndices.length - rank) / recommendedIndices.length,
        recommendationReason: 'AI-powered recommendation based on your profile'
      }));

      logger.info(`Successfully generated ${recommendations.length} AI recommendations`);
      return recommendations;

    } catch (error) {
      logger.error('Generate AI recommendations error:', error);
      logger.info('Falling back to basic recommendations');
      return this.generateBasicRecommendations(userProfile, availableCourses, limit);
    }
  }

  // Generate basic recommendations (fallback)
  generateBasicRecommendations(userProfile, availableCourses, limit) {
    try {
      const scored = availableCourses.map(course => {
        let score = 0;

        // Category preference
        if (userProfile.preferences.categories.includes(course.category)) {
          score += 3;
        }

        // Difficulty preference
        if (userProfile.preferences.difficulties.includes(course.difficulty)) {
          score += 2;
        }

        // Tag overlap
        const tagOverlap = course.tags.filter(tag => 
          userProfile.preferences.tags.includes(tag)
        ).length;
        score += tagOverlap;

        // Rating weight
        score += course.rating.average * 0.5;

        // Popularity weight
        score += Math.log(course.enrollmentCount + 1) * 0.3;

        return {
          ...course.toObject(),
          recommendationScore: score
        };
      });

      return scored
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Generate basic recommendations error:', error);
      throw error;
    }
  }

  // Get learning path recommendations
  async getLearningPath(userId, targetSkill) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find courses related to target skill
      const relatedCourses = await Course.find({
        status: 'published',
        $or: [
          { tags: { $regex: targetSkill, $options: 'i' } },
          { title: { $regex: targetSkill, $options: 'i' } },
          { description: { $regex: targetSkill, $options: 'i' } }
        ]
      }).populate('instructor', 'username');

      // Order by difficulty (beginner -> intermediate -> advanced)
      const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
      const orderedCourses = relatedCourses.sort((a, b) => {
        const difficultyA = difficultyOrder[a.difficulty] || 2;
        const difficultyB = difficultyOrder[b.difficulty] || 2;
        return difficultyA - difficultyB;
      });

      return {
        targetSkill,
        courses: orderedCourses,
        estimatedDuration: orderedCourses.reduce((total, course) => total + course.duration, 0)
      };
    } catch (error) {
      logger.error('Get learning path error:', error);
      throw error;
    }
  }

  // Get AI-powered course recommendations based on natural language query
  async getChatRecommendations(query, userId = null, limit = 5) {
    try {
      // Get available courses
      const availableCourses = await Course.find({ status: 'published' })
        .populate('instructor', 'username')
        .limit(50); // Limit to reduce token usage

      // Get user profile if userId provided
      let userContext = '';
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          userContext = `User context: Role - ${user.role}, Expertise - ${user.expertise.join(', ') || 'None'}`;
        }
      }

      const systemPrompt = 'You are a helpful educational assistant that recommends courses based on user queries. Understand the user\'s learning goals and suggest the most relevant courses.';
      
      const prompt = `User query: "${query}"
${userContext}

Available courses:
${availableCourses.slice(0, 20).map((course, index) => 
  `${index + 1}. ${course.title} (${course.category}, ${course.difficulty})`
).join('\n')}

Based on the user's query, recommend the most relevant course numbers (1-${Math.min(20, availableCourses.length)}) separated by commas. Consider the user's learning goals and context.`;      // Skip OpenAI entirely and try Groq directly
      let llmResponse = null;
      let content = null;
      
      logger.info('Skipping OpenAI API and using Groq directly for recommendations');
      
      try {
        // Try Groq as primary service
        llmResponse = await this.useGroqFallback(prompt, systemPrompt);
        
        if (llmResponse) {
          content = llmResponse.content;
          logger.info(`Groq chat recommendation response: ${content}`);
        } else {
          // If Groq fails, log it and use basic search
          logger.warn('Groq API unavailable or failed, using search fallback');
          return this.searchCoursesBasic(query, limit);
        }
      } catch (error) {
        logger.error('Error with Groq API:', error.message);
        return this.searchCoursesBasic(query, limit);
      }
      
      // Parse the response
      const recommendedIndices = content
        .split(',')
        .map(num => {
          // Extract numbers from strings like "1", "1.", "Number 1", etc.
          const match = num.trim().match(/\d+/);
          return match ? parseInt(match[0]) - 1 : -1;
        })
        .filter(index => index >= 0 && index < Math.min(20, availableCourses.length))
        .slice(0, limit);

      if (recommendedIndices.length === 0) {
        logger.warn(`No valid chat recommendations from ${this.lastServiceUsed || 'LLM'}, using search fallback`);
        return this.searchCoursesBasic(query, limit);
      }

      const recommendations = recommendedIndices.map((index, rank) => ({
        ...availableCourses[index].toObject(),
        recommendationScore: (recommendedIndices.length - rank) / recommendedIndices.length,
        recommendationReason: `Recommended based on your query: "${query}"`,
        recommendationService: this.lastServiceUsed || 'unknown'
      }));

      logger.info(`Successfully generated ${recommendations.length} chat-based recommendations using ${this.lastServiceUsed || 'LLM'}`);
      return {
        query,
        courses: recommendations,
        aiGenerated: true,
        service: this.lastServiceUsed,
        apiUsage: this.getApiUsageStats()
      };

    } catch (error) {
      logger.error('Get chat recommendations error:', error);
      return this.searchCoursesBasic(query, limit);
    }
  }

  // Basic search fallback for chat recommendations
  async searchCoursesBasic(query, limit = 5) {
    try {
      const searchRegex = new RegExp(query, 'i');
      const courses = await Course.find({
        status: 'published',
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
          { category: searchRegex }
        ]
      })
      .populate('instructor', 'username')
      .limit(limit)
      .sort({ 'rating.average': -1, enrollmentCount: -1 });
      
      // Get search terms for better results
      const searchTerms = query.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter(term => term.length > 2);
      
      this.lastServiceUsed = 'db-search';
      
      return {
        query,
        courses: courses.map((course, index) => ({
          ...course.toObject(),
          recommendationScore: (limit - index) / limit,
          recommendationReason: `Found based on search for: "${query}"`,
          relevanceScore: this.calculateRelevanceScore(course, searchTerms),
          recommendationService: 'db-search'
        })),
        aiGenerated: false,
        service: 'db-search',
        fallbackReason: 'AI services unavailable. Using search-based recommendations instead.',
        apiUsage: this.getApiUsageStats()
      };
    } catch (error) {
      logger.error('Basic search error:', error);
      throw error;
    }
  }

  // Helper method to calculate relevance score between course and search terms
  calculateRelevanceScore(course, searchTerms) {
    if (!searchTerms || searchTerms.length === 0) return 0;
    
    let score = 0;
    const text = [
      course.title || '',
      course.description || '',
      ...(course.tags || []),
      course.category || '',
      course.difficulty || ''
    ].join(' ').toLowerCase();
    
    // Count occurrences of search terms
    searchTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      const matches = text.match(regex);
      if (matches) score += matches.length;
    });
    
    return score;
  }
}

module.exports = new RecommendationService();
