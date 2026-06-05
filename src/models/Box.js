const mongoose = require('mongoose');
const crypto = require('crypto');

const boxSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  slug: { type: String, unique: true, lowercase: true, match: /^[a-z0-9-]+$/ },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  embedKey: { type: String, unique: true, required: true },
  status: { type: String, default: 'active', enum: ['active', 'disabled', 'archived'] },
  
  theme: {
    preset: { type: Number, default: -1000 },
    customCss: { type: String, default: '' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#333333' },
    primaryColor: { type: String, default: '#667eea' }
  },
  
  layout: {
    width: { type: Number, default: 400 },
    height: { type: Number, default: 400 },
    formHeight: { type: Number, default: 107 },
    formOnTop: { type: Boolean, default: false },
    narrowLayout: { type: Boolean, default: false }
  },
  
  publish: {
    enabled: { type: Boolean, default: true },
    siteUrl: { type: String, default: '' },
    whitelistEnabled: { type: Boolean, default: false },
    securityTag: { type: String, default: '' }
  },
  
  settings: {
    messagesPerPage: { type: Number, default: 20 },
    sortDirection: { type: Number, default: 1 },
    language: { type: String, default: 'ar' },
    allowGuestPost: { type: Boolean, default: true },
    requireRegistration: { type: Boolean, default: false },
    selfRegistration: { type: Boolean, default: true },
    lastPostDelete: { type: Boolean, default: false }
  },
  
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
boxSchema.index({ ownerId: 1, createdAt: -1 });
boxSchema.index({ slug: 1 }, { unique: true });
boxSchema.index({ embedKey: 1 }, { unique: true });
boxSchema.index({ status: 1 });

// Auto-generate slug and embedKey
boxSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (!this.embedKey) {
    this.embedKey = crypto.randomBytes(16).toString('hex');
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Box', boxSchema);
