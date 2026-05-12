/*import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/me', protect, getMe);

export default router;*/

/*import express from 'express';
import { register, login, getUserById } from '../controllers/authController.js';

const router = express.Router();

// Register route
router.post('/signup', register);

// Login route
router.post('/login', login);

// Get user by ID route
router.get('/me/:userId', getUserById);

export default router;*/

const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.registerOrLogin);
router.get('/profile', auth, authController.getProfile);
router.post('/contacts', auth, authController.addContact);
router.get('/search', auth, authController.searchUsers);

module.exports = router;
