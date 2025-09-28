const express = require('express');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      listingId,
      quantity = 1,
      paymentMethod,
      shippingAddress,
      pickupAddress,
      deliveryMethod = 'pickup'
    } = req.body;

    // Validate payment method
    if (!paymentMethod || !['cash', 'upi', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Validate delivery method
    if (!['pickup', 'delivery'].includes(deliveryMethod)) {
      return res.status(400).json({ error: 'Invalid delivery method' });
    }

    // Get listing details
    const listing = await Listing.findById(listingId).populate('seller');
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'Listing is not available for purchase' });
    }

    if (listing.seller._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot purchase your own listing' });
    }

    // Calculate total amount
    const totalAmount = listing.price * quantity;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = new Order({
      orderNumber,
      buyer: req.user.id,
      seller: listing.seller._id,
      listing: listingId,
      quantity,
      price: listing.price,
      totalAmount,
      paymentMethod,
      shippingAddress: deliveryMethod === 'delivery' ? shippingAddress : undefined,
      pickupAddress: deliveryMethod === 'pickup' ? pickupAddress : undefined,
      deliveryMethod,
      timeline: [{
        status: 'pending',
        note: 'Order placed',
        updatedBy: req.user.id
      }]
    });

    await order.save();
    await order.populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'seller', select: 'name email phone' },
      { path: 'listing', select: 'title price images' }
    ]);

    // Add system message
    try {
      await order.addMessage(
        req.user.id,
        `Order placed for ${listing.title}`,
        true
      );
    } catch (messageError) {
      console.error('Error adding system message:', messageError);
      // Don't fail the order creation due to message error
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type = 'all' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = {};
    
    if (type === 'buying') {
      query.buyer = req.user.id;
    } else if (type === 'selling') {
      query.seller = req.user.id;
    } else {
      query.$or = [
        { buyer: req.user.id },
        { seller: req.user.id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('buyer', 'name email phone avatar')
      .populate('seller', 'name email phone avatar')
      .populate('listing', 'title price images category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone avatar address')
      .populate('seller', 'name email phone avatar address')
      .populate('listing', 'title price images category description')
      .populate('timeline.updatedBy', 'name')
      .populate('messages.sender', 'name avatar');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is buyer or seller
    if (order.buyer._id.toString() !== req.user.id && 
        order.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is seller or admin
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only seller can update order status' });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['paid', 'cancelled'],
      'paid': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready_for_pickup', 'shipped', 'cancelled'],
      'ready_for_pickup': ['delivered', 'cancelled'],
      'shipped': ['out_for_delivery', 'delivered'],
      'out_for_delivery': ['delivered'],
      'delivered': ['completed'],
      'cancelled': [],
      'completed': [],
      'refunded': []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    await order.updateStatus(status, note, req.user.id);

    // Add system message
    await order.addMessage(
      req.user.id,
      `Order status updated to ${status}`,
      true
    );

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is buyer or seller
    if (order.buyer.toString() !== req.user.id && 
        order.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'paid', 'confirmed', 'preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        error: `Order cannot be cancelled in ${order.status} status` 
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    await order.updateStatus('cancelled', `Order cancelled: ${reason}`, req.user.id);

    // Add system message
    await order.addMessage(
      req.user.id,
      `Order cancelled: ${reason}`,
      true
    );

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Add message to order
// @route   POST /api/orders/:id/message
// @access  Private
router.post('/:id/message', protect, async (req, res) => {
  try {
    const { message } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is buyer or seller
    if (order.buyer.toString() !== req.user.id && 
        order.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await order.addMessage(req.user.id, message);

    res.json({ message: 'Message added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, review, type } = req.body; // type: 'buyer' or 'seller'

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user can rate
    if (type === 'buyer' && order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can rate seller' });
    }
    
    if (type === 'seller' && order.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only seller can rate buyer' });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed orders' });
    }

    if (type === 'buyer') {
      order.rating.buyerRating = {
        rating,
        review,
        ratedAt: new Date()
      };
    } else {
      order.rating.sellerRating = {
        rating,
        review,
        ratedAt: new Date()
      };
    }

    await order.save();

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get order statistics
// @route   GET /api/orders/stats/overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const buyerStats = await Order.aggregate([
      { $match: { buyer: req.user.id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }}
    ]);

    const sellerStats = await Order.aggregate([
      { $match: { seller: req.user.id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }}
    ]);

    const totalEarnings = await Order.aggregate([
      { $match: { 
        seller: req.user.id, 
        status: { $in: ['completed', 'delivered'] }
      }},
      { $group: { _id: null, total: { $sum: '$totalAmount' }}}
    ]);

    res.json({
      buyer: buyerStats,
      seller: sellerStats,
      totalEarnings: totalEarnings[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Process payment
// @route   POST /api/orders/:id/payment
// @access  Private
router.post('/:id/payment', protect, async (req, res) => {
  try {
    const { paymentDetails } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    // Update payment details
    order.paymentStatus = 'paid';
    order.paymentDetails = {
      ...order.paymentDetails,
      ...paymentDetails,
      paidAt: new Date()
    };

    await order.updateStatus('paid', 'Payment confirmed', req.user.id);

    // Add system message
    await order.addMessage(
      req.user.id,
      'Payment confirmed',
      true
    );

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update delivery location (buyer only)
// @route   PUT /api/orders/:id/delivery-location
// @access  Private
router.put('/:id/delivery-location', protect, async (req, res) => {
  try {
    const { shippingAddress, pickupAddress } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is buyer
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can update delivery location' });
    }

    // Check if order can be updated
    const nonUpdatableStatuses = ['delivered', 'completed', 'cancelled'];
    if (nonUpdatableStatuses.includes(order.status)) {
      return res.status(400).json({
        error: `Cannot update delivery location for ${order.status} order`
      });
    }

    // Update addresses based on delivery method
    if (order.deliveryMethod === 'delivery' && shippingAddress) {
      order.shippingAddress = shippingAddress;
    } else if (order.deliveryMethod === 'pickup' && pickupAddress) {
      order.pickupAddress = pickupAddress;
    } else {
      return res.status(400).json({ error: 'Invalid delivery method or address data' });
    }

    await order.save();

    // Add system message
    await order.addMessage(
      req.user.id,
      'Delivery location updated',
      true
    );

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update delivery details (seller only)
// @route   PUT /api/orders/:id/delivery-details
// @access  Private
router.put('/:id/delivery-details', protect, async (req, res) => {
  try {
    const { estimatedDelivery, trackingNumber, courierService, deliveryInstructions } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is seller
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only seller can update delivery details' });
    }

    // Check if order can be updated
    const nonUpdatableStatuses = ['delivered', 'completed', 'cancelled'];
    if (nonUpdatableStatuses.includes(order.status)) {
      return res.status(400).json({
        error: `Cannot update delivery details for ${order.status} order`
      });
    }

    // Update delivery details
    if (!order.deliveryDetails) {
      order.deliveryDetails = {};
    }

    if (estimatedDelivery) {
      order.deliveryDetails.estimatedDelivery = new Date(estimatedDelivery);
    }
    if (trackingNumber) {
      order.deliveryDetails.trackingNumber = trackingNumber;
    }
    if (courierService) {
      order.deliveryDetails.courierService = courierService;
    }
    if (deliveryInstructions) {
      order.deliveryDetails.deliveryInstructions = deliveryInstructions;
    }

    await order.save();

    // Add system message
    await order.addMessage(
      req.user.id,
      'Delivery details updated',
      true
    );

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
