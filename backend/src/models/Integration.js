const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['quickbooks'],
    required: true
  },
  accessToken: {
    type: String
  },
  refreshToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  realmId: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Set true when a token refresh fails with a permanent auth error
  // (expired/revoked refresh token, invalid_grant) — distinct from the user
  // deliberately clicking "Disconnect". Lets the UI show "Reconnect" instead
  // of a generic error.
  needsReconnect: {
    type: Boolean,
    default: false
  },
  lastSyncedAt: {
    type: Date
  },
  enabledDataTypes: {
    type: [String],
    enum: ['customers', 'invoices', 'payments'],
    default: []
  },
  syncStats: {
    clientsImported: { type: Number, default: 0 },
    jobsImported: { type: Number, default: 0 },
    paymentsUpdated: { type: Number, default: 0 },
    lastError: { type: String, default: null }
  }
}, {
  timestamps: true
});

integrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
