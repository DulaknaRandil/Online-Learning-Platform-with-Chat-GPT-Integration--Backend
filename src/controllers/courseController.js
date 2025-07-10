const { courseService } = require('../services');
const { HTTP_STATUS, MESSAGES } = require('../constants');
const { successResponse, paginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware');

class CourseController {
  // Create new course
  createCourse = asyncHandler(async (req, res) => {
    const course = await courseService.createCourse(req.body, req.user._id);

    return successResponse(
      res,
      MESSAGES.SUCCESS.COURSE_CREATED,
      course,
      HTTP_STATUS.CREATED
    );
  });

  // Get all courses with pagination and filtering
  getAllCourses = asyncHandler(async (req, res) => {
    const { page, limit, sort, order, category, difficulty, minPrice, maxPrice, search, instructor } = req.query;

    const filters = {
      category,
      difficulty,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      instructor
    };

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      sort,
      order
    };

    const result = await courseService.getAllCourses(filters, pagination);

    return paginatedResponse(
      res,
      'Courses retrieved successfully',
      result.courses,
      result.pagination
    );
  });

  // Get course by ID
  getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await courseService.getCourseById(id);

    return successResponse(
      res,
      'Course retrieved successfully',
      course
    );
  });

  // Update course
  updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await courseService.updateCourse(id, req.body, req.user._id);

    return successResponse(
      res,
      MESSAGES.SUCCESS.COURSE_UPDATED,
      course
    );
  });

  // Delete course
  deleteCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await courseService.deleteCourse(id, req.user._id);

    return successResponse(
      res,
      MESSAGES.SUCCESS.COURSE_DELETED,
      result
    );
  });

  // Get courses by instructor
  getInstructorCourses = asyncHandler(async (req, res) => {
    const { page, limit, sort, order } = req.query;

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      sort,
      order
    };

    const result = await courseService.getCoursesByInstructor(req.user._id, pagination);

    return paginatedResponse(
      res,
      'Instructor courses retrieved successfully',
      result.courses,
      result.pagination
    );
  });

  // Publish course
  publishCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await courseService.publishCourse(id, req.user._id);

    return successResponse(
      res,
      'Course published successfully',
      course
    );
  });

  // Add lesson to course
  addLesson = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await courseService.addLesson(id, req.body, req.user._id);

    return successResponse(
      res,
      'Lesson added successfully',
      course
    );
  });

  // Update lesson
  updateLesson = asyncHandler(async (req, res) => {
    const { id, lessonId } = req.params;

    const course = await courseService.updateLesson(id, lessonId, req.body, req.user._id);

    return successResponse(
      res,
      'Lesson updated successfully',
      course
    );
  });

  // Delete lesson
  deleteLesson = asyncHandler(async (req, res) => {
    const { id, lessonId } = req.params;

    const course = await courseService.deleteLesson(id, lessonId, req.user._id);

    return successResponse(
      res,
      'Lesson deleted successfully',
      course
    );
  });

  // Add review to course
  addReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const course = await courseService.addReview(id, req.user._id, rating, comment);

    return successResponse(
      res,
      'Review added successfully',
      course
    );
  });

  // Get course statistics
  getCourseStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const stats = await courseService.getCourseStats(id, req.user._id);

    return successResponse(
      res,
      'Course statistics retrieved successfully',
      stats
    );
  });

  // Search courses
  searchCourses = asyncHandler(async (req, res) => {
    const { q, category, difficulty, minPrice, maxPrice, page, limit } = req.query;

    const filters = {
      search: q,
      category,
      difficulty,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    };

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    };

    const result = await courseService.getAllCourses(filters, pagination);

    return paginatedResponse(
      res,
      'Search results retrieved successfully',
      result.courses,
      result.pagination
    );
  });
}

module.exports = new CourseController();
