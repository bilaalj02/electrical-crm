const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  // Associated Project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Photo File Information
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },

  // Photo Metadata
  label: {
    type: String,
    default: 'Untitled Photo'
  },
  notes: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['before', 'during', 'after', 'inspection', 'documentation', 'other'],
    default: 'other'
  },

  // Upload Information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },

  // Optional: Location/Job Association
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },

  // Optional: Tags for better organization
  tags: [{
    type: String
  }],

  // Display Order
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
photoSchema.index({ project: 1, uploadedAt: -1 });
photoSchema.index({ project: 1, category: 1 });
photoSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Photo', photoSchema);
