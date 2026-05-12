/*import express from 'express';
import { createExpense,getGroupExpenses,deleteExpense,getExpenseAnalytics } from '../controllers/expenseController.js';
//import { protect } from '../middleware/auth.js';
import auth from '../middleware/auth.js'
const router = express.Router();

//router.use(protect);
router.post('/',auth,createExpense);
router.get('/group/:groupId',auth,getGroupExpenses);
router.delete('/:expenseId', auth, deleteExpense);
router.get('/analytics/:groupId', auth, getExpenseAnalytics);
//router.post('/', addExpense);
//router.get('/group/:groupId', getGroupExpenses);

export default router;*/
const express = require('express');
const { 
  createExpense, 
  getGroupExpenses, 
  deleteExpense, 
  getExpenseAnalytics 
} = require('../controllers/expenseController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, createExpense);
router.get('/group/:groupId', auth, getGroupExpenses);
router.delete('/:expenseId', auth, deleteExpense);
router.get('/analytics/:groupId', auth, getExpenseAnalytics);

module.exports = router;