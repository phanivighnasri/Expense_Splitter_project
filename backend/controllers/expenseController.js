/*import Expense from '../models/Expense.js';
import Group from '../models/Group.js';

// @desc    Add expense to group
// @route   POST /api/expenses
// @access  Private
export const addExpense = async (req, res) => {
  try {
    const {
      groupId,
      description,
      amount,
      category,
      paidBy,
      splitType,
      splitAmong
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!groupId || !description || !amount || !category || !paidBy || !splitAmong) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: groupId, description, amount, category, paidBy, splitAmong'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Check if user is member of the group
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this group'
      });
    }

    // Validate paidBy amounts
    const totalPaid = paidBy.reduce((sum, payer) => sum + parseFloat(payer.amount), 0);
    if (Math.abs(totalPaid - amountNum) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Total paid amount (${totalPaid}) must equal expense amount (${amountNum})`
      });
    }

    // Validate splitAmong amounts
    const totalSplit = splitAmong.reduce((sum, split) => sum + parseFloat(split.amount), 0);
    if (Math.abs(totalSplit - amountNum) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Total split amount (${totalSplit}) must equal expense amount (${amountNum})`
      });
    }

    // Create expense
    const expense = await Expense.create({
      description: description.trim(),
      amount: amountNum,
      category: category.trim(),
      group: groupId,
      paidBy: paidBy.map(payer => ({
        user: payer.userId,
        amount: parseFloat(payer.amount),
        paymentMode: payer.paymentMode || 'online'
      })),
      splitAmong: splitAmong.map(split => ({
        user: split.userId,
        amount: parseFloat(split.amount)
      })),
      splitType: splitType || 'equal',
      addedBy: userId
    });

    // Populate and return the expense
    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy.user', 'name email phone')
      .populate('splitAmong.user', 'name email phone')
      .populate('addedBy', 'name email phone')
      .populate('group', 'name');

    res.status(201).json({
      success: true,
      expense: populatedExpense,
      message: 'Expense added successfully'
    });

  } catch (error) {
    console.error('Add expense error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID in paidBy or splitAmong'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add expense'
    });
  }
};

// @desc    Get all expenses for a group
// @route   GET /api/expenses/group/:groupId
// @access  Private
export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is member of the group
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this group'
      });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy.user', 'name email phone')
      .populate('splitAmong.user', 'name email phone')
      .populate('addedBy', 'name email phone')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      expenses,
      count: expenses.length
    });

  } catch (error) {
    console.error('Get group expenses error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses'
    });
  }
};*/


const Expense = require('../models/Expense');
const Group = require('../models/Group');

// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const {
      groupId,
      category,
      description,
      amount,
      paidBy,
      splitType,
      splitDetails,
      expenseDate
    } = req.body;

    const addedBy = req.user._id;

    // Validate group membership
    const group = await Group.findOne({
      _id: groupId,
      'members.user': addedBy,
      isActive: true
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this group or group not found'
      });
    }

    // Validate paidBy amounts
    const totalPaid = paidBy.reduce((sum, payer) => sum + payer.amount, 0);
    if (Math.abs(totalPaid - amount) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Total paid amount (₹${totalPaid}) must equal expense amount (₹${amount})`
      });
    }

    // Validate split details based on type
    let validatedSplitDetails = [];
    
    if (splitType === 'equal') {
      const perPerson = amount / splitDetails.length;
      validatedSplitDetails = splitDetails.map(detail => ({
        user: detail.userId,
        name: detail.name,
        amount: perPerson
      }));
    } else if (splitType === 'unequal') {
      const totalSplit = splitDetails.reduce((sum, detail) => sum + detail.amount, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `Split amounts must equal total amount. Current: ₹${totalSplit}, Expected: ₹${amount}`
        });
      }
      validatedSplitDetails = splitDetails.map(detail => ({
        user: detail.userId,
        name: detail.name,
        amount: detail.amount
      }));
    } else if (splitType === 'percentage') {
      const totalPercent = splitDetails.reduce((sum, detail) => sum + detail.percentage, 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `Percentages must add up to 100%. Current: ${totalPercent}%`
        });
      }
      validatedSplitDetails = splitDetails.map(detail => ({
        user: detail.userId,
        name: detail.name,
        amount: (amount * detail.percentage) / 100,
        percentage: detail.percentage
      }));
    }

    // Create expense
    const expense = new Expense({
      group: groupId,
      category,
      description,
      amount,
      paidBy: paidBy.map(payer => ({
        user: payer.userId,
        name: payer.name,
        amount: payer.amount,
        paymentMode: payer.paymentMode || 'online'
      })),
      splitType,
      splitDetails: validatedSplitDetails,
      addedBy,
      expenseDate: expenseDate || new Date()
    });

    await expense.save();

    // Populate and return
    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy.user', 'name phone')
      .populate('splitDetails.user', 'name phone')
      .populate('addedBy', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: populatedExpense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating expense'
    });
  }
};

// Get expenses for group
exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Verify group membership
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this group'
      });
    }

    const expenses = await Expense.find({ group: groupId, isActive: true })
      .populate('paidBy.user', 'name phone')
      .populate('splitDetails.user', 'name phone')
      .populate('addedBy', 'name phone')
      .sort({ expenseDate: -1, createdAt: -1 });

    res.json({
      success: true,
      expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user._id;

    const expense = await Expense.findOne({
      _id: expenseId,
      addedBy: userId
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found or you are not authorized to delete it'
      });
    }

    expense.isActive = false;
    await expense.save();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get expense analytics for group
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Verify group membership
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this group'
      });
    }

    const expenses = await Expense.find({ group: groupId, isActive: true });

    // Monthly spending
    const monthlyData = {};
    expenses.forEach(expense => {
      const date = new Date(expense.expenseDate);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          total: 0
        };
      }
      monthlyData[monthYear].total += expense.amount;
    });

    // Category spending
    const categoryData = {};
    expenses.forEach(expense => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = 0;
      }
      categoryData[expense.category] += expense.amount;
    });

    // Who paid the most
    const memberPayments = {};
    expenses.forEach(expense => {
      expense.paidBy.forEach(payer => {
        const userName = payer.name;
        if (!memberPayments[userName]) {
          memberPayments[userName] = 0;
        }
        memberPayments[userName] += payer.amount;
      });
    });

    res.json({
      success: true,
      analytics: {
        monthlySpending: Object.values(monthlyData).sort((a, b) => a.label.localeCompare(b.label)),
        categorySpending: Object.entries(categoryData)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
        topPayers: Object.entries(memberPayments)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount),
        totalGroupSpending: expenses.reduce((sum, e) => sum + e.amount, 0),
        expenseCount: expenses.length
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};