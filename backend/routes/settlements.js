/*import express from 'express';
import { 
  calculateSettlements, 
  getGroupSettlements, 
  updateSettlementStatus 
} from '../controllers/settlementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/calculate', calculateSettlements);
router.get('/group/:groupId', getGroupSettlements);
router.patch('/:settlementId', updateSettlementStatus);

export default router;*/

const express = require('express');
const settlementController = require('../controllers/settlementController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/calculate/:groupId', auth, settlementController.calculateSettlements);
router.get('/group/:groupId', auth, settlementController.getGroupSettlements);
router.put('/:settlementId', auth, settlementController.updateSettlementStatus);

module.exports = router;