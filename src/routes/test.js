const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { asyncHandler } = require('../middleware');
const logger = require('../utils/logger');

const router = express.Router();

// Simple test endpoint that bypasses the normal auth flow
router.post('/test-login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  logger.info(`Test login attempt for ${email}`);
  
  // Log what was received
  logger.info(`Email received: ${email}`);
  logger.info(`Password provided: ${!!password}`);
  logger.info(`Password length: ${password?.length || 0}`);
  
  try {
    // Find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      logger.info(`No user found with email: ${email}`);
      return res.status(200).json({ 
        success: false,
        message: 'User not found',
        debug: { emailProvided: email }
      });
    }
    
    logger.info(`User found: ${user.email}`);
    
    // Test password directly with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    logger.info(`Password match result: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(200).json({
        success: false,
        message: 'Password incorrect',
        debug: {
          passwordProvided: !!password,
          passwordLength: password?.length || 0
        }
      });
    }
    
    // Create a simple response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken: 'test-token-123',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Test login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing login',
      error: error.message
    });
  }
}));

module.exports = router;
