const mongoose = require('mongoose');

const CustomSymbolSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'custom' },
  subcategory: { type: String, default: 'custom' },
  svg: { type: String, required: true },
  connectionPoints: [{
    x: Number,
    y: Number,
    type: String,
  }],
  tags: [{ type: String }],
  standards: [{ type: String }],
  isCustom: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('CustomSymbol', CustomSymbolSchema);
