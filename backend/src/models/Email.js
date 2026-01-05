const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  // Email identification
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  threadId: String,

  // Email account info
  accountEmail: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['gmail1', 'gmail2', 'microsoft', 'godaddy'],
    required: true
  },

  // Email content
  from: {
    name: String,
    email: {
      type: String,
      required: true
    }
  },
  to: [{
    name: String,
    email: String
  }],
  cc: [{
    name: String,
    email: String
  }],
  subject: {
    type: String,
    default: ''
  },
  body: {
    text: String,
    html: String
  },
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    url: String
  }],

  // Email metadata
  date: {
    type: Date,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  labels: [String],

  // Classification
  isWorkRelated: {
    type: Boolean,
    default: null // null means not yet classified
  },
  classificationConfidence: Number,

  // Job linking
  linkedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },

  // Search optimization
  searchText: String,

  // Sync metadata
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
emailSchema.index({ accountEmail: 1, date: -1 });
emailSchema.index({ isWorkRelated: 1, date: -1 });
emailSchema.index({ 'from.email': 1 });
emailSchema.index({ linkedJob: 1 });
emailSchema.index({ searchText: 'text' });

// Pre-save middleware to create searchText
emailSchema.pre('save', function(next) {
  this.searchText = `${this.subject} ${this.from.name} ${this.from.email} ${this.body.text}`.toLowerCase();
  next();
});

module.exports = mongoose.model('Email', emailSchema);
