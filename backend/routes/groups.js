/*import express from 'express';
import { 
  createGroup, 
  getUserGroups, 
  getGroupDetails, 
  addMemberToGroup 
} from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createGroup);
router.get('/', getUserGroups);
router.get('/:groupId', getGroupDetails);
router.post('/:groupId/members', addMemberToGroup);

export default router;*/

/*
import express from 'express';
import Group from '../models/Group.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create a new group
router.post('/', auth, async (req, res) => {
  try {
    const { name, members } = req.body;

    const group = new Group({
      name,
      createdBy: req.userId,
      members: [
        {
          userId: req.userId,
          name: req.userName,
          phone: req.userPhone || '+919898989898'
        },
        ...members
      ]
    });

    await group.save();
    
    // Populate the group data
    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email')
      .populate('members.userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating group'
    });
  }
});

// Get groups for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      'members.userId': req.params.userId
    })
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email phone')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      groups
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching groups'
    });
  }
});

export default router;
*/
const express = require('express');
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, groupController.createGroup);
router.get('/', auth, groupController.getUserGroups);
router.get('/:groupId', auth, groupController.getGroup);
router.post('/:groupId/members', auth, groupController.addMember);
router.delete('/:groupId/members/:memberId', auth, groupController.removeMember);

module.exports = router;
