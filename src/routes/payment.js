/**
 * Payment Routes
 * 
 * Routes for handling payment processing
 */

const express = require('express');
const { paymentController } = require('../controllers');
const { auth, isStudent } = require('../middleware');
const { validate, commonSchemas } = require('../validators');

const router = express.Router();

// All payment routes require authentication
router.use(auth);

// Initialize payment
router.post(
  '/initiate',
  isStudent,
  validate(commonSchemas.mongoId, 'body', 'courseId'),
  paymentController.initiatePayment
);

// Process payment
router.post(
  '/process/:sessionId',
  isStudent,
  validate(commonSchemas.mongoId, 'body', 'courseId'),
  paymentController.processPayment
);

// Verify payment status
router.get(
  '/verify/:sessionId',
  paymentController.verifyPayment
);

module.exports = router;
