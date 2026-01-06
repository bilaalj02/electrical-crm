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
    attachmentId: String
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
