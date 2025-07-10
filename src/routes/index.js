const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const enrollmentRoutes = require('./enrollments');
const recommendationRoutes = require('./recommendations');
const userRoutes = require('./users');
const testRoutes = require('./test');

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/users', userRoutes);
router.use('/test', testRoutes);

module.exports = router;
