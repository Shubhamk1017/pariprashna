const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  motion: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
  },
  notes: {
    type: String,
    default: '',
    maxlength: 2000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'open', 'active', 'judging', 'completed', 'rejected'],
    default: 'pending'
  },
  governmentParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  oppositionParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  judges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  winner: {
    type: String,
    enum: ['government', 'opposition', null],
    default: null
  },
  finalRemarks: {
    type: String,
    default: '',
    maxlength: 3000
  },
  lockedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

debateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

debateSchema.index({ status: 1, createdAt: -1 });
debateSchema.index({ createdBy: 1 });
debateSchema.index({ governmentParticipants: 1 });
debateSchema.index({ oppositionParticipants: 1 });

module.exports = mongoose.model('Debate', debateSchema);
