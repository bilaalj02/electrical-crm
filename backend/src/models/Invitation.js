const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'manager', 'technician', 'viewer'],
    default: 'employee'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  acceptedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
invitationSchema.index({ email: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });

// Static method to generate unique token
invitationSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Method to check if invitation is valid
invitationSchema.methods.isValid = function() {
  return this.status === 'pending' && this.expiresAt > new Date();
};

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
