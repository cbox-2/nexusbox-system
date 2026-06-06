const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nexusbox_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexusbox', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ===== MODELS =====

// User Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Box Model
const boxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  embedKey: { type: String, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'active' },
  theme: {
    primaryColor: { type: String, default: '#667eea' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#333333' },
    customCss: { type: String, default: '' }
  },
  layout: {
    width: { type: Number, default: 400 },
    height: { type: Number, default: 400 },
    formHeight: { type: Number, default: 107 },
    formOnTop: { type: Boolean, default: false },
    narrowLayout: { type: Boolean, default: false }
  },
  settings: {
    allowGuestPost: { type: Boolean, default: true },
    selfRegistration: { type: Boolean, default: true },
    lastPostDelete: { type: Boolean, default: false },
    messagesPerPage: { type: Number, default: 20 },
    sortDirection: { type: Number, default: 1 },
    language: { type: String, default: 'ar' },
    timezone: { type: String, default: 'Asia/Baghdad' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeFormat: { type: String, default: '24h' }
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
    enabled: { type: Boolean, default: false }
  },
  filter: {
    enabled: { type: Boolean, default: true },
    bannedWords: { type: [String], default: [] },
    filterLinks: { type: Boolean, default: false },
    filterSpam: { type: Boolean, default: true },
    htmlMode: { type: Boolean, default: false }
  },
  emoji: {
    enabled: { type: Boolean, default: true },
    allowed: { type: [String], default: [] }
  },
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate slug and embedKey
boxSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!this.slug) this.slug = 'box-' + Date.now().toString(36);
  }
  if (!this.embedKey) {
    this.embedKey = crypto.randomBytes(16).toString('hex');
  }
  this.updatedAt = new Date();
  next();
});

const Box = mongoose.model('Box', boxSchema);

// Message Model
const messageSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  content: { type: String, required: true },
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, default: 'Guest' }
  },
  channel: { type: String, default: 'general' },
  isSticky: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Channel Model
const channelSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Channel = mongoose.model('Channel', channelSchema);

// BoxUser Model (Registered users for a box)
const boxUserSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  level: { type: Number, default: 2 }, // 2=user, 3=mod, 4=admin, 5=owner
  registeredAt: { type: Date, default: Date.now }
});

const BoxUser = mongoose.model('BoxUser', boxUserSchema);

// Ban Model
const banSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  target: { type: String, required: true },
  reason: { type: String, default: '' },
  duration: { type: Number, default: 0 }, // hours, 0 = permanent
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

banSchema.pre('save', function(next) {
  if (this.duration > 0) {
    this.expiresAt = new Date(Date.now() + this.duration * 60 * 60 * 1000);
  }
  next();
});

const Ban = mongoose.model('Ban', banSchema);

// WebLink Model
const webLinkSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const WebLink = mongoose.model('WebLink', webLinkSchema);

// ===== AUTH MIDDLEWARE =====

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

// ===== AUTH ROUTES =====

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== BOX ROUTES =====

app.post('/api/boxes', auth, async (req, res) => {
  try {
    const box = new Box({
      ...req.body,
      ownerId: req.userId
    });
    await box.save();
    
    res.status(201).json({ success: true, box });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/boxes', auth, async (req, res) => {
  try {
    const boxes = await Box.find({ ownerId: req.userId });
    res.json({ success: true, boxes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/boxes/:id', auth, async (req, res) => {
  try {
    const box = await Box.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/boxes/:id', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/boxes/:id', auth, async (req, res) => {
  try {
    const box = await Box.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, message: 'Box deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== EMBED ROUTE =====

app.get('/api/embed/:embedKey', async (req, res) => {
  try {
    const box = await Box.findOne({ embedKey: req.params.embedKey, status: 'active' });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    
    await Box.findByIdAndUpdate(box._id, { $inc: { 'stats.totalViews': 1 } });
    
    res.json({ success: true, box });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
    
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/boxes/:boxId/messages', auth, async (req, res) => {
  try {
    const query = { boxId: req.params.boxId, isDeleted: false };
    
    if (req.query.archived === 'true') query.isArchived = true;
    else query.isArchived = false;
    
    if (req.query.sticky === 'true') query.isSticky = true;
    if (req.query.channel) query.channel = req.query.channel;
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/messages/:id', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/messages/:id', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CHANNEL ROUTES =====

app.post('/api/boxes/:boxId/channels', auth, async (req, res) => {
  try {
    const channel = new Channel({
      boxId: req.params.boxId,
      name: req.body.name,
      description: req.body.description
    });
    await channel.save();
    res.status(201).json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/boxes/:boxId/channels', auth, async (req, res) => {
  try {
    const channels = await Channel.find({ boxId: req.params.boxId });
    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/channels/:id', auth, async (req, res) => {
  try {
    await Channel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== USER ROUTES =====

app.post('/api/boxes/:boxId/users', auth, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new BoxUser({
      boxId: req.params.boxId,
      username: req.body.username,
      password: hashedPassword,
      level: req.body.level || 2
    });
    await user.save();
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/boxes/:boxId/users', auth, async (req, res) => {
  try {
    const users = await BoxUser.find({ boxId: req.params.boxId });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/users/:id', auth, async (req, res) => {
  try {
    const user = await BoxUser.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:id', auth, async (req, res) => {
  try {
    await BoxUser.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== BAN ROUTES =====

app.post('/api/boxes/:boxId/bans', auth, async (req, res) => {
  try {
    const ban = new Ban({
      boxId: req.params.boxId,
      target: req.body.target,
      reason: req.body.reason,
      duration: req.body.duration || 0
    });
    await ban.save();
    res.status(201).json({ success: true, ban });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/boxes/:boxId/bans', auth, async (req, res) => {
  try {
    const bans = await Ban.find({ boxId: req.params.boxId });
    res.json({ success: true, bans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/bans/:id', auth, async (req, res) => {
  try {
    await Ban.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ban removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== WEBLINK ROUTES =====

app.post('/api/boxes/:boxId/weblinks', auth, async (req, res) => {
  try {
    const link = new WebLink({
      boxId: req.params.boxId,
      title: req.body.title,
      url: req.body.url
    });
    await link.save();
    res.status(201).json({ success: true, link });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/boxes/:boxId/weblinks', auth, async (req, res) => {
  try {
    const links = await WebLink.find({ boxId: req.params.boxId });
    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/weblinks/:id', auth, async (req, res) => {
  try {
    await WebLink.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SETTINGS ROUTES =====

app.post('/api/settings/date', auth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Date settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/settings/emoji', auth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Emoji settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/settings/filter', auth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Filter settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== HEALTH CHECK =====

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// ===== START SERVER =====

app.listen(PORT, () => {
  console.log(`🚀 NexusBox server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

// ===== PUBLIC CHAT ROUTES =====

app.get('/api/embed/:embedKey/messages', async (req, res) => {
  try {
    const box = await Box.findOne({ embedKey: req.params.embedKey, status: 'active' });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    
    const messages = await Message.find({ 
      boxId: box._id, 
      isDeleted: false,
      isArchived: false 
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/embed/:embedKey/messages', async (req, res) => {
  try {
    const box = await Box.findOne({ embedKey: req.params.embedKey, status: 'active' });
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    
    // Check if guest posting is allowed
    if (!box.settings.allowGuestPost && !req.body.userId) {
      return res.status(403).json({ success: false, error: 'Guest posting not allowed' });
    }
    
    const message = new Message({
      boxId: box._id,
      content: req.body.content,
      author: {
        id: req.body.userId || null,
        username: req.body.username || 'زائر'
      },
      channel: req.body.channel || 'general'
    });
    
    await message.save();
    await Box.findByIdAndUpdate(box._id, { $inc: { 'stats.totalMessages': 1 } });
    
    // Send webhook if enabled
    if (box.webhook.enabled && box.webhook.url) {
      try {
        const fetch = require('node-fetch');
        await fetch(box.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message.content,
            author: message.author.username,
            box: box.name,
            timestamp: message.createdAt
          })
        });
      } catch(e) {
        console.error('Webhook error:', e);
      }
    }
    
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
