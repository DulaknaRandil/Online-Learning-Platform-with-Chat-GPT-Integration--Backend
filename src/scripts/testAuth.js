require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { connectDB } = require('../config/database');
const logger = require('../utils/logger');

async function testAuthentication() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database');

    // Get all users
    const users = await User.find({});
    logger.info(`Found ${users.length} users in database`);
    
    // Try authenticating each user
    for (const user of users) {
      logger.info(`Testing authentication for ${user.email}`);
      
      const plainPassword = 'password123';
      
      // Test the bcrypt compare directly
      const passwordMatch = await bcrypt.compare(plainPassword, user.password);
      logger.info(`Direct bcrypt compare for ${user.email}: ${passwordMatch ? 'SUCCESS' : 'FAILED'}`);
      
      // Test the model method
      const modelMatch = await user.comparePassword(plainPassword);
      logger.info(`Model comparePassword for ${user.email}: ${modelMatch ? 'SUCCESS' : 'FAILED'}`);
    }

    mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error testing authentication:', error);
    process.exit(1);
  }
}

// Execute the script
testAuthentication();
