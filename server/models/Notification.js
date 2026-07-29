const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'debate_approved',
      'debate_rejected',
      'new_debate',
      'joined_government',
      'joined_opposition',
      'new_counterpoint',
      'new_reply',
      'debate_judging',
      'winner_announced'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  debateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
