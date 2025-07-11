const { User } = require('../models');
const { HTTP_STATUS, MESSAGES, USER_ROLES } = require('../constants');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware');

class UserController {
  // Get all users (admin only)
  getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', role, search } = req.query;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const query = { isActive: true };
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return paginatedResponse(
      res,
      'Users retrieved successfully',
      users,
      pagination
    );
  });

  // Get user by ID
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('enrolledCourses', 'title thumbnail')
      .populate('createdCourses', 'title thumbnail enrollmentCount')
      .select('-password');

    if (!user) {
      return errorResponse(res, MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(
      res,
      'User retrieved successfully',
      user
    );
  });

  // Update user (admin only)
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if email is being updated and is unique
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        return errorResponse(res, MESSAGES.ERROR.DUPLICATE_EMAIL, HTTP_STATUS.CONFLICT);
      }
    }

    // Check if username is being updated and is unique
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ username: updateData.username });
      if (existingUser) {
        return errorResponse(res, 'Username already exists', HTTP_STATUS.CONFLICT);
      }
    }

    Object.assign(user, updateData);
    await user.save();

    return successResponse(
      res,
      MESSAGES.SUCCESS.USER_UPDATED,
      user.toJSON()
    );
  });

  // Delete user (admin only)
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    return successResponse(
      res,
      MESSAGES.SUCCESS.USER_DELETED,
      null
    );
  });

  // Get user statistics
  getUserStats = asyncHandler(async (req, res) => {
    const stats = await this.getUserStatsData();

    return successResponse(
      res,
      'User statistics retrieved successfully',
      stats
    );
  });
  
  // Helper method to get user stats data (for reuse in admin dashboard)
  getUserStatsData = async () => {
    const totalUsers = await User.countDocuments({ isActive: true });
    const studentCount = await User.countDocuments({ role: USER_ROLES.STUDENT, isActive: true });
    const instructorCount = await User.countDocuments({ role: USER_ROLES.INSTRUCTOR, isActive: true });
    const adminCount = await User.countDocuments({ role: USER_ROLES.ADMIN, isActive: true });

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isActive: true
    });

    return {
      totalUsers,
      studentCount,
      instructorCount,
      adminCount,
      recentRegistrations,
      activeUsers: totalUsers,
      inactiveUsers: await User.countDocuments({ isActive: false })
    };
  };

  // Toggle user status (admin only)
  toggleUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    user.isActive = !user.isActive;
    await user.save();

    const message = user.isActive ? 'User activated successfully' : 'User deactivated successfully';

    return successResponse(
      res,
      message,
      user.toJSON()
    );
  });

  // Get instructors
  getInstructors = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const skip = (page - 1) * limit;
    const query = { role: USER_ROLES.INSTRUCTOR, isActive: true };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } }
      ];
    }

    const instructors = await User.find(query)
      .populate('createdCourses', 'title enrollmentCount rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return paginatedResponse(
      res,
      'Instructors retrieved successfully',
      instructors,
      pagination
    );
  });
}

module.exports = new UserController();
