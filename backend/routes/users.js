const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    cb(null, 'avatar-' + req.user.id + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const stats = await user.getStats();
    
    res.json({
      user,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Search users by name
// @route   GET /api/users/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a search name' });
    }

    const searchQuery = name.trim();
    const users = await User.find({
      name: { $regex: searchQuery, $options: 'i' }
    })
    .select('name avatar _id')  // Limited fields for privacy
    .limit(10)
    .sort({ name: 1 });

    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get user's listings
// @route   GET /api/users/listings
// @access  Private
router.get('/listings', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { seller: req.user.id };
    if (status) query.status = status;

    const listings = await Listing.find(query)
      .populate('seller', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get user's favorite listings
// @route   GET /api/users/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const listings = await Listing.find({
      'favorites.user': req.user.id
    })
      .populate('seller', 'name avatar')
      .sort({ 'favorites.addedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Listing.countDocuments({
      'favorites.user': req.user.id
    });

    res.json({
      listings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Get user stats
    const user = await User.findById(userId);
    const userStats = await user.getStats();

    // Get listing stats
    const totalListings = await Listing.countDocuments({ seller: userId });
    const activeListings = await Listing.countDocuments({ seller: userId, status: 'active' });
    const soldListings = await Listing.countDocuments({ seller: userId, status: 'sold' });
    const recentListings = await Listing.countDocuments({
      seller: userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get total views for user's listings
    const viewsResult = await Listing.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

    // Get recent activity (recent listings)
    const recentActivity = await Listing.find({ seller: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title price status createdAt views');

    // Get monthly earnings (if you track sales)
    const monthlyStats = await Listing.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(userId),
          status: 'sold',
          updatedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      stats: {
        totalListings,
        activeListings,
        soldListings,
        recentListings,
        totalViews,
        memberSince: user.createdAt
      },
      recentActivity,
      monthlyStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Delete user by email (admin/dev only)
// @route   DELETE /api/users/delete-by-email
// @access  Public (should be protected in production)
router.delete('/delete-by-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOneAndDelete({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted', email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
