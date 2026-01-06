const mongoose = require('mongoose');

const emailAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['gmail', 'microsoft', 'imap'],
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncedAt: {
    type: Date
  },
  syncToken: {
    type: String
  }
}, {
  timestamps: true
});

// Index for quick lookup
emailAccountSchema.index({ userId: 1, email: 1 });

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
