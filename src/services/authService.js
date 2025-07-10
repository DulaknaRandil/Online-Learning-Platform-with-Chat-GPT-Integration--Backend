const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { MESSAGES, TOKEN_TYPES } = require('../constants');
const logger = require('../utils/logger');

class AuthService {
  // Generate JWT token
  generateToken(userId, type = TOKEN_TYPES.ACCESS) {
    const payload = {
      userId,
      type
    };

    const options = {
      expiresIn: type === TOKEN_TYPES.ACCESS ? '24h' : '7d'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    return this.generateToken(userId, TOKEN_TYPES.REFRESH);
  }

  // Verify token
  verifyToken(token, type = TOKEN_TYPES.ACCESS) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Register new user
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new Error(MESSAGES.ERROR.DUPLICATE_EMAIL);
        } else {
          throw new Error('Username already exists');
        }
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate tokens
      const accessToken = this.generateToken(user._id);
      const refreshToken = this.generateRefreshToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Debug logging
      logger.info(`Login attempt for email: ${email}`);
      
      // Find user by email
      const user = await User.findByEmail(email);
      
      if (!user) {
        logger.info(`No user found with email: ${email}`);
        throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);
      }

      // Check if account is locked
      if (user.isLocked()) {
        logger.info(`Account locked: ${email}`);
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Check if account is active
      if (!user.isActive) {
        logger.info(`Account deactivated: ${email}`);
        throw new Error('Account is deactivated');
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      logger.info(`Password match for ${email}: ${isMatch ? 'Yes' : 'No'}`);
      
      if (!isMatch) {
        // Increment login attempts
        await user.incLoginAttempts();
        logger.info(`Failed login attempt for ${email}, attempts incremented`);
        throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
        logger.info(`Reset login attempts for ${email}`);
      }

      // Generate tokens
      const accessToken = this.generateToken(user._id);
      const refreshToken = this.generateRefreshToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, TOKEN_TYPES.REFRESH);
      
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = this.generateToken(user._id);

      return {
        accessToken,
        user: user.toJSON()
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed successfully for user: ${user.email}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await User.findById(userId)
        .populate('enrolledCourses', 'title thumbnail instructor')
        .populate('createdCourses', 'title thumbnail enrollmentCount');
      
      if (!user) {
        throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      return user.toJSON();
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Check if email is being updated and is unique
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
          throw new Error(MESSAGES.ERROR.DUPLICATE_EMAIL);
        }
      }

      // Check if username is being updated and is unique
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await User.findByUsername(updateData.username);
        if (existingUser) {
          throw new Error('Username already exists');
        }
      }

      // Update user
      Object.assign(user, updateData);
      await user.save();

      logger.info(`Profile updated successfully for user: ${user.email}`);

      return user.toJSON();
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  // Deactivate user account
  async deactivateAccount(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      user.isActive = false;
      await user.save();

      logger.info(`Account deactivated for user: ${user.email}`);

      return { message: 'Account deactivated successfully' };
    } catch (error) {
      logger.error('Deactivate account error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
