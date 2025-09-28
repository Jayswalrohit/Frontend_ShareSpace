const express = require('express');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Report = require('../models/Report');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(admin);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: 'active' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Recent activity
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const recentListings = await Listing.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Monthly stats
    const monthlyUsers = await User.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const monthlyListings = await Listing.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Category distribution
    const categoryStats = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top users by listings
    const topUsers = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$seller', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          count: 1,
          'user.name': 1,
          'user.email': 1
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalListings,
        activeListings,
        pendingReports,
        recentUsers,
        recentListings
      },
      charts: {
        monthlyUsers,
        monthlyListings,
        categoryStats
      },
      topUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role;
    const status = req.query.status;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Add listing counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const listingCount = await Listing.countDocuments({ seller: user._id });
      return {
        ...user.toObject(),
        listingCount
      };
    }));

    res.json({
      users: usersWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get all listings with admin filters
// @route   GET /api/admin/listings
// @access  Private/Admin
router.get('/listings', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const category = req.query.category;

    // Build query
    let query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    const listings = await Listing.find(query)
      .populate('seller', 'name email')
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

// @desc    Update listing status or featured status
// @route   PUT /api/admin/listings/:id
// @access  Private/Admin
router.put('/listings/:id', async (req, res) => {
  try {
    const { status, featured } = req.body;
    
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (status !== undefined) {
      listing.status = status;
    }

    if (featured !== undefined) {
      listing.featured = featured;
    }

    await listing.save();

    res.json({
      message: 'Listing updated successfully',
      listing
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Delete listing
// @route   DELETE /api/admin/listings/:id
// @access  Private/Admin
router.delete('/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await listing.deleteOne();

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
router.get('/reports', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let query = {};
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
router.put('/reports/:id', async (req, res) => {
  try {
    const { status, adminNotes, action } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = status;
    report.adminNotes = adminNotes;
    report.action = action;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await report.save();

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;