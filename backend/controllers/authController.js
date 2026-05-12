const User = require('../models/User');
const jwt = require('jsonwebtoken');

console.log('✅ Auth controller loaded');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret-key-for-development', { expiresIn: '30d' });
};

// Register/Login User
exports.registerOrLogin = async (req, res) => {
  try {
    console.log('🔐 Auth request received:', req.body);
    
    const { phone, name, email } = req.body;

    // Basic validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid Indian phone number (+91XXXXXXXXXX)'
      });
    }

    console.log('📞 Looking for user with phone:', phone);

    // Find existing user or create new one
    let user = await User.findOne({ phone });
    
    if (user) {
      console.log('✅ Existing user found:', user.name);
      // Update user info if provided
      if (name) user.name = name;
      if (email) user.email = email;
      await user.save();
    } else {
      console.log('👤 Creating new user for phone:', phone);
      // Create new user
      user = new User({
        phone,
        name: name || `User${phone.slice(-4)}`,
        email: email || null
      });
      await user.save();
      console.log('✅ New user created:', user.name);
    }

    const token = generateToken(user._id);

    console.log('🎉 Auth successful for user:', user.name);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Auth error details:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during authentication: ' + error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Add contact
exports.addContact = async (req, res) => {
  try {
    const { phone, name } = req.body;
    const currentUser = req.user;

    // Check if contact exists
    const contactUser = await User.findOne({ phone });
    if (!contactUser) {
      return res.status(404).json({
        success: false,
        error: 'User with this phone number not found'
      });
    }

    // Check if already in contacts
    const existingContact = currentUser.contacts.find(
      contact => contact.user.toString() === contactUser._id.toString()
    );

    if (existingContact) {
      return res.status(400).json({
        success: false,
        error: 'Contact already exists'
      });
    }

    // Add to contacts
    currentUser.contacts.push({
      user: contactUser._id,
      name: name || contactUser.name,
      phone: contactUser.phone
    });

    await currentUser.save();

    res.json({
      success: true,
      message: 'Contact added successfully',
      contact: {
        id: contactUser._id,
        name: name || contactUser.name,
        phone: contactUser.phone
      }
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Search users by phone
exports.searchUsers = async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const users = await User.find({
      phone: { $regex: phone, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('name phone');

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};