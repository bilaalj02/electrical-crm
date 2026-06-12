const mongoose = require('mongoose');

const DiagramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Diagram',
  },
  canvas: {
    type: mongoose.Schema.Types.Mixed, // Fabric.js JSON
    default: {},
  },
  thumbnail: {
    type: String, // base64 PNG preview
    default: '',
  },
  linkedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
  },
  linkedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [{ type: String }],
  isTemplate: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Diagram', DiagramSchema);
