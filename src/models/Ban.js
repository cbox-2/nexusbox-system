const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  target: { type: String, required: true },
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true, index: true },
  reason: { type: String, default: '' },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true });

banSchema.index({ boxId: 1, target: 1 });
banSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Ban', banSchema);
