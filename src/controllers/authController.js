const { authService } = require('../services');
const { HTTP_STATUS, MESSAGES } = require('../constants');
const { successResponse, errorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware');
const logger = require('../utils/logger');

class AuthController {
  // Register new user
  register = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    const result = await authService.register({ username, email, password, role });

    return successResponse(
      res,
      MESSAGES.SUCCESS.USER_CREATED,
      result,
      HTTP_STATUS.CREATED
    );
  });

  // Login user
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await authService.login(email, password);
      
      return successResponse(
        res,
        MESSAGES.SUCCESS.LOGIN_SUCCESS,
        result
      );
    } catch (error) {
      // Handle specific error messages with appropriate status codes
      if (error.message.includes('Invalid credentials')) {
        return errorResponse(res, error.message, HTTP_STATUS.UNAUTHORIZED);
      } else if (error.message.includes('locked')) {
        return errorResponse(res, error.message, HTTP_STATUS.TOO_MANY_REQUESTS);
      } else if (error.message.includes('deactivated')) {
        return errorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
      }
      
      // For any other errors, re-throw to be caught by the global error handler
      throw error;
    }
  });

  // Refresh token
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await authService.refreshToken(refreshToken);

    return successResponse(
      res,
      'Token refreshed successfully',
      result
    );
  });

  // Get current user profile
  getProfile = asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user._id);

    return successResponse(
      res,
      'Profile retrieved successfully',
      profile
    );
  });

  // Update user profile
  updateProfile = asyncHandler(async (req, res) => {
    const updateData = req.body;

    const updatedProfile = await authService.updateProfile(req.user._id, updateData);

    return successResponse(
      res,
      MESSAGES.SUCCESS.USER_UPDATED,
      updatedProfile
    );
  });

  // Change password
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    return successResponse(
      res,
      'Password changed successfully',
      result
    );
  });

  // Logout user
  logout = asyncHandler(async (req, res) => {
    // In a real-world scenario, you might want to blacklist the token
    // For now, we'll just return a success response
    
    logger.info(`User logged out: ${req.user.email}`);

    return successResponse(
      res,
      MESSAGES.SUCCESS.LOGOUT_SUCCESS,
      null
    );
  });

  // Deactivate account
  deactivateAccount = asyncHandler(async (req, res) => {
    const result = await authService.deactivateAccount(req.user._id);

    return successResponse(
      res,
      'Account deactivated successfully',
      result
    );
  });
}

module.exports = new AuthController();
