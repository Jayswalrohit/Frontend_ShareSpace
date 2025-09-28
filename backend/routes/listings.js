const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/listings/');
  },
  filename: function (req, file, cb) {
    cb(null, 'listing-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  }
});

// @desc    Get all listings with search and filters
// @route   GET /api/listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const category = req.query.category;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const condition = req.query.condition;
    const location = req.query.location;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = { status: 'active' };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (condition) {
      query.condition = condition;
    }

    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    // Build sort object
    let sortObj = {};
    if (sortBy === 'price') {
      sortObj.price = sortOrder;
    } else if (sortBy === 'views') {
      sortObj.views = sortOrder;
    } else {
      sortObj.createdAt = sortOrder;
    }

    const listings = await Listing.find(query)
      .populate('seller', 'name avatar address')
      .sort(sortObj)
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

// @desc    Get featured listings
// @route   GET /api/listings/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const listings = await Listing.find({
      status: 'active',
      featured: true
    })
      .populate('seller', 'name avatar address')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', '_id name avatar phone email createdAt address');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Increment views
    listing.views += 1;
    await listing.save();

    res.json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Create new listing
// @route   POST /api/listings
// @access  Private
router.post('/', protect, upload.array('images', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      location,
      tags,
      specifications,
      shipping,
      negotiable,
      urgentSale
    } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/listings/${file.filename}`,
      alt: title
    })) : [];

    const listing = new Listing({
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      images,
      seller: req.user.id,
      location: location ? JSON.parse(location) : {},
      tags: tags ? JSON.parse(tags) : [],
      specifications: specifications ? JSON.parse(specifications) : {},
      shipping: shipping ? JSON.parse(shipping) : {},
      negotiable: negotiable === 'true',
      urgentSale: urgentSale === 'true'
    });

    const savedListing = await listing.save();
    await savedListing.populate('seller', 'name avatar');

    res.status(201).json(savedListing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private
router.put('/:id', protect, upload.array('images', 10), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check ownership
    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    // Update fields
    const updateFields = [
      'title', 'description', 'price', 'category', 'condition',
      'negotiable', 'urgentSale', 'status'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'price') {
          listing[field] = parseFloat(req.body[field]);
        } else if (field === 'negotiable' || field === 'urgentSale') {
          listing[field] = req.body[field] === 'true';
        } else {
          listing[field] = req.body[field];
        }
      }
    });

    // Handle nested objects
    if (req.body.location) {
      listing.location = { ...listing.location, ...JSON.parse(req.body.location) };
    }
    if (req.body.tags) {
      listing.tags = JSON.parse(req.body.tags);
    }
    if (req.body.specifications) {
      listing.specifications = { ...listing.specifications, ...JSON.parse(req.body.specifications) };
    }
    if (req.body.shipping) {
      listing.shipping = { ...listing.shipping, ...JSON.parse(req.body.shipping) };
    }

    // Handle image removal
    if (req.body.removeImages) {
      const imagesToRemove = JSON.parse(req.body.removeImages);
      for (const imageUrl of imagesToRemove) {
        // Remove from listing images array
        listing.images = listing.images.filter(img => img.url !== imageUrl);

        // Delete the actual file
        const filename = path.basename(imageUrl);
        const filePath = path.join(__dirname, '..', 'uploads', 'listings', filename);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.warn('Failed to delete image file:', err);
        }
      }
    }

    // Process new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/listings/${file.filename}`,
        alt: listing.title
      }));
      listing.images = [...listing.images, ...newImages];
    }

    await listing.save();
    await listing.populate('seller', 'name avatar');

    res.json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check ownership
    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    // Delete image files
    for (const img of listing.images) {
      const filename = path.basename(img.url);
      const filePath = path.join(__dirname, '..', 'uploads', 'listings', filename);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('Failed to delete image file:', err);
      }
    }

    await listing.deleteOne();

    res.json({ message: 'Listing removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Toggle favorite listing
// @route   POST /api/listings/:id/favorite
// @access  Private
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const userId = req.user.id;
    const favoriteIndex = listing.favorites.findIndex(
      fav => fav.user.toString() === userId
    );

    if (favoriteIndex > -1) {
      // Remove from favorites
      listing.favorites.splice(favoriteIndex, 1);
    } else {
      // Add to favorites
      listing.favorites.push({ user: userId });
    }

    await listing.save();

    res.json({
      message: favoriteIndex > -1 ? 'Removed from favorites' : 'Added to favorites',
      isFavorited: favoriteIndex === -1,
      favoriteCount: listing.favorites.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get suggested listings
// @route   GET /api/listings/suggestions/:id
// @access  Public
router.get('/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // Get the current listing
    const currentListing = await Listing.findById(id);
    if (!currentListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get suggestions based on category and price range
    const suggestions = await Listing.find({
      _id: { $ne: id },
      status: 'active',
      category: currentListing.category,
      price: {
        $gte: currentListing.price * 0.5,
        $lte: currentListing.price * 2
      }
    })
      .populate('seller', 'name avatar address')
      .sort({ views: -1, createdAt: -1 })
      .limit(limit);

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get listing categories
// @route   GET /api/listings/categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      'Electronics',
      'Fashion',
      'Home & Garden',
      'Sports & Outdoors',
      'Automotive',
      'Books & Media',
      'Health & Beauty',
      'Toys & Games',
      'Other'
    ];

    // Get category counts
    const categoryCounts = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryData = categories.map(cat => ({
      name: cat,
      count: categoryCounts.find(c => c._id === cat)?.count || 0
    }));

    res.json(categoryData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;