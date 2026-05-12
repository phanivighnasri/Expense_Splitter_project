/*import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';

// @desc    Calculate settlements for a group
// @route   POST /api/settlements/calculate
// @access  Private
export const calculateSettlements = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    // Check if user is member of the group

    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId
    }).populate('members.user', 'name email phone');

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this group'
      });
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ group: groupId });

    // Initialize balances for all members
    const balances = {};
    group.members.forEach(member => {
      balances[member.user._id] = {
        amount: 0,
        name: member.user.name,
        email: member.user.email,
        phone: member.user.phone
      };
    });

    // Calculate balances from expenses
    expenses.forEach(expense => {
      // Add amounts for people who paid
      expense.paidBy.forEach(payer => {
        if (balances[payer.user]) {
          balances[payer.user].amount += payer.amount;
        }
      });

      // Subtract amounts for people who owe
      expense.splitAmong.forEach(split => {
        if (balances[split.user]) {
          balances[split.user].amount -= split.amount;
        }
      });
    });

    // Separate debtors and creditors
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([userId, balance]) => {
      const netAmount = Math.round(balance.amount * 100) / 100;
      
      if (netAmount < -0.01) {
        // Owe money
        debtors.push({
          userId,
          amount: Math.abs(netAmount),
          name: balance.name,
          email: balance.email,
          phone: balance.phone
        });
      } else if (netAmount > 0.01) {
        // Are owed money
        creditors.push({
          userId,
          amount: netAmount,
          name: balance.name,
          email: balance.email,
          phone: balance.phone
        });
      }
    });

    // Sort by amount (highest first)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Generate minimal settlements
    const settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const settleAmount = Math.min(debtor.amount, creditor.amount);
      
      if (settleAmount > 0.01) {
        // Create settlement
        const settlement = await Settlement.create({
          group: groupId,
          fromUser: debtor.userId,
          toUser: creditor.userId,
          amount: Math.round(settleAmount * 100) / 100,
          status: 'pending',
          initiatedBy: userId
        });

        // Populate settlement
        const populatedSettlement = await Settlement.findById(settlement._id)
          .populate('fromUser', 'name email phone')
          .populate('toUser', 'name email phone');

        settlements.push(populatedSettlement);

        // Update amounts
        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;
      }

      // Move to next debtor/creditor if current one is settled
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    res.json({
      success: true,
      settlements,
      message: `Generated ${settlements.length} settlement transactions`
    });

  } catch (error) {
    console.error('Calculate settlements error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to calculate settlements'
    });
  }
};

// @desc    Get settlements for a group
// @route   GET /api/settlements/group/:groupId
// @access  Private
export const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check group access
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

    const settlements = await Settlement.find({ group: groupId })
      .populate('fromUser', 'name email phone')
      .populate('toUser', 'name email phone')
      .populate('initiatedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      settlements,
      count: settlements.length
    });

  } catch (error) {
    console.error('Get group settlements error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch settlements'
    });
  }
};

// @desc    Update settlement status
// @route   PATCH /api/settlements/:settlementId
// @access  Private
export const updateSettlementStatus = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const { status, paymentProof } = req.body;
    const userId = req.user.id;

    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        error: 'Settlement not found'
      });
    }

    // Check if user is involved in this settlement
    const isFromUser = settlement.fromUser.toString() === userId;
    const isToUser = settlement.toUser.toString() === userId;
    
    if (!isFromUser && !isToUser) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this settlement'
      });
    }

    // Update settlement
    settlement.status = status;
    if (paymentProof) {
      settlement.paymentProof = paymentProof;
    }

    await settlement.save();

    const updatedSettlement = await Settlement.findById(settlementId)
      .populate('fromUser', 'name email phone')
      .populate('toUser', 'name email phone');

    res.json({
      success: true,
      settlement: updatedSettlement,
      message: 'Settlement updated successfully'
    });

  } catch (error) {
    console.error('Update settlement error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settlement ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update settlement'
    });
  }
};*/
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const Expense = require('../models/Expense');

// @desc    Calculate settlements for a group
// @route   POST /api/settlements/calculate
// @access  Private
exports.calculateSettlements = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    // Check if user is member of the group
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId
    }).populate('members.user', 'name email phone');

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this group'
      });
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ group: groupId });

    // Initialize balances for all members
    const balances = {};
    group.members.forEach(member => {
      balances[member.user._id] = {
        amount: 0,
        name: member.user.name,
        email: member.user.email,
        phone: member.user.phone
      };
    });

    // Calculate balances from expenses
    expenses.forEach(expense => {
      // Add amounts for people who paid
      expense.paidBy.forEach(payer => {
        if (balances[payer.user]) {
          balances[payer.user].amount += payer.amount;
        }
      });

      // Subtract amounts for people who owe
      expense.splitDetails.forEach(split => {
        if (balances[split.user]) {
          balances[split.user].amount -= split.amount;
        }
      });
    });

    // Separate debtors and creditors
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([userId, balance]) => {
      const netAmount = Math.round(balance.amount * 100) / 100;
      
      if (netAmount < -0.01) {
        // Owe money
        debtors.push({
          userId,
          amount: Math.abs(netAmount),
          name: balance.name,
          email: balance.email,
          phone: balance.phone
        });
      } else if (netAmount > 0.01) {
        // Are owed money
        creditors.push({
          userId,
          amount: netAmount,
          name: balance.name,
          email: balance.email,
          phone: balance.phone
        });
      }
    });

    // Sort by amount (highest first)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Generate minimal settlements
    const settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const settleAmount = Math.min(debtor.amount, creditor.amount);
      
      if (settleAmount > 0.01) {
        // Create settlement
        const settlement = await Settlement.create({
          group: groupId,
          fromUser: debtor.userId,
          toUser: creditor.userId,
          amount: Math.round(settleAmount * 100) / 100,
          status: 'pending',
          initiatedBy: userId
        });

        // Populate settlement
        const populatedSettlement = await Settlement.findById(settlement._id)
          .populate('fromUser', 'name email phone')
          .populate('toUser', 'name email phone');

        settlements.push(populatedSettlement);

        // Update amounts
        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;
      }

      // Move to next debtor/creditor if current one is settled
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    res.json({
      success: true,
      settlements,
      message: `Generated ${settlements.length} settlement transactions`
    });

  } catch (error) {
    console.error('Calculate settlements error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to calculate settlements'
    });
  }
};

// @desc    Get settlements for a group
// @route   GET /api/settlements/group/:groupId
// @access  Private
exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check group access
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

    const settlements = await Settlement.find({ group: groupId })
      .populate('fromUser', 'name email phone')
      .populate('toUser', 'name email phone')
      .populate('initiatedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      settlements,
      count: settlements.length
    });

  } catch (error) {
    console.error('Get group settlements error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch settlements'
    });
  }
};

// @desc    Update settlement status
// @route   PATCH /api/settlements/:settlementId
// @access  Private
exports.updateSettlementStatus = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const { status, paymentProof } = req.body;
    const userId = req.user.id;

    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        error: 'Settlement not found'
      });
    }

    // Check if user is involved in this settlement
    const isFromUser = settlement.fromUser.toString() === userId;
    const isToUser = settlement.toUser.toString() === userId;
    
    if (!isFromUser && !isToUser) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this settlement'
      });
    }

    // Update settlement
    settlement.status = status;
    if (paymentProof) {
      settlement.paymentProof = paymentProof;
    }

    await settlement.save();

    const updatedSettlement = await Settlement.findById(settlementId)
      .populate('fromUser', 'name email phone')
      .populate('toUser', 'name email phone');

    res.json({
      success: true,
      settlement: updatedSettlement,
      message: 'Settlement updated successfully'
    });

  } catch (error) {
    console.error('Update settlement error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settlement ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update settlement'
    });
  }
};