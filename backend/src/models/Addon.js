const mongoose = require('mongoose');

// One document per optional add-on (see config/plan.js). `history` is the record of every
// time it was switched on or off: who, when, at what price, and which terms they accepted.
const eventSchema = new mongoose.Schema({
  action: { type: String, enum: ['enabled', 'disabled'], required: true },
  at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userEmail: String,
  priceCents: Number,
  termsVersion: String,
  termsText: [String],
  ip: String,
}, { _id: false });

const addonSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  enabledAt: { type: Date, default: null },
  priceCents: { type: Number, default: 0 }, // price agreed when switched on
  history: [eventSchema],
}, { timestamps: true });

module.exports = mongoose.model('Addon', addonSchema);
