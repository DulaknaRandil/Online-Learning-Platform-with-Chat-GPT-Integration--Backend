/**
 * Payment Controller
 * 
 * Handles mock payment processing for course enrollments
 */

const { Course } = require('../models');
const { HTTP_STATUS, MESSAGES } = require('../constants');
const { successResponse, errorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware');
const logger = require('../utils/logger');
const { paymentService, enrollmentService } = require('../services');

class PaymentController {
  /**
   * Initialize a mock payment
   * 
   * @route POST /payment/initiate
   * @access Private (student)
   */
  initiatePayment = asyncHandler(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user._id;

    try {
      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return errorResponse(res, MESSAGES.ERROR.COURSE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Check if course is free
      if (!course.price || course.price <= 0) {
        return errorResponse(res, 'Course is free. No payment required.', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if already enrolled
      const existingEnrollment = await enrollmentService.getEnrollmentByStudentAndCourse(userId, courseId);
      if (existingEnrollment) {
        return errorResponse(res, 'Already enrolled in this course', HTTP_STATUS.BAD_REQUEST);
      }

      // Create payment session using the payment service
      const paymentSession = await paymentService.createPaymentSession(userId, courseId);
      
      // Return payment details
      return successResponse(res, 'Payment initiated', {
        paymentSessionId: paymentSession.paymentSessionId,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        courseId: course._id,
        courseTitle: course.title,
        paymentUrl: paymentSession.paymentUrl
      });
    } catch (error) {
      logger.error('Error initiating payment:', error);
      return errorResponse(
        res,
        'Failed to initiate payment process',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  });

  /**
   * Process a mock payment
   * 
   * @route POST /payment/process/:sessionId
   * @access Private (student)
   */
  processPayment = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { courseId } = req.body;
    const userId = req.user._id;

    try {
      // Validate session ID format
      if (!sessionId.startsWith('mock_payment_')) {
        return errorResponse(res, 'Invalid payment session', HTTP_STATUS.BAD_REQUEST);
      }
      
      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return errorResponse(res, MESSAGES.ERROR.COURSE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }
      
      // Process payment using payment service
      const paymentResult = await paymentService.processPayment(sessionId);
      
      // Complete enrollment after successful payment
      const enrollment = await paymentService.completeEnrollmentAfterPayment(userId, courseId, {
        amount: course.price,
        currency: 'USD',
        paymentMethod: 'credit_card',
        transactionId: paymentResult.transactionId
      });

      // Update course enrollment count
      await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });
      
      logger.info(`Payment processed successfully for course ${courseId} by user ${userId}`);
      
      return successResponse(
        res,
        'Payment processed successfully. You are now enrolled in the course.',
        {
          enrollmentId: enrollment._id,
          courseId: course._id,
          courseTitle: course.title,
          transactionId: paymentResult.transactionId,
          amount: course.price
        }
      );
    } catch (error) {
      logger.error('Error processing payment:', error);
      return errorResponse(
        res,
        'Failed to process payment',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  });

  /**
   * Verify payment status
   * 
   * @route GET /payment/verify/:transactionId
   * @access Private (student)
   */
  verifyPayment = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    
    try {
      const paymentStatus = await paymentService.verifyPayment(transactionId);
      
      return successResponse(res, 'Payment verification completed', paymentStatus);
    } catch (error) {
      logger.error('Error verifying payment:', error);
      return errorResponse(
        res,
        'Failed to verify payment status',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  });
}

module.exports = new PaymentController();
