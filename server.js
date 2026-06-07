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

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - User: ${req.user ? req.user._id : "anonymous"}`);
  next();
};

// Use logger for all routes
app.use(requestLogger);


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
const sanitizeInputs = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    }
  }
  next();
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, error: 'All fields required' });
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ success: false, error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/auth/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Current password incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: 'If email exists, reset link sent' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
    res.json({ success: true, message: 'Reset link sent', resetToken });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid token' });
    user.emailVerified = true;
    user.resetToken = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== BOX ROUTES =====
app.post('/api/boxes', auth, async (req, res) => {
  try {
    const box = new Box({ ...req.body, ownerId: req.userId });
    await box.save();
    res.status(201).json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes', auth, async (req, res) => {
  try {
    const boxes = await Box.find({ ownerId: req.userId }).populate("ownerId", "username email");
    res.json({ success: true, boxes });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:id', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: req.body }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/boxes/:id', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    await Message.deleteMany({ boxId: box._id });
    await Channel.deleteMany({ boxId: box._id });
    await BoxUser.deleteMany({ boxId: box._id });
    await Ban.deleteMany({ boxId: box._id });
    res.json({ success: true, message: 'Box deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== BOX SETTINGS ROUTES =====
app.get('/api/boxes/:id/settings', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, settings: box.settings });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/settings', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { settings: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/layout', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { layout: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/theme', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { theme: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/publish', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { publish: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/webhook', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { webhook: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/date-settings', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { dateSettings: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/emoji-settings', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { emojiSettings: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/filter-settings', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { filterSettings: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/integration', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { integration: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:id/stats', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const totalMessages = await Message.countDocuments({ boxId: box._id, isDeleted: false });
    const totalUsers = await BoxUser.countDocuments({ boxId: box._id });
    const totalChannels = await Channel.countDocuments({ boxId: box._id });
    const totalBans = await Ban.countDocuments({ boxId: box._id });
    res.json({ success: true, stats: { totalMessages, totalUsers, totalChannels, totalBans, totalViews: box.stats.totalViews, activeUsers: box.stats.activeUsers } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== EMBED ROUTES =====
app.get('/api/embed/:embedKey', async (req, res) => {
  try {
    const box = await Box.findOne({ embedKey: req.params.embedKey, status: 'active' });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    await Box.findByIdAndUpdate(box._id, { $inc: { 'stats.totalViews': 1 } });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/embed/:embedKey/messages', async (req, res) => {
  try {
    const box = await Box.findOne({ embedKey: req.params.embedKey, status: 'active' });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const messages = await Message.find({ boxId: box._id, isDeleted: false, isArchived: false })
      .sort({ isSticky: -1, createdAt: -1 }).limit(50);
    res.json({ success: true, messages });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/embed/:embedKey/messages', async (req, res) => {
  try {
    const box = await Box.findOne({ embedKey: req.params.embedKey, status: 'active' });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    if (!box.settings.allowGuestPost && !req.body.userId) {
      return res.status(403).json({ success: false, error: 'Guest posting not allowed' });
    }
    let content = req.body.content || '';
    if (box.filterSettings.enabled && box.filterSettings.bannedWords) {
      box.filterSettings.bannedWords.forEach(word => {
        if (word) content = content.replace(new RegExp(word, 'gi'), '***');
      });
    }
    if (content.length > (box.filterSettings.maxMessageLength || 500)) {
      return res.status(400).json({ success: false, error: 'Message too long' });
    }
    const message = new Message({
      boxId: box._id,
      content: content,
      author: { id: req.body.userId || null, username: req.body.username || 'زائر', avatar: req.body.avatar || '' },
      channel: req.body.channel || 'general'
    });
    await message.save();
    await Box.findByIdAndUpdate(box._id, { $inc: { 'stats.totalMessages': 1 } });
    io.to('box_' + box._id.toString()).emit('new_message', message);
    res.status(201).json({ success: true, message });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== MESSAGE ROUTES =====
app.post('/api/boxes/:boxId/messages', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.boxId, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const message = new Message({
      boxId: box._id,
      content: req.body.content,
      author: { id: req.userId, username: req.user.username },
      channel: req.body.channel || 'general',
      isSticky: req.body.isSticky || false
    });
    await message.save();
    await Box.findByIdAndUpdate(box._id, { $inc: { 'stats.totalMessages': 1 } });
    io.to('box_' + box._id.toString()).emit('new_message', message);
    res.status(201).json({ success: true, message });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:boxId/messages', auth, async (req, res) => {
  try {
    const query = { boxId: req.params.boxId, isDeleted: false };
    if (req.query.archived === 'true') query.isArchived = true;
    else query.isArchived = false;
    if (req.query.sticky === 'true') query.isSticky = true;
    if (req.query.channel) query.channel = req.query.channel;
    if (req.query.search) query.content = { $regex: req.query.search, $options: 'i' };
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(parseInt(req.query.limit) || 50);
    res.json({ success: true, messages });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/messages/:id', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, message });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/messages/:id', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:boxId/messages/export', auth, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const messages = await Message.find({ boxId: req.params.boxId, isDeleted: false });
    if (format === 'csv') {
      let csv = 'ID,Content,Author,Date,Channel\n';
      messages.forEach(m => {
        csv += `"${m._id}","${m.content.replace(/"/g, '""')}","${m.author.username}","${m.createdAt}","${m.channel}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=messages.csv');
      return res.send(csv);
    }
    res.json({ success: true, messages });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== CHANNEL ROUTES =====
app.post('/api/boxes/:boxId/channels', auth, async (req, res) => {
  try {
    const channel = new Channel({ boxId: req.params.boxId, name: req.body.name, description: req.body.description });
    await channel.save();
    res.status(201).json({ success: true, channel });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:boxId/channels', auth, async (req, res) => {
  try {
    const channels = await Channel.find({ boxId: req.params.boxId });
    res.json({ success: true, channels });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/channels/:id', auth, async (req, res) => {
  try {
    await Channel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Channel deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== USER ROUTES =====
app.post('/api/boxes/:boxId/users', auth, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new BoxUser({
      boxId: req.params.boxId,
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email || '',
      level: req.body.level || 2
    });
    await user.save();
    res.status(201).json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:boxId/users', auth, async (req, res) => {
  try {
    const users = await BoxUser.find({ boxId: req.params.boxId });
    res.json({ success: true, users });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/users/:id', auth, async (req, res) => {
  try {
    if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
    const user = await BoxUser.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/users/:id', auth, async (req, res) => {
  try {
    await BoxUser.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== BAN ROUTES =====
app.post('/api/boxes/:boxId/bans', auth, async (req, res) => {
  try {
    const ban = new Ban({
      boxId: req.params.boxId,
      target: req.body.target,
      targetType: req.body.targetType || 'username',
      reason: req.body.reason,
      duration: req.body.duration || 0
    });
    await ban.save();
    res.status(201).json({ success: true, ban });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:boxId/bans', auth, async (req, res) => {
  try {
    const bans = await Ban.find({ boxId: req.params.boxId });
    res.json({ success: true, bans });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/bans/:id', auth, async (req, res) => {
  try {
    await Ban.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ban removed' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== WEBLINK ROUTES =====
app.post('/api/boxes/:boxId/weblinks', auth, async (req, res) => {
  try {
    const link = new WebLink({ boxId: req.params.boxId, title: req.body.title, url: req.body.url });
    await link.save();
    res.status(201).json({ success: true, link });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/boxes/:boxId/weblinks', auth, async (req, res) => {
  try {
    const links = await WebLink.find({ boxId: req.params.boxId });
    res.json({ success: true, links });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/weblinks/:id', auth, async (req, res) => {
  try {
    await WebLink.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Link deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== SUPPORT ROUTES =====
app.post('/api/support/bug-report', auth, async (req, res) => {
  try {
    const ticket = new SupportTicket({
      userId: req.userId,
      subject: req.body.subject,
      description: req.body.description,
      type: req.body.type || 'bug'
    });
    await ticket.save();
    res.status(201).json({ success: true, ticket });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== UPLOAD ROUTE =====
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = 'data:' + req.file.mimetype + ';base64,' + base64;
    res.json({ success: true, url: dataUrl, filename: req.file.originalname });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ===== WEBSOCKET =====
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  socket.on('join_box', (boxId) => {
    socket.join('box_' + boxId);
    console.log('Socket ' + socket.id + ' joined box ' + boxId);
  });
  socket.on('leave_box', (boxId) => {
    socket.leave('box_' + boxId);
  });
  socket.on('typing', (data) => {
    socket.to('box_' + data.boxId).emit('user_typing', { username: data.username });
  });
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    features: ['websocket', 'upload', 'search', 'export', 'webhook']
  });
});

// ===== PAGE ROUTES =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.redirect('/admin/index.html'));
app.get('/admin/*', (req, res) => {
  const page = req.params[0];
  const filePath = path.join(__dirname, 'public', 'admin', page + '.html');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('Page not found');
  });
});
app.get('/logout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log('🚀 NexusBox server running on port ' + PORT);
  console.log('📍 http://localhost:' + PORT);
  console.log('🔌 WebSocket enabled');
});


// ===== MISSING ENDPOINTS (ADDED) =====

// ARCHIVE SETTINGS
app.get('/api/boxes/:id/archive-settings', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, archiveSettings: box.archiveSettings || {} });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/archive-settings', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { archiveSettings: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ARCHIVED MESSAGES
app.get('/api/boxes/:id/messages/archived', auth, async (req, res) => {
  try {
    const messages = await Message.find({ boxId: req.params.id, isArchived: true }).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, messages });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/messages/:id/archive', auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { $set: { isArchived: req.body.isArchived !== false } }, { new: true });
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, message: msg });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// USER SETTINGS
app.get('/api/boxes/:id/user-settings', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, userSettings: box.userSettings || {} });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/user-settings', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { userSettings: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// BAN POLICY
app.get('/api/boxes/:id/ban-policy', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, banPolicy: box.banPolicy || {} });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/boxes/:id/ban-policy', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { banPolicy: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PUBLISH ADVANCED
app.put('/api/boxes/:id/publish-advanced', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { publishAdvanced: req.body } }, { new: true });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// CHANNEL UPDATE
app.put('/api/channels/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });
    res.json({ success: true, channel });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// STICKY MESSAGE UPDATE
app.put('/api/messages/:id/sticky', auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { $set: { content: req.body.content, isSticky: true } }, { new: true });
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, message: msg });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// STICKY MESSAGE DELETE
app.delete('/api/messages/:id/sticky', auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
// ===== END OF MISSING ENDPOINTS =====
