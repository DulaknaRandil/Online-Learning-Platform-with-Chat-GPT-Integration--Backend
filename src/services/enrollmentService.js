const { Enrollment, Course, User } = require('../models');
const { MESSAGES, ENROLLMENT_STATUS, PAGINATION } = require('../constants');
const logger = require('../utils/logger');

class EnrollmentService {
  // Enroll user in course
  async enrollInCourse(studentId, courseId, paymentDetails = null) {
    try {
      // Check if course exists and is published
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      if (course.status !== 'published') {
        throw new Error('Course is not available for enrollment');
      }

      // Check if enrollment is available (for courses with max enrollment limits)
      if (course.maxStudents && course.enrollmentCount >= course.maxStudents) {
        throw new Error(MESSAGES.ERROR.ENROLLMENT_FULL);
      }

      // Check if user is already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
      });

      if (existingEnrollment) {
        throw new Error(MESSAGES.ERROR.ALREADY_ENROLLED);
      }

      // Create default payment info based on course price
      const defaultPaymentInfo = {
        amount: course.price,
        currency: 'USD',
        paymentMethod: course.price === 0 ? 'free' : 'credit_card',
        transactionId: course.price === 0 ? 
          `free_${Date.now()}_${Math.floor(Math.random() * 1000)}` : 
          `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        paidAt: new Date()
      };

      // Use provided payment details if available, otherwise use defaults
      const paymentInfo = paymentDetails || defaultPaymentInfo;

      // Create enrollment
      const enrollment = new Enrollment({
        student: studentId,
        course: courseId,
        paymentInfo
      });

      await enrollment.save();

      // Update course enrollment count
      course.enrollmentCount += 1;
      await course.save();

      // Add course to user's enrolled courses
      await User.findByIdAndUpdate(studentId, {
        $push: { enrolledCourses: courseId }
      });

      await enrollment.populate([
        { path: 'student', select: 'username email' },
        { path: 'course', select: 'title instructor price' }
      ]);

      logger.info(`User ${studentId} enrolled in course ${courseId} with payment method ${paymentInfo.paymentMethod}`);

      return enrollment;
    } catch (error) {
      logger.error('Enroll in course error:', error);
      throw error;
    }
  }

  // Get user enrollments
  async getUserEnrollments(userId, pagination = {}) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = 'enrollmentDate',
        order = 'desc',
        status
      } = pagination;

      const skip = (page - 1) * limit;
      const sortOrder = order === 'desc' ? -1 : 1;

      const query = { student: userId };
      if (status) query.status = status;

      const enrollments = await Enrollment.find(query)
        .populate('course', 'title thumbnail instructor price duration')
        .populate('course.instructor', 'username email')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit);

      const totalItems = await Enrollment.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        enrollments,
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
      logger.error('Get user enrollments error:', error);
      throw error;
    }
  }

  // Get course enrollments (for instructors)
  async getCourseEnrollments(courseId, instructorId, pagination = {}) {
    try {
      // Verify instructor owns the course
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error(MESSAGES.ERROR.COURSE_NOT_FOUND);
      }

      if (course.instructor.toString() !== instructorId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = 'enrollmentDate',
        order = 'desc',
        status
      } = pagination;

      const skip = (page - 1) * limit;
      const sortOrder = order === 'desc' ? -1 : 1;

      const query = { course: courseId };
      if (status) query.status = status;

      const enrollments = await Enrollment.find(query)
        .populate('student', 'username email avatar')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit);

      const totalItems = await Enrollment.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        enrollments,
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
      logger.error('Get course enrollments error:', error);
      throw error;
    }
  }

  // Get enrollment by ID
  async getEnrollmentById(enrollmentId, userId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'username email avatar')
        .populate('course', 'title description instructor lessons');

      if (!enrollment) {
        throw new Error(MESSAGES.ERROR.ENROLLMENT_NOT_FOUND);
      }

      // Check if user is the student or instructor
      if (enrollment.student._id.toString() !== userId && 
          enrollment.course.instructor.toString() !== userId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      return enrollment;
    } catch (error) {
      logger.error('Get enrollment by ID error:', error);
      throw error;
    }
  }

  // Update enrollment progress
  async updateProgress(enrollmentId, studentId, progressData) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);

      if (!enrollment) {
        throw new Error(MESSAGES.ERROR.ENROLLMENT_NOT_FOUND);
      }

      if (enrollment.student.toString() !== studentId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      const { progress, completedLessons, lastAccessedLesson } = progressData;

      if (progress !== undefined) {
        enrollment.progress.percentage = Math.min(100, Math.max(0, progress));
      }

      if (completedLessons) {
        enrollment.progress.completedLessons = completedLessons;
      }

      if (lastAccessedLesson) {
        enrollment.progress.lastAccessedLesson = lastAccessedLesson;
      }

      await enrollment.save();

      logger.info(`Progress updated for enrollment ${enrollmentId}`);

      return enrollment;
    } catch (error) {
      logger.error('Update progress error:', error);
      throw error;
    }
  }

  // Complete lesson
  async completeLesson(enrollmentId, studentId, lessonId, timeSpent = 0) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('course', 'lessons');

      if (!enrollment) {
        throw new Error(MESSAGES.ERROR.ENROLLMENT_NOT_FOUND);
      }

      if (enrollment.student.toString() !== studentId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      // Complete the lesson
      enrollment.completeLesson(lessonId, timeSpent);

      // Calculate progress percentage
      const totalLessons = enrollment.course.lessons.length;
      const completedLessons = enrollment.progress.completedLessons.length;
      enrollment.progress.percentage = Math.round((completedLessons / totalLessons) * 100);

      await enrollment.save();

      logger.info(`Lesson ${lessonId} completed for enrollment ${enrollmentId}`);

      return enrollment;
    } catch (error) {
      logger.error('Complete lesson error:', error);
      throw error;
    }
  }

  // Cancel enrollment
  async cancelEnrollment(enrollmentId, studentId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);

      if (!enrollment) {
        throw new Error(MESSAGES.ERROR.ENROLLMENT_NOT_FOUND);
      }

      if (enrollment.student.toString() !== studentId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      // Check if enrollment can be cancelled
      if (enrollment.status === ENROLLMENT_STATUS.COMPLETED) {
        throw new Error('Cannot cancel completed enrollment');
      }

      enrollment.status = ENROLLMENT_STATUS.DROPPED;
      await enrollment.save();

      // Update course enrollment count
      await Course.findByIdAndUpdate(enrollment.course, {
        $inc: { enrollmentCount: -1 }
      });

      // Remove course from user's enrolled courses
      await User.findByIdAndUpdate(studentId, {
        $pull: { enrolledCourses: enrollment.course }
      });

      logger.info(`Enrollment ${enrollmentId} cancelled`);

      return { message: MESSAGES.SUCCESS.ENROLLMENT_CANCELLED };
    } catch (error) {
      logger.error('Cancel enrollment error:', error);
      throw error;
    }
  }

  // Get enrollment statistics
  async getEnrollmentStats(userId, isInstructor = false) {
    try {
      let stats = {};

      if (isInstructor) {
        // Get instructor's course enrollments
        const courses = await Course.find({ instructor: userId });
        const courseIds = courses.map(course => course._id);

        const totalEnrollments = await Enrollment.countDocuments({
          course: { $in: courseIds }
        });

        const completedEnrollments = await Enrollment.countDocuments({
          course: { $in: courseIds },
          status: ENROLLMENT_STATUS.COMPLETED
        });

        const activeEnrollments = await Enrollment.countDocuments({
          course: { $in: courseIds },
          status: ENROLLMENT_STATUS.ACTIVE
        });

        const totalRevenue = await Enrollment.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: null, total: { $sum: '$paymentInfo.amount' } } }
        ]);

        stats = {
          totalEnrollments,
          completedEnrollments,
          activeEnrollments,
          completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
          totalRevenue: totalRevenue[0]?.total || 0
        };
      } else {
        // Get student's enrollment stats
        const totalEnrollments = await Enrollment.countDocuments({ student: userId });
        const completedEnrollments = await Enrollment.countDocuments({
          student: userId,
          status: ENROLLMENT_STATUS.COMPLETED
        });

        const activeEnrollments = await Enrollment.countDocuments({
          student: userId,
          status: ENROLLMENT_STATUS.ACTIVE
        });

        const totalSpent = await Enrollment.aggregate([
          { $match: { student: userId } },
          { $group: { _id: null, total: { $sum: '$paymentInfo.amount' } } }
        ]);

        stats = {
          totalEnrollments,
          completedEnrollments,
          activeEnrollments,
          completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
          totalSpent: totalSpent[0]?.total || 0
        };
      }

      return stats;
    } catch (error) {
      logger.error('Get enrollment stats error:', error);
      throw error;
    }
  }

  // Get enrollment summary
  async getEnrollmentSummary(enrollmentId, userId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('course', 'title lessons');

      if (!enrollment) {
        throw new Error(MESSAGES.ERROR.ENROLLMENT_NOT_FOUND);
      }

      if (enrollment.student.toString() !== userId) {
        throw new Error(MESSAGES.ERROR.FORBIDDEN);
      }

      return enrollment.getSummary();
    } catch (error) {
      logger.error('Get enrollment summary error:', error);
      throw error;
    }
  }
}

module.exports = new EnrollmentService();
