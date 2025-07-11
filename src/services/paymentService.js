/**
 * Payment Service
 * 
 * Handles mock payment processing functionality
 */

const logger = require('../utils/logger');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

class PaymentService {
  /**
   * Create a mock payment session
   * 
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {object} paymentDetails - Payment details
   * @returns {object} Payment session details
   */
  async createPaymentSession(userId, courseId) {
    try {
      // Verify course exists and has a price
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      
      if (course.price === 0) {
        throw new Error('Course is free. No payment required.');
      }

      // Generate mock payment session
      const paymentSessionId = `mock_payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // In a real implementation, we would store this session in a database
      // For this mock implementation, we'll just return the details
      return {
        paymentSessionId,
        userId,
        courseId,
        amount: course.price,
        currency: 'USD',
        status: 'pending',
        createdAt: new Date(),
        paymentUrl: `/api/payment/process/${paymentSessionId}`
      };
    } catch (error) {
      logger.error('Error creating payment session:', error);
      throw error;
    }
  }

  /**
   * Process a mock payment
   * 
   * @param {string} sessionId - Payment session ID
   * @param {object} cardDetails - Card details (not stored, just for simulation)
   * @returns {object} Payment result
   */
  async processPayment(sessionId) {
    try {
      // In a real implementation, we would validate the session and process payment
      // For this mock implementation, we'll just simulate success
      
      // Extract courseId and userId from sessionId (in a real implementation these would be stored)
      const parts = sessionId.split('_');
      const timestamp = parts[2] || Date.now();
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate transaction ID
      const transactionId = `txn_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
      
      return {
        transactionId,
        paymentSessionId: sessionId,
        status: 'success',
        processingDate: new Date()
      };
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   * 
   * @param {string} transactionId - Transaction ID
   * @returns {object} Payment status
   */
  async verifyPayment(transactionId) {
    try {
      // In a real implementation, we would check the payment status in a payment gateway
      // For this mock implementation, we'll just simulate success
      
      // All payments are successful in this mock implementation
      return {
        transactionId,
        status: 'success',
        verifiedAt: new Date()
      };
    } catch (error) {
      logger.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Complete the enrollment after successful payment
   * 
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {object} paymentDetails - Payment details
   * @returns {object} Enrollment details
   */
  async completeEnrollmentAfterPayment(userId, courseId, paymentDetails) {
    try {
      // Check if enrollment already exists
      let enrollment = await Enrollment.findOne({ 
        student: userId, 
        course: courseId 
      });

      if (enrollment) {
        // Update existing enrollment with payment info
        enrollment.paymentInfo = {
          amount: paymentDetails.amount,
          currency: paymentDetails.currency || 'USD',
          paymentMethod: paymentDetails.paymentMethod || 'credit_card',
          transactionId: paymentDetails.transactionId,
          paidAt: new Date()
        };
        
        await enrollment.save();
      } else {
        // Create new enrollment with payment info
        enrollment = await Enrollment.create({
          student: userId,
          course: courseId,
          status: 'active',
          enrollmentDate: new Date(),
          paymentInfo: {
            amount: paymentDetails.amount,
            currency: paymentDetails.currency || 'USD',
            paymentMethod: paymentDetails.paymentMethod || 'credit_card',
            transactionId: paymentDetails.transactionId,
            paidAt: new Date()
          }
        });
      }

      return enrollment;
    } catch (error) {
      logger.error('Error completing enrollment after payment:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
