const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./index');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connection = null;
    this.retryAttempts = 0;
    this.maxRetries = 3;
  }

  async connect() {
    while (this.retryAttempts < this.maxRetries) {
      try {
        // Connection options (removed deprecated options)
        const options = {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          retryWrites: true,
          w: 'majority',
          dbName: 'online-learning-platform'
        };

        logger.info(`Attempting to connect to MongoDB (attempt ${this.retryAttempts + 1}/${this.maxRetries})...`);
        
        // Connect to MongoDB
        this.connection = await mongoose.connect(config.MONGODB_URI, options);

        this.isConnected = true;
        this.retryAttempts = 0; // Reset retry counter on successful connection
        logger.info(`✅ MongoDB Connected: ${this.connection.connection.host}`);

        // Connection event listeners
        mongoose.connection.on('connected', () => {
          logger.info('MongoDB connected successfully');
          this.isConnected = true;
        });

        mongoose.connection.on('error', (err) => {
          logger.error('MongoDB connection error:', err);
          this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
          this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
          logger.info('MongoDB reconnected');
          this.isConnected = true;
        });

        return; // Exit the retry loop on successful connection

      } catch (error) {
        this.retryAttempts++;
        logger.error(`MongoDB connection failed (attempt ${this.retryAttempts}/${this.maxRetries}):`, error.message);
        
        // Log additional error details for debugging
        if (error.name === 'MongooseServerSelectionError') {
          logger.error('Server selection error - possible causes:');
          logger.error('1. Incorrect connection string');
          logger.error('2. Network connectivity issues');
          logger.error('3. MongoDB Atlas IP whitelist restrictions');
          logger.error('4. Invalid credentials');
        }
        
        if (this.retryAttempts >= this.maxRetries) {
          logger.error('Max retry attempts reached. Starting server without database connection.');
          this.isConnected = false;
          
          // Don't throw error, let the server start without DB for development
          if (config.NODE_ENV === 'development') {
            logger.warn('⚠️  Server starting without MongoDB connection (development mode)');
            return;
          } else {
            throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error.message}`);
          }
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        this.isConnected = false;
        logger.info('MongoDB disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async gracefulShutdown() {
    logger.info('Received termination signal, closing MongoDB connection...');
    await this.disconnect();
    process.exit(0);
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Export connection functions
const connectDB = async () => {
  await dbManager.connect();
};

const disconnectDB = async () => {
  await dbManager.disconnect();
};

const getDBStatus = () => dbManager.getStatus();

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
  dbManager
};
