const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Chat = require('../models/Chat');
const Listing = require('../models/Listing');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/chat';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow images, documents, and audio files
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
      'video/mp4', 'video/webm', 'video/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files per message
  }
});

// @desc    Get user's chats
// @route   GET /api/chat
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      status: 'active'
    })
      .populate('participants', 'name avatar')
      .populate('listing', 'title price images')
      .populate('lastMessage.sender', 'name')
      .sort({ 'lastMessage.timestamp': -1 });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get or create chat for a listing
// @route   POST /api/chat/listing/:listingId
// @access  Private
router.post('/listing/:listingId', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId).populate('seller');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!listing.seller) {
      return res.status(400).json({ error: 'Listing has no seller' });
    }

    // Check if user is trying to chat with themselves
    if (listing.seller._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, listing.seller._id] },
      listing: listing._id
    })
      .populate('participants', 'name avatar')
      .populate('listing', 'title price images')
      .populate('messages.sender', 'name');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.user.id, listing.seller._id],
        listing: listing._id,
        messages: []
      });

      await chat.save();
      await chat.populate([
        { path: 'participants', select: 'name avatar' },
        { path: 'listing', select: 'title price images' },
        { path: 'messages.sender', select: 'name' }
      ]);
    }

    res.json(chat);
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get chat by ID
// @route   GET /api/chat/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name avatar')
      .populate('listing', 'title price images seller')
      .populate('messages.sender', 'name avatar');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark messages as read
    chat.messages.forEach(message => {
      if (!message.readBy.some(r => r.user.toString() === req.user.id)) {
        message.readBy.push({ user: req.user.id });
      }
    });

    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Send message
// @route   POST /api/chat/:id/message
// @access  Private
router.post('/:id/message', protect, async (req, res) => {
  try {
    const { content, messageType, offer, replyTo } = req.body;

    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = {
      sender: req.user.id,
      content,
      messageType: messageType || 'text',
      readBy: [{ user: req.user.id }]
    };

    if (messageType === 'offer' && offer) {
      message.offer = offer;
    }

    if (replyTo) {
      message.replyTo = replyTo;
    }

    chat.messages.push(message);
    chat.lastMessage = {
      content: content || `Sent a ${messageType}`,
      sender: req.user.id,
      timestamp: new Date()
    };

    await chat.save();
    
    // Populate the new message
    await chat.populate('messages.sender', 'name avatar');
    
    const newMessage = chat.messages[chat.messages.length - 1];

    res.json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Send message with attachments
// @route   POST /api/chat/:id/message/upload
// @access  Private
router.post('/:id/message/upload', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { content, messageType, replyTo } = req.body;

    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/chat/${file.filename}`
    })) : [];

    const message = {
      sender: req.user.id,
      content: content || '',
      messageType: messageType || (attachments.length > 0 ? 'file' : 'text'),
      attachments,
      readBy: [{ user: req.user.id }]
    };

    if (replyTo) {
      message.replyTo = replyTo;
    }

    chat.messages.push(message);
    chat.lastMessage = {
      content: content || `Sent ${attachments.length} file(s)`,
      sender: req.user.id,
      timestamp: new Date()
    };

    await chat.save();
    
    // Populate the new message
    await chat.populate('messages.sender', 'name avatar');
    
    const newMessage = chat.messages[chat.messages.length - 1];

    res.json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Respond to offer
// @route   PUT /api/chat/:id/message/:messageId/offer
// @access  Private
router.put('/:id/message/:messageId/offer', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = chat.messages.id(req.params.messageId);
    
    if (!message || message.messageType !== 'offer') {
      return res.status(404).json({ error: 'Offer message not found' });
    }

    message.offer.status = status;
    await chat.save();

    res.json({
      message: `Offer ${status}`,
      offer: message.offer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Add reaction to message
// @route   POST /api/chat/:id/message/:messageId/reaction
// @access  Private
router.post('/:id/message/:messageId/reaction', protect, async (req, res) => {
  try {
    const { emoji } = req.body;

    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = chat.messages.id(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user.id
    );

    // Add new reaction
    if (emoji) {
      message.reactions.push({
        user: req.user.id,
        emoji
      });
    }

    await chat.save();

    res.json({
      message: 'Reaction updated',
      reactions: message.reactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Edit message
// @route   PUT /api/chat/:id/message/:messageId
// @access  Private
router.put('/:id/message/:messageId', protect, async (req, res) => {
  try {
    const { content } = req.body;

    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = chat.messages.id(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Can only edit your own messages' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();

    await chat.save();

    res.json({
      message: 'Message updated',
      updatedMessage: message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Delete message
// @route   DELETE /api/chat/:id/message/:messageId
// @access  Private
router.delete('/:id/message/:messageId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = chat.messages.id(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';

    await chat.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Search messages in chat
// @route   GET /api/chat/:id/search
// @access  Private
router.get('/:id/search', protect, async (req, res) => {
  try {
    const { q } = req.query;

    const chat = await Chat.findById(req.params.id)
      .populate('messages.sender', 'name avatar');
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Search messages
    const searchResults = chat.messages.filter(message => 
      !message.deleted && 
      message.content.toLowerCase().includes(q.toLowerCase())
    );

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Mark messages as read
// @route   PUT /api/chat/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark all messages as read
    chat.messages.forEach(message => {
      if (!message.readBy.some(r => r.user.toString() === req.user.id)) {
        message.readBy.push({ user: req.user.id });
      }
    });

    await chat.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;