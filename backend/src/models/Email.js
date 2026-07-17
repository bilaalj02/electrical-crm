const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  threadId: {
    type: String
  },
  from: {
    name: String,
    email: String
  },
  to: [{
    name: String,
    email: String
  }],
  cc: [{
    name: String,
    email: String
  }],
  bcc: [{
    name: String,
    email: String
  }],
  subject: {
    type: String,
    default: '(No Subject)'
  },
  body: {
    text: String,
    html: String
  },
  snippet: String,
  date: {
    type: Date,
    required: true
  },
  labels: [String],
  // Outlook only (Gmail keeps its existing labels-based inbox/sent split).
  // folderId is the Microsoft mailFolder ID the message currently lives in;
  // folderName is a human-readable full path (e.g. "Invoices/2026") built
  // from the same folder-tree walk used by the sync-scope folder picker.
  folderId: String,
  folderName: String,
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  hasAttachments: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    mimeType: String,
    size: Number,
    attachmentId: String,
    url: String,      // Cloudinary secure_url — present once downloaded/stored
    publicId: String   // Cloudinary public_id, for future deletion/management
  }],
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  isWorkRelated: {
    type: Boolean,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for fast queries
emailSchema.index({ userId: 1, date: -1 });
emailSchema.index({ emailAccountId: 1 });
emailSchema.index({ clientId: 1 });
emailSchema.index({ jobId: 1 });
emailSchema.index({ 'from.email': 1 });
emailSchema.index({ subject: 'text', 'body.text': 'text' });

module.exports = mongoose.model('Email', emailSchema);
