require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { connectDB } = require('../config/database');
const logger = require('../utils/logger');

async function checkUsersAndReset() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database');

    // Find existing users
    const users = await User.find({});
    logger.info(`Found ${users.length} users in database`);
    
    // Print users
    if (users.length > 0) {
      users.forEach(user => {
        logger.info(`User: ${user.email}, Role: ${user.role}`);
      });
    }

    // Delete all users
    await User.deleteMany({});
    logger.info('All users have been deleted');

    // Create test users
    const password = await bcrypt.hash('password123', 12);
    
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: password,
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      },
      {
        username: 'instructor',
        email: 'instructor@example.com',
        password: password,
        role: 'instructor',
        isActive: true,
        isEmailVerified: true
      },
      {
        username: 'student',
        email: 'student@example.com',
        password: password,
        role: 'student',
        isActive: true,
        isEmailVerified: true
      }
    ];
    
    await User.insertMany(testUsers);
    logger.info('Test users created successfully');
    logger.info('Login credentials for all users: password123');

    mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error checking users:', error);
    process.exit(1);
  }
}

// Execute the script
checkUsersAndReset();
