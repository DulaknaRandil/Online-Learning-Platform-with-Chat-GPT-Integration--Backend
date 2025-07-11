const axios = require('axios');
const logger = require('../utils/logger');

class GPTService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
    this.openaiBaseURL = 'https://api.openai.com/v1';
    this.groqBaseURL = 'https://api.groq.com/openai/v1';
    
    if (!this.openaiApiKey && !this.groqApiKey) {
      logger.warn('No AI API keys found. GPT features will be disabled.');
    } else if (!this.openaiApiKey) {
      logger.info('OpenAI API key not found. Using Groq as primary AI service.');
    } else if (!this.groqApiKey) {
      logger.info('Groq API key not found. Using OpenAI as primary AI service.');
    } else {
      logger.info('Both OpenAI and Groq API keys found. Using OpenAI as primary, Groq as fallback.');
    }
  }

  async getCourseRecommendations(userPrompt, availableCourses = []) {
    try {
      // Try OpenAI first, then fallback to Groq
      if (this.openaiApiKey) {
        try {
          return await this.getOpenAIRecommendations(userPrompt, availableCourses);
        } catch (openaiError) {
          logger.warn('OpenAI request failed, trying Groq fallback:', openaiError.message);
          if (this.groqApiKey) {
            return await this.getGroqRecommendations(userPrompt, availableCourses);
          }
          throw openaiError;
        }
      } else if (this.groqApiKey) {
        return await this.getGroqRecommendations(userPrompt, availableCourses);
      } else {
        throw new Error('No AI API keys configured');
      }
    } catch (error) {
      logger.error('AI Service Error:', error.message);
      
      // Fallback recommendations based on keywords
      const fallbackRecommendations = this.getFallbackRecommendations(userPrompt, availableCourses);
      
      return {
        success: false,
        error: error.message,
        recommendations: fallbackRecommendations,
        fallback: true
      };
    }
  }

  async getOpenAIRecommendations(userPrompt, availableCourses = []) {
    // Create a context with available courses
    const coursesContext = availableCourses.map(course => 
      `- ${course.title}: ${course.description} (Category: ${course.category}, Level: ${course.difficulty})`
    ).join('\n');

    const systemPrompt = `You are an educational advisor for an online learning platform. 
Based on the user's career goals and interests, recommend courses from the available catalog.
Always provide practical, relevant recommendations with explanations.

Available Courses:
${coursesContext}

Format your response as a JSON array with this structure:
[
  {
    "courseId": "course_id_if_available",
    "title": "Course Title",
    "reason": "Why this course is recommended",
    "priority": "high|medium|low"
  }
]

If no specific courses match, provide general course categories and skills they should look for.`;

    const response = await axios.post(
      `${this.openaiBaseURL}/chat/completions`,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const gptResponse = response.data.choices[0].message.content;
    
    try {
      // Try to parse as JSON first
      const recommendations = JSON.parse(gptResponse);
      return {
        success: true,
        recommendations,
        rawResponse: gptResponse,
        provider: 'openai'
      };
    } catch (parseError) {
      // Try to extract JSON array from the text
      const jsonMatch = gptResponse.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        try {
          const recommendations = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            recommendations,
            textResponse: gptResponse,
            rawResponse: gptResponse,
            provider: 'openai'
          };
        } catch (extractError) {
          // Fall through to text response
        }
      }
      
      // If not valid JSON, return as text
      return {
        success: true,
        recommendations: [],
        textResponse: gptResponse,
        rawResponse: gptResponse,
        provider: 'openai'
      };
    }
  }

  async getGroqRecommendations(userPrompt, availableCourses = []) {
    // Create a context with available courses
    const coursesContext = availableCourses.map(course => 
      `- ${course.title}: ${course.description} (Category: ${course.category}, Level: ${course.difficulty})`
    ).join('\n');

    const systemPrompt = `You are an educational advisor for an online learning platform. 
Based on the user's career goals and interests, recommend courses from the available catalog.
Always provide practical, relevant recommendations with explanations.

Available Courses:
${coursesContext}

Format your response as a JSON array with this structure:
[
  {
    "courseId": "course_id_if_available",
    "title": "Course Title",
    "reason": "Why this course is recommended",
    "priority": "high|medium|low"
  }
]

If no specific courses match, provide general course categories and skills they should look for.`;

    const response = await axios.post(
      `${this.groqBaseURL}/chat/completions`,
      {
        model: this.groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const groqResponse = response.data.choices[0].message.content;
    
    try {
      // Try to parse as JSON first
      const recommendations = JSON.parse(groqResponse);
      return {
        success: true,
        recommendations,
        rawResponse: groqResponse,
        provider: 'groq'
      };
    } catch (parseError) {
      // Try to extract JSON array from the text
      const jsonMatch = groqResponse.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        try {
          const recommendations = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            recommendations,
            textResponse: groqResponse,
            rawResponse: groqResponse,
            provider: 'groq'
          };
        } catch (extractError) {
          // Fall through to text response
        }
      }
      
      // If not valid JSON, return as text
      return {
        success: true,
        recommendations: [],
        textResponse: groqResponse,
        rawResponse: groqResponse,
        provider: 'groq'
      };
    }
  }

  getFallbackRecommendations(userPrompt, availableCourses) {
    const prompt = userPrompt.toLowerCase();
    const recommendations = [];

    // Simple keyword matching for fallback
    const keywords = {
      'software engineer': ['programming', 'javascript', 'python', 'web development'],
      'web developer': ['html', 'css', 'javascript', 'react', 'node'],
      'data scientist': ['python', 'statistics', 'machine learning', 'data analysis'],
      'mobile developer': ['react native', 'flutter', 'ios', 'android'],
      'designer': ['ui', 'ux', 'design', 'photoshop', 'figma']
    };

    // Find matching courses based on keywords
    for (const [career, skills] of Object.entries(keywords)) {
      if (prompt.includes(career)) {
        availableCourses.forEach(course => {
          const courseText = `${course.title} ${course.description} ${course.category}`.toLowerCase();
          if (skills.some(skill => courseText.includes(skill))) {
            recommendations.push({
              courseId: course._id,
              title: course.title,
              reason: `Recommended for ${career} career path`,
              priority: 'medium'
            });
          }
        });
        break;
      }
    }

    return recommendations;
  }

  async generateCourseContent(courseTitle, courseDescription) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = `Create a detailed course outline for: "${courseTitle}"
Description: ${courseDescription}

Please provide:
1. Course objectives
2. Prerequisites
3. Lesson structure (at least 5 lessons)
4. Learning outcomes

Format as JSON with this structure:
{
  "objectives": ["objective1", "objective2"],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "lessons": [
    {
      "title": "Lesson Title",
      "content": "Lesson content description",
      "duration": 30,
      "order": 1
    }
  ],
  "learningOutcomes": ["outcome1", "outcome2"]
}`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const gptResponse = response.data.choices[0].message.content;
      
      try {
        const courseContent = JSON.parse(gptResponse);
        return {
          success: true,
          content: courseContent
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse course content',
          rawResponse: gptResponse
        };
      }

    } catch (error) {
      logger.error('GPT Course Content Generation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GPTService();
