const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 2000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true, index: true },
  channel: { type: String, default: 'general' },
  isSticky: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

messageSchema.index({ boxId: 1, createdAt: -1 });
messageSchema.index({ channel: 1 });

module.exports = mongoose.model('Message', messageSchema);
