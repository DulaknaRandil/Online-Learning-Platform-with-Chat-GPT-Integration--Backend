const express = require('express');
const { authController } = require('../controllers');
const { auth, authLimiter } = require('../middleware');
const { validate, userSchemas } = require('../validators');

const router = express.Router();

// Public routes
router.post('/register', 
  authLimiter,
  validate(userSchemas.register),
  authController.register
);

router.post('/login',
  authLimiter,
  validate(userSchemas.login),
  authController.login
);

router.post('/refresh-token',
  authController.refreshToken
);

// Protected routes
router.use(auth);

router.get('/profile',
  authController.getProfile
);

router.put('/profile',
  validate(userSchemas.updateProfile),
  authController.updateProfile
);

router.put('/change-password',
  validate(userSchemas.changePassword),
  authController.changePassword
);

router.post('/logout',
  authController.logout
);

router.delete('/deactivate',
  authController.deactivateAccount
);

module.exports = router;
