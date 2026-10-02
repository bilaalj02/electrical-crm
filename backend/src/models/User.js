const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'manager', 'technician', 'viewer'],
    default: 'employee'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  phone: {
    type: String,
    trim: true
  },
  preferredContact: {
    type: String,
    enum: ['email', 'phone', 'text'],
    default: 'email'
  },
  profileImage: {
    type: String
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Separate from `role` on purpose: `role: 'admin'` means "runs their own
  // CRM" (e.g. a client's business owner) — it says nothing about access to
  // platform-level activity monitoring. isDeveloper is Cold Solutions' own
  // flag, set manually and directly in the database on specific accounts
  // only. It is never exposed through any registration/user-management UI,
  // so there is no in-app path for anyone (including a client admin) to
  // grant it to themselves or anyone else.
  isDeveloper: {
    type: Boolean,
    default: false
  },
  // Whether this user has dismissed the activity-monitoring disclosure
  // banner at least once. Tracked server-side (not just localStorage) so it
  // persists across devices/browsers for the same account.
  hasSeenMonitoringNotice: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
