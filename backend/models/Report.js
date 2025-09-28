const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedItem: {
    itemType: {
      type: String,
      enum: ['listing', 'user', 'message'],
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for reporting'],
    enum: [
      'Inappropriate content',
      'Spam',
      'Fraud/Scam',
      'Harassment',
      'Fake listing',
      'Duplicate listing',
      'Wrong category',
      'Other'
    ]
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxLength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  action: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'user_suspended', 'user_banned']
  }
}, {
  timestamps: true
});

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ 'reportedItem.itemType': 1, 'reportedItem.itemId': 1 });

module.exports = mongoose.model('Report', reportSchema);