const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  paidBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentMode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online'
    }
  }],
  splitType: {
    type: String,
    enum: ['equal', 'unequal', 'percentage'],
    required: true
  },
  splitDetails: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expenseDate: {
    type: Date,
    default: Date.now
  },
  receiptImage: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
expenseSchema.index({ group: 1, createdAt: -1 });
expenseSchema.index({ 'paidBy.user': 1 });
expenseSchema.index({ 'splitDetails.user': 1 });
expenseSchema.index({ expenseDate: -1 });

// Virtual for total paid amount validation
expenseSchema.virtual('totalPaid').get(function() {
  return this.paidBy.reduce((sum, payer) => sum + payer.amount, 0);
});

expenseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);