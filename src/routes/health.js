const express = require('express');
const config = require('../config');
const { getDBStatus } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  try {
    const dbStatus = getDBStatus();
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: '1.0.0',
      memory: process.memoryUsage(),
      database: {
        ...dbStatus,
        status: dbStatus.isConnected ? 'Connected' : 'Disconnected'
      }
    };

    return successResponse(res, 'API is healthy', health);
  } catch (error) {
    return errorResponse(res, 'Health check failed', 500, error.message);
  }
});

// Detailed health check
router.get('/detailed', (req, res) => {
  try {
    const dbStatus = getDBStatus();
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: '1.0.0',
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      database: {
        ...dbStatus,
        status: dbStatus.isConnected ? 'Connected' : 'Disconnected'
      },
      api_endpoints: {
        auth: '/api/auth',
        courses: '/api/courses',
        enrollments: '/api/enrollments',
        recommendations: '/api/recommendations',
        users: '/api/users'
      }
    };

    return successResponse(res, 'Detailed health check', health);
  } catch (error) {
    return errorResponse(res, 'Detailed health check failed', 500, error.message);
  }
});

module.exports = router;
