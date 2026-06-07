const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*', credentials: true } });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nexusbox_secret_key_2026';

// ===== SANITIZE INPUTS MIDDLEWARE =====
const sanitizeInputs = (req, res, next) => {
  const sanitize = (str) => {
    if (typeof str !== "string") return str;
    return xss(str.trim());
  };
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const result = {};
    for (const key in obj) {
      if (typeof obj[key] === "string") result[key] = sanitize(obj[key]);
      else if (typeof obj[key] === "object") result[key] = sanitizeObject(obj[key]);
      else result[key] = obj[key];
    }
    return result;
  };
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") req.query[key] = sanitize(req.query[key]);
    }
  }
  next();
};

// ===== REQUEST LOGGER =====
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
};

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputs);
app.use(requestLogger);
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexusbox').then(() => console.log('✅ MongoDB connected')).catch(err => console.error('❌ MongoDB error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  emailVerified: { type: Boolean, default: false },
  resetToken: String,
  resetTokenExpiry: Date,
  archiveSettings: { type: Object, default: {} },
  userSettings: { type: Object, default: {} },
  banPolicy: { type: Object, default: {} },
  publishAdvanced: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});


// ===== DATABASE INDEXES =====
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

boxSchema.index({ ownerId: 1 });
boxSchema.index({ slug: 1 }, { unique: true });
boxSchema.index({ embedKey: 1 }, { unique: true });

messageSchema.index({ boxId: 1, createdAt: -1 });
messageSchema.index({ boxId: 1, isArchived: 1 });
messageSchema.index({ boxId: 1, isSticky: 1 });
messageSchema.index({ author: 1 });

channelSchema.index({ boxId: 1 });
channelSchema.index({ boxId: 1, name: 1 }, { unique: true });

banSchema.index({ boxId: 1 });
banSchema.index({ target: 1 });
banSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const User = mongoose.model('User', userSchema);

const boxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  embedKey: { type: String, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'active' },
  theme: {
    primaryColor: { type: String, default: '#667eea' },
    secondaryColor: { type: String, default: '#764ba2' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#333333' },
    headerBg: { type: String, default: '#667eea' },
    headerText: { type: String, default: '#ffffff' },
    customCss: { type: String, default: '' }
  },
  layout: {
    width: { type: Number, default: 400 },
    height: { type: Number, default: 500 },
    formHeight: { type: Number, default: 107 },
    formOnTop: { type: Boolean, default: false },
    narrowLayout: { type: Boolean, default: false },
    showHeader: { type: Boolean, default: true },
    showFooter: { type: Boolean, default: true }
  },
  settings: {
    allowGuestPost: { type: Boolean, default: true },
    selfRegistration: { type: Boolean, default: true },
    lastPostDelete: { type: Boolean, default: false },
    messagesPerPage: { type: Number, default: 20 },
    sortDirection: { type: Number, default: 1 },
    language: { type: String, default: 'ar' },
    timezone: { type: String, default: 'Asia/Baghdad' },
    requireCaptcha: { type: Boolean, default: false }
  },
  dateSettings: {
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeFormat: { type: String, default: '24h' },
    showDate: { type: Boolean, default: true },
    showTime: { type: Boolean, default: true },
    relativeTime: { type: Boolean, default: false }
  },
  emojiSettings: {
    enabled: { type: Boolean, default: true },
    allowed: { type: [String], default: [':)', ':(', ':D', ';)', ':P', ':O', '<3'] },
    customEmojis: { type: [String], default: [] }
  },
  filterSettings: {
    enabled: { type: Boolean, default: true },
    bannedWords: { type: [String], default: [] },
    filterLinks: { type: Boolean, default: false },
    filterSpam: { type: Boolean, default: true },
    htmlMode: { type: Boolean, default: false },
    maxMessageLength: { type: Number, default: 500 },
    floodInterval: { type: Number, default: 3 }
  },
  posting: {
    allowEmail: { type: Boolean, default: true },
    avatars: { type: Boolean, default: true },
    boxCode: { type: Boolean, default: true },
    showFlag: { type: Boolean, default: true },
    pm: { type: Boolean, default: true },
    moderated: { type: Boolean, default: false },
    mic: { type: Boolean, default: true },
    soundMute: { type: Boolean, default: false },
    soundUrl: { type: String, default: '' },
    onlineShow: { type: Boolean, default: true },
    onlineTyping: { type: Boolean, default: true },
    floodBan: { type: Boolean, default: true },
    antiProxy: { type: Boolean, default: true },
    strongBans: { type: Boolean, default: true }
  },
  publish: {
    siteUrl: { type: String, default: '' },
    whitelistEnabled: { type: Boolean, default: false },
    allowedSites: { type: [String], default: [] },
    sslEnabled: { type: Boolean, default: true },
    autoResize: { type: Boolean, default: true }
  },
  webhook: {
    url: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
    events: { type: [String], default: ['message', 'user_join'] }
  },
  integration: {
    type: { type: String, default: 'none' },
    loginUrl: { type: String, default: '' },
    logoutUrl: { type: String, default: '' },
    syncUsers: { type: Boolean, default: false }
  },
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 }
  },
  archiveSettings: { type: Object, default: {} },
  userSettings: { type: Object, default: {} },
  banPolicy: { type: Object, default: {} },
  publishAdvanced: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

boxSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!this.slug) this.slug = 'box-' + Date.now().toString(36);
  }
  if (!this.embedKey) this.embedKey = crypto.randomBytes(16).toString('hex');
  this.updatedAt = new Date();
  next();
});
const Box = mongoose.model('Box', boxSchema);

const messageSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  content: { type: String, required: true },
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, default: 'Guest' },
    avatar: { type: String, default: '' }
  },
  channel: { type: String, default: 'general' },
  isSticky: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  ip: { type: String },
  attachments: [{ type: String }],
  archiveSettings: { type: Object, default: {} },
  userSettings: { type: Object, default: {} },
  banPolicy: { type: Object, default: {} },
  publishAdvanced: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const channelSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  archiveSettings: { type: Object, default: {} },
  userSettings: { type: Object, default: {} },
  banPolicy: { type: Object, default: {} },
  publishAdvanced: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});
const Channel = mongoose.model('Channel', channelSchema);

const boxUserSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, default: '' },
  level: { type: Number, default: 2 },
  avatar: { type: String, default: '' },
  registeredAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});
const BoxUser = mongoose.model('BoxUser', boxUserSchema);

const banSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  target: { type: String, required: true },
  targetType: { type: String, default: 'username' },
  reason: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  expiresAt: { type: Date },
  archiveSettings: { type: Object, default: {} },
  userSettings: { type: Object, default: {} },
  banPolicy: { type: Object, default: {} },
  publishAdvanced: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});
banSchema.pre('save', function(next) {
  if (this.duration > 0) this.expiresAt = new Date(Date.now() + this.duration * 60 * 60 * 1000);
  next();
});
const Ban = mongoose.model('Ban', banSchema);

const webLinkSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  archiveSettings: { type: Object, default: {} },
  userSettings: { type: Object, default: {} },
  banPolicy: { type: Object, default: {} },
  publishAdvanced: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});
const WebLink = mongoose.model('WebLink', webLinkSchema);

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, default: 'bug' },
  status: { type: String, default: 'open' },
  archiveSettings: { type: Object, default: {} },
  userSettings: { type: Object, default: {} },
  banPolicy: { type: Object, default: {} },
  publishAdvanced: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Request Logger

// Use logger for all routes


// ===== AUTH ROUTES =====


// ===== ADMIN MIDDLEWARE =====
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Admin access required' });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Super Admin access required' });
  }
};

// ===== SANITIZE HELPER =====
const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return xss(str.trim());
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitize(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

// ===== VALIDATION HELPERS =====
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (id && !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }
  next();
};

const validateBoxData = (req, res, next) => {
  const { name } = req.body;
  if (!name || name.length < 3 || name.length > 50) {
    return res.status(400).json({ success: false, error: 'Box name must be between 3 and 50 characters' });
  }
  req.body.name = sanitize(name);
  next();
};

const validateUserData = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];
  
  if (!username || username.length < 3 || username.length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  } else {
    req.body.username = sanitize(username);
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  } else {
    req.body.email = sanitize(email);
  }
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

const validateMessageData = (req, res, next) => {
  const { content } = req.body;
  if (!content || content.length === 0 || content.length > 1000) {
    return res.status(400).json({ success: false, error: 'Message must be between 1 and 1000 characters' });
  }
  req.body.content = sanitize(content);
  next();
};

// ===== AUDIT LOG =====
const auditLog = async (userId, action, resource, details = {}) => {
  try {
    console.log(`[AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource} | Details: ${JSON.stringify(details)}`);
    // يمكن حفظها في قاعدة البيانات لاحقاً
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// ===== REQUEST ENHANCER (Sanitize all inputs) =====
