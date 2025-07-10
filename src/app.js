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
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
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
    console.log('CORS Origin:', config.CORS_ORIGIN);
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
  }

  initializeRoutes() {
    // API routes
    this.app.use('/api', routes);

    // API documentation endpoint
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
          users: '/api/users'
        },
        documentation: config.API_URL + '/api-docs' || 'https://api-docs.example.com'
      });
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
      // Try to connect to database
      try {
        await connectDB();
        logger.info('✅ Database connection established');
      } catch (error) {
        logger.warn('⚠️  Database connection failed, starting without database');
        logger.warn('Database error:', error.message);
      }

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
