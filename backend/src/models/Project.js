const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Project Identification
  title: {
    type: String,
    required: true
  },
  description: String,

  // Link to Job
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },

  // Photos
  photos: [{
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    size: Number, // File size in bytes
    mimeType: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    // For organizing photos
    tags: [String],
    isBeforePhoto: {
      type: Boolean,
      default: false
    },
    isAfterPhoto: {
      type: Boolean,
      default: false
    }
  }],

  // Notes
  notes: [{
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    // Attach photos to specific notes
    attachedPhotos: [{
      type: String // Reference to photo filename
    }]
  }],

  // Project Date
  projectDate: {
    type: Date,
    default: Date.now
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },

  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
projectSchema.index({ job: 1 });
projectSchema.index({ projectDate: -1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ 'photos.uploadedAt': -1 });

// Virtual for photo count
projectSchema.virtual('photoCount').get(function() {
  return this.photos.length;
});

// Virtual for note count
projectSchema.virtual('noteCount').get(function() {
  return this.notes.length;
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
