const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxLength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxLength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'Electronics',
      'Fashion',
      'Home & Garden',
      'Sports & Outdoors',
      'Automotive',
      'Books & Media',
      'Health & Beauty',
      'Toys & Games',
      'Other'
    ]
  },
  condition: {
    type: String,
    required: [true, 'Please specify the condition'],
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive', 'pending'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  specifications: {
    brand: String,
    model: String,
    year: Number,
    dimensions: String,
    weight: String,
    color: String,
    material: String
  },
  shipping: {
    available: {
      type: Boolean,
      default: false
    },
    cost: {
      type: Number,
      default: 0
    },
    estimatedDays: {
      type: Number,
      default: 0
    }
  },
  negotiable: {
    type: Boolean,
    default: true
  },
  urgentSale: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }
}, {
  timestamps: true
});

// Indexes for better search performance
listingSchema.index({ title: 'text', description: 'text', tags: 'text' });
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for favorite count
listingSchema.virtual('favoriteCount').get(function() {
  return this.favorites.length;
});

// Method to check if user has favorited this listing
listingSchema.methods.isFavoritedBy = function(userId) {
  return this.favorites.some(fav => fav.user.toString() === userId.toString());
};

module.exports = mongoose.model('Listing', listingSchema);