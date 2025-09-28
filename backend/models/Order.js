const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, waiting for payment
      'paid',             // Payment confirmed
      'confirmed',        // Seller confirmed the order
      'preparing',        // Seller is preparing the item
      'ready_for_pickup', // Item ready for pickup
      'shipped',          // Item shipped (if applicable)
      'out_for_delivery', // Out for delivery
      'delivered',        // Order delivered
      'completed',        // Order completed
      'cancelled',        // Order cancelled
      'refunded'          // Order refunded
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'wallet'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    gatewayTransactionId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    landmark: String
  },
  pickupAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    landmark: String,
    instructions: String
  },
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery', 'meetup'],
    default: 'pickup'
  },
  deliveryDetails: {
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: String,
    courierService: String,
    deliveryInstructions: String
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isSystemMessage: {
      type: Boolean,
      default: false
    }
  }],
  cancellationReason: String,
  refundReason: String,
  rating: {
    buyerRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      ratedAt: Date
    },
    sellerRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      ratedAt: Date
    }
  },
  metadata: {
    source: String, // 'web', 'mobile', 'api'
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add timeline entry when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      note: `Status changed to ${this.status}`,
      updatedBy: this.buyer
    });
  }
  next();
});

// Indexes for better performance
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'paymentDetails.transactionId': 1 });

// Virtual for order age
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    note: note || `Status updated to ${newStatus}`,
    updatedBy: updatedBy
  });
  return this.save();
};

// Method to add message
orderSchema.methods.addMessage = function(sender, message, isSystemMessage = false) {
  this.messages.push({
    sender,
    message,
    isSystemMessage
  });
  return this.save();
};

// Method to calculate refund amount
orderSchema.methods.calculateRefund = function() {
  if (this.status === 'delivered' || this.status === 'completed') {
    return this.totalAmount; // Full refund
  } else if (this.status === 'shipped') {
    return this.totalAmount * 0.8; // 80% refund
  } else {
    return this.totalAmount; // Full refund for other statuses
  }
};

module.exports = mongoose.model('Order', orderSchema);
