const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const { connectDB } = require('./config/database');
const routes = require('./routes');
const { 
  errorHandler, 
  notFoundHandler, 
  generalLimiter 
} = require('./middleware');
const logger = require('./utils/logger');

class App {
  constructor() {
    try {
      this.app = express();
      this.initializeMiddleware();
      this.initializeRoutes();
      this.initializeErrorHandling();
      
      // Initialize database connection for serverless environments (non-blocking)
      this.initializeDatabase().catch(error => {
        logger.error('Database initialization failed:', error.message);
        // Don't crash the app, just log the error
      });
    } catch (error) {
      console.error('App constructor failed:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    try {
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000);
      });
      
      await Promise.race([connectDB(), timeoutPromise]);
      logger.info('✅ Database connection established');
    } catch (error) {
      logger.warn('⚠️  Database connection failed');
      logger.warn('Database error:', error.message);
      // Don't throw the error, just log it
    }
  }

  initializeMiddleware() {
    try {
      // Security middleware
      this.app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      }));

      // CORS configuration
      logger.info('CORS Origin:', config.CORS_ORIGIN);
      this.app.use(cors({
        origin: '*', // Allow all origins for simplicity during development
        credentials: true, // Changed back to true for proper cookie handling
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Length', 'X-Requested-With', 'Authorization']
      }));

      // Rate limiting
      this.app.use(generalLimiter);

      // Logging
      if (config.NODE_ENV !== 'test') {
        this.app.use(morgan('combined', {
          stream: {
            write: (message) => logger.info(message.trim())
          }
        }));
      }

    // Body parser middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Request parsing middleware
    this.app.use((req, res, next) => {
      req.requestTime = new Date().toISOString();
      next();
    });
    } catch (error) {
      logger.error('Failed to initialize middleware:', error);
      throw error;
    }
  }

  initializeRoutes() {
    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Online Learning Platform API - Backend Server',
        version: '1.0.0',
        status: 'Running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          documentation: '/api',
          auth: '/api/auth',
          courses: '/api/courses',
          enrollments: '/api/enrollments',
          recommendations: '/api/recommendations',
          users: '/api/users',
          admin: '/api/admin',
          payment: '/api/payment'
        }
      });
    });

    // API documentation endpoint (must come before mounting routes)
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'Online Learning Platform API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          courses: '/api/courses',
          enrollments: '/api/enrollments',
          recommendations: '/api/recommendations',
          users: '/api/users',
          admin: '/api/admin',
          payment: '/api/payment'
        },
        documentation: config.API_URL + '/api-docs' || 'https://api-docs.example.com'
      });
    });

    // Mount API routes
    this.app.use('/api', routes);

    // Test route for debugging
    this.app.get('/test', (req, res) => {
      res.json({
        success: true,
        message: 'Test route working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        vercel: process.env.VERCEL || 'false'
      });
    });

    // Simple ping endpoint
    this.app.get('/ping', (req, res) => {
      res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
    });
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async start() {
    try {
      const PORT = config.PORT;
      
      this.server = this.app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📊 Environment: ${config.NODE_ENV}`);
        logger.info(`🔗 Health check: ${config.API_URL}/api/health`);
        logger.info(`📖 API documentation: ${config.API_URL}/api`);
        logger.info(`🌐 CORS enabled for: ${config.CORS_ORIGIN}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  gracefulShutdown() {
    logger.info('Received shutdown signal, shutting down gracefully...');
    
    this.server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connection
      require('mongoose').connection.close(() => {
        logger.info('Database connection closed');
        process.exit(0);
      });
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
}

module.exports = App;
