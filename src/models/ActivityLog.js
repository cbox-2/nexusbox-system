const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', index: true },
  action: { 
    type: String, 
    required: true,
    enum: ['login', 'logout', 'create_box', 'update_box', 'delete_box', 
           'create_user', 'delete_user', 'ban_user', 'unban_user',
           'send_message', 'delete_message', 'admin_action']
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ boxId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
