const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const enrollmentRoutes = require('./enrollments');
const recommendationRoutes = require('./recommendations');
const userRoutes = require('./users');
const adminRoutes = require('./admin');
const paymentRoutes = require('./payment');

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;
