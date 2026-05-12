const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromName: {
    type: String,
    required: true
  },
  fromPhone: {
    type: String,
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toName: {
    type: String,
    required: true
  },
  toPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  proof: {
    cashfreeOrderId: String,
    transactionId: String,
    timestamp: Date
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
settlementSchema.index({ group: 1, status: 1 });
settlementSchema.index({ fromUser: 1, status: 1 });
settlementSchema.index({ toUser: 1, status: 1 });
settlementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);