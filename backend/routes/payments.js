/*import express from 'express';
import { 
  createOrder, 
  verifyOrder, 
  paymentWebhook, 
  paymentCallback 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.post('/create-order', protect, createOrder);
router.get('/verify/:orderId', protect, verifyOrder);

// Public routes (for callbacks and webhooks)
router.post('/webhook', paymentWebhook);
router.get('/callback', paymentCallback);

export default router;*/

const express = require('express');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Payment routes
router.post('/create-order', auth, paymentController.createOrder);
router.get('/verify/:orderId', auth, paymentController.verifyOrder);
router.post('/webhook', paymentController.paymentWebhook);
router.get('/callback', paymentController.paymentCallback);
router.get('/methods', auth, paymentController.getPaymentMethods);

module.exports = router;