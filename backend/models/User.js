/*const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+91[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  email: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String
  },
  contacts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    phone: String
  }],
  fcmToken: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);*/

/*import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  upiId: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: '+919876543210'
  },
  faceRegistered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
*/
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+91[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  email: {
    type: String,
    sparse: true
  },
  contacts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    phone: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);