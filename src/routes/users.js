const express = require('express');
const { userController } = require('../controllers');
const { auth, isAdmin } = require('../middleware');
const { validate, userSchemas, commonSchemas } = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Public user routes
router.get('/instructors',
  validate(commonSchemas.pagination, 'query'),
  userController.getInstructors
);

router.get('/:id',
  validate(commonSchemas.mongoId, 'params'),
  userController.getUserById
);

// Admin only routes
router.get('/',
  isAdmin,
  validate(commonSchemas.pagination, 'query'),
  userController.getAllUsers
);

router.put('/:id',
  isAdmin,
  validate(commonSchemas.mongoId, 'params'),
  validate(userSchemas.updateProfile),
  userController.updateUser
);

router.delete('/:id',
  isAdmin,
  validate(commonSchemas.mongoId, 'params'),
  userController.deleteUser
);

router.get('/stats/overview',
  isAdmin,
  userController.getUserStats
);

router.put('/:id/toggle-status',
  isAdmin,
  validate(commonSchemas.mongoId, 'params'),
  userController.toggleUserStatus
);

module.exports = router;
