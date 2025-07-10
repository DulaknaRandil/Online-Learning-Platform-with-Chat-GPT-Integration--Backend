require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');
const { connectDB } = require('../config/database');
const logger = require('../utils/logger');

async function unlockAllAccounts() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database');

    // Find all locked accounts
    const lockedUsers = await User.find({ 
      $or: [
        { loginAttempts: { $gt: 0 } },
        { lockUntil: { $exists: true } }
      ]
    });

    logger.info(`Found ${lockedUsers.length} locked accounts`);

    // Unlock all accounts
    const result = await User.updateMany(
      {},
      {
        $unset: {
          loginAttempts: 1,
          lockUntil: 1
        }
      }
    );

    logger.info(`Reset ${result.modifiedCount} accounts`);
    
    // Print unlocked users
    const users = await User.find({}).select('email role');
    logger.info('Available users:');
    users.forEach(user => {
      logger.info(`${user.email} (${user.role})`);
    });

    mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error unlocking accounts:', error);
    process.exit(1);
  }
}

// Execute the script
unlockAllAccounts();
