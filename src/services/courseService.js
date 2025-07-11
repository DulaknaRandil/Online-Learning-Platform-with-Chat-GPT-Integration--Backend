const { Course, User, Enrollment } = require('../models');
const { MESSAGES, COURSE_STATUS, PAGINATION } = require('../constants');
const logger = require('../utils/logger');

class CourseService {
  // Create a new course
  async createCourse(courseData, instructorId) {
    try {
      const course = new Course({
        ...courseData,
        instructor: instructorId
      });

      await course.save();
      await course.populate('instructor', 'username email');

      // Add to instructor's created courses
      await User.findByIdAndUpdate(instructorId, {
        $push: { createdCourses: course._id }
      });

      logger.info(`Course created successfully: ${course.title} by ${instructorId}`);

      return course;
    } catch (error) {
      logger.error('Create course error:', error);
      throw error;
    }
  }

  // Get all courses with pagination and filtering
  async getAllCourses(filters = {}, pagination = {}) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = 'createdAt',
        order = 'desc'
      } = pagination;

      const {
        category,
        difficulty,
        minPrice,
        maxPrice,
        search,
        instructor,
        status = COURSE_STATUS.PUBLISHED
      } = filters;

      // Build query
      const query = { status };

      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      if (instructor) query.instructor = instructor;

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
      }

      if (search) {
        query.$text = { $search: search };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOrder = order === 'desc' ? -1 : 1;

      // Execute query
      const courses = await Course.find(query)
        .populate('instructor', 'username email avatar')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit);

      const totalItems = await Course.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        courses,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get all courses error:', error);
      throw error;
    }
  }

  // Get course by ID
  async getCourseById(courseId, includeInstructor = true) {
    try {
      let query = Course.findById(courseId);

      if (includeInstructor) {
        query = query.populate('instructor', 'username email avatar bio');
      }

      const course = await query;

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      return course;
    } catch (error) {
      logger.error('Get course by ID error:', error);
      throw error;
    }
  }

  // Update course
  async updateCourse(courseId, updateData, instructorId) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      // Check if user is the instructor or admin
      if (course.instructor.toString() !== instructorId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      Object.assign(course, updateData);
      await course.save();
      await course.populate('instructor', 'username email avatar');

      logger.info(`Course updated successfully: ${course.title}`);

      return course;
    } catch (error) {
      logger.error('Update course error:', error);
      throw error;
    }
  }

  // Delete course
  async deleteCourse(courseId, userId, userRole = null) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      // Allow admins to delete any course, or instructors to delete their own courses
      if (userRole !== 'admin' && course.instructor.toString() !== userId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      // Check if course has enrollments
      const enrollmentCount = await Enrollment.countDocuments({ course: courseId });
      if (enrollmentCount > 0) {
        throw new Error('Cannot delete course with active enrollments');
      }

      await Course.findByIdAndDelete(courseId);

      // Remove from instructor's created courses (only if the user is the original instructor)
      await User.findByIdAndUpdate(course.instructor, {
        $pull: { createdCourses: courseId }
      });

      logger.info(`Course deleted successfully: ${course.title}`);

      return { message: MESSAGES.SUCCESS.COURSE_DELETED };
    } catch (error) {
      logger.error('Delete course error:', error);
      throw error;
    }
  }

  // Get courses by instructor
  async getCoursesByInstructor(instructorId, pagination = {}) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = 'createdAt',
        order = 'desc'
      } = pagination;

      const skip = (page - 1) * limit;
      const sortOrder = order === 'desc' ? -1 : 1;

      const courses = await Course.find({ instructor: instructorId })
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit);

      const totalItems = await Course.countDocuments({ instructor: instructorId });
      const totalPages = Math.ceil(totalItems / limit);

      return {
        courses,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get courses by instructor error:', error);
      throw error;
    }
  }

  // Publish course
  async publishCourse(courseId, userId, userRole = null) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      // Allow admins to toggle any course, or instructors to toggle their own courses
      if (userRole !== 'admin' && course.instructor.toString() !== userId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      // Validate course has minimum required content
      if (course.lessons.length === 0) {
        throw new Error('Course must have at least one lesson to be published');
      }

      // Toggle the course status
      if (course.status === COURSE_STATUS.PUBLISHED) {
        course.status = COURSE_STATUS.DRAFT;
      } else {
        course.status = COURSE_STATUS.PUBLISHED;
      }
      
      await course.save();

      logger.info(`Course status toggled to ${course.status}: ${course.title}`);

      return course;
    } catch (error) {
      logger.error('Publish course error:', error);
      throw error;
    }
  }

  // Add lesson to course
  async addLesson(courseId, lessonData, instructorId) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      if (course.instructor.toString() !== instructorId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      course.lessons.push(lessonData);
      await course.save();

      logger.info(`Lesson added to course: ${course.title}`);

      return course;
    } catch (error) {
      logger.error('Add lesson error:', error);
      throw error;
    }
  }

  // Update lesson
  async updateLesson(courseId, lessonId, lessonData, instructorId) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      if (course.instructor.toString() !== instructorId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      const lesson = course.lessons.id(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      Object.assign(lesson, lessonData);
      await course.save();

      logger.info(`Lesson updated in course: ${course.title}`);

      return course;
    } catch (error) {
      logger.error('Update lesson error:', error);
      throw error;
    }
  }

  // Delete lesson
  async deleteLesson(courseId, lessonId, instructorId) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      if (course.instructor.toString() !== instructorId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      course.lessons.id(lessonId).remove();
      await course.save();

      logger.info(`Lesson deleted from course: ${course.title}`);

      return course;
    } catch (error) {
      logger.error('Delete lesson error:', error);
      throw error;
    }
  }

  // Add review to course
  async addReview(courseId, userId, rating, comment) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      // Check if user is enrolled in the course
      const enrollment = await Enrollment.findOne({
        student: userId,
        course: courseId
      });

      if (!enrollment) {
        throw new Error('You must be enrolled in the course to leave a review');
      }

      // Check if user has already reviewed
      const existingReview = course.reviews.find(
        review => review.user.toString() === userId
      );

      if (existingReview) {
        // Update existing review
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.createdAt = new Date();
      } else {
        // Add new review
        course.reviews.push({
          user: userId,
          rating,
          comment
        });
      }

      // Recalculate average rating
      course.calculateAverageRating();
      await course.save();

      logger.info(`Review added to course: ${course.title}`);

      return course;
    } catch (error) {
      logger.error('Add review error:', error);
      throw error;
    }
  }

  // Get course statistics
  async getCourseStats(courseId, instructorId) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      if (course.instructor.toString() !== instructorId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      const enrollments = await Enrollment.find({ course: courseId });
      const totalEnrollments = enrollments.length;
      const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
      const activeEnrollments = enrollments.filter(e => e.status === 'active').length;

      const stats = {
        totalEnrollments,
        completedEnrollments,
        activeEnrollments,
        completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
        averageRating: course.rating.average,
        totalReviews: course.rating.count,
        revenue: totalEnrollments * course.price
      };

      return stats;
    } catch (error) {
      logger.error('Get course stats error:', error);
      throw error;
    }
  }
}

module.exports = new CourseService();
