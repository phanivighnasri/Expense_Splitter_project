const Group = require('../models/Group');
const User = require('../models/User');

// Create new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, memberPhones } = req.body;
    const createdBy = req.user._id;

    // Validate input
    if (!name || !memberPhones || !Array.isArray(memberPhones)) {
      return res.status(400).json({
        success: false,
        error: 'Group name and members are required'
      });
    }

    // Find all member users by phone numbers
    const memberUsers = await User.find({
      phone: { $in: memberPhones }
    });

    if (memberUsers.length !== memberPhones.length) {
      return res.status(400).json({
        success: false,
        error: 'Some users not found. Please check phone numbers.'
      });
    }

    // Prepare members array including creator
    const members = [
      {
        user: createdBy,
        name: req.user.name,
        phone: req.user.phone
      },
      ...memberUsers.map(user => ({
        user: user._id,
        name: user.name,
        phone: user.phone
      }))
    ];

    // Remove duplicates
    const uniqueMembers = members.filter((member, index, self) =>
      index === self.findIndex(m => m.user.toString() === member.user.toString())
    );

    // Create group
    const group = new Group({
      name,
      description,
      members: uniqueMembers,
      createdBy
    });

    await group.save();

    // Populate the created group
    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name phone')
      .populate('createdBy', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating group'
    });
  }
};

// Get all groups for user
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'name phone')
    .populate('createdBy', 'name phone')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get single group details
exports.getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'name phone')
    .populate('createdBy', 'name phone');

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    res.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { phone } = req.body;
    const userId = req.user._id;

    // Check if user has permission (only creator can add members)
    const group = await Group.findOne({
      _id: groupId,
      createdBy: userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'Only group creator can add members'
      });
    }

    // Find user to add
    const userToAdd = await User.findOne({ phone });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already a member
    const isAlreadyMember = group.members.some(
      member => member.user.toString() === userToAdd._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this group'
      });
    }

    // Add member
    group.members.push({
      user: userToAdd._id,
      name: userToAdd.name,
      phone: userToAdd.phone
    });

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', 'name phone')
      .populate('createdBy', 'name phone');

    res.json({
      success: true,
      message: 'Member added successfully',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      createdBy: userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        error: 'Only group creator can remove members'
      });
    }

    // Cannot remove creator
    if (memberId === userId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove group creator'
      });
    }

    group.members = group.members.filter(
      member => member.user.toString() !== memberId
    );

    await group.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};