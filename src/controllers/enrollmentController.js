const { enrollmentService } = require('../services');
const { HTTP_STATUS, MESSAGES } = require('../constants');
const { successResponse, paginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware');

class EnrollmentController {
  // Enroll in course
  enrollInCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.body;

    const enrollment = await enrollmentService.enrollInCourse(req.user._id, courseId);

    return successResponse(
      res,
      MESSAGES.SUCCESS.ENROLLMENT_SUCCESS,
      enrollment,
      HTTP_STATUS.CREATED
    );
  });

  // Get user enrollments
  getUserEnrollments = asyncHandler(async (req, res) => {
    const { page, limit, sort, order, status } = req.query;

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      sort,
      order,
      status
    };

    const result = await enrollmentService.getUserEnrollments(req.user._id, pagination);

    return paginatedResponse(
      res,
      'User enrollments retrieved successfully',
      result.enrollments,
      result.pagination
    );
  });

  // Get course enrollments (for instructors)
  getCourseEnrollments = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page, limit, sort, order, status } = req.query;

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      sort,
      order,
      status
    };

    const result = await enrollmentService.getCourseEnrollments(
      courseId,
      req.user._id,
      pagination
    );

    return paginatedResponse(
      res,
      'Course enrollments retrieved successfully',
      result.enrollments,
      result.pagination
    );
  });

  // Get enrollment by ID
  getEnrollmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const enrollment = await enrollmentService.getEnrollmentById(id, req.user._id);

    return successResponse(
      res,
      'Enrollment retrieved successfully',
      enrollment
    );
  });

  // Update enrollment progress
  updateProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const progressData = req.body;

    const enrollment = await enrollmentService.updateProgress(
      id,
      req.user._id,
      progressData
    );

    return successResponse(
      res,
      'Progress updated successfully',
      enrollment
    );
  });

  // Complete lesson
  completeLesson = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lessonId, timeSpent } = req.body;

    const enrollment = await enrollmentService.completeLesson(
      id,
      req.user._id,
      lessonId,
      timeSpent
    );

    return successResponse(
      res,
      'Lesson completed successfully',
      enrollment
    );
  });

  // Cancel enrollment
  cancelEnrollment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await enrollmentService.cancelEnrollment(id, req.user._id);

    return successResponse(
      res,
      MESSAGES.SUCCESS.ENROLLMENT_CANCELLED,
      result
    );
  });

  // Get enrollment statistics
  getEnrollmentStats = asyncHandler(async (req, res) => {
    const isInstructor = req.user.role === 'instructor' || req.user.role === 'admin';

    const stats = await enrollmentService.getEnrollmentStats(req.user._id, isInstructor);

    return successResponse(
      res,
      'Enrollment statistics retrieved successfully',
      stats
    );
  });

  // Get enrollment summary
  getEnrollmentSummary = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const summary = await enrollmentService.getEnrollmentSummary(id, req.user._id);

    return successResponse(
      res,
      'Enrollment summary retrieved successfully',
      summary
    );
  });
}

module.exports = new EnrollmentController();
