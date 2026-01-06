const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true
  },
  company: String,

  // Contact Information
  email: {
    type: String,
    required: true
  },
  phone: String,
  alternatePhone: String,

  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },

  // Client Details
  clientType: {
    type: String,
    enum: ['residential', 'commercial', 'industrial'],
    default: 'residential'
  },

  // Lead Source
  source: {
    type: String,
    enum: ['website', 'referral', 'manual', 'phone', 'email'],
    default: 'manual'
  },

  // Service requested (from website form)
  serviceRequested: String,

  // Initial message from contact form
  initialMessage: String,

  notes: String,

  // Financial
  totalSpent: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'active', 'inactive', 'prospect', 'won', 'lost'],
    default: 'new'
  },

  // Related jobs
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }]
}, {
  timestamps: true
});

// Indexes
clientSchema.index({ email: 1 });
clientSchema.index({ name: 1 });
clientSchema.index({ status: 1 });

module.exports = mongoose.model('Client', clientSchema);
