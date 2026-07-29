const mongoose = require('mongoose');

const debatePointSchema = new mongoose.Schema({
  debateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: true,
    index: true
  },
  parentPointId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebatePoint',
    default: null,
    index: true
  },
  side: {
    type: String,
    enum: ['government', 'opposition'],
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  shlokaReferences: [{
    raw: { type: String },
    book: { type: String },
    chapter: { type: Number },
    verse: { type: Number },
    canto: { type: Number },
    part: { type: String },
    mantra: { type: Number },
    sanskrit: { type: String, default: '' },
    iast: { type: String, default: '' },
    translation: { type: String, default: '' },
    purport: { type: String, default: '' },
    url: { type: String, default: '' },
    label: { type: String, default: '' }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

debatePointSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

debatePointSchema.index({ debateId: 1, parentPointId: 1, createdAt: 1 });

module.exports = mongoose.model('DebatePoint', debatePointSchema);
