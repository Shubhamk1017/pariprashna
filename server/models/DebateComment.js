const mongoose = require('mongoose');

const debateCommentSchema = new mongoose.Schema({
  debateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true,
    maxlength: 5000,
    trim: true
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateComment',
    default: null,
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

debateCommentSchema.index({ debateId: 1, createdAt: -1 });
debateCommentSchema.index({ debateId: 1, parentCommentId: 1 });

module.exports = mongoose.model('DebateComment', debateCommentSchema);
