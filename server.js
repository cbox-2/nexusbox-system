require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./src/models/User');
const Box = require('./src/models/Box');

// Import middleware
const authMiddleware = require('./src/middleware/auth');
const { securityHeaders, apiRateLimit } = require('./src/middleware/security-routes');
const { detectSuspicious } = require('./src/middleware/security');

// Import routes
const boxRoutes = require('./src/routes/boxes');

const app = express();

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security
app.use(securityHeaders);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  validate: { xForwardedForHeader: false } 
});
app.use(limiter);
app.use(detectSuspicious);

// Static files
app.use(express.static('public'));

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NexusBox Box Generator System',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '2.0.0'
  });
});

// ============================================
// Auth Routes
// ============================================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password min 6 chars' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username/email exists' });
    }
    const user = new User({ username, email, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, user: user.toJSON(), token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account not active' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: user.toJSON(), token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

// ============================================
// BOX ROUTES (Multi-Tenant System)
// ============================================
app.use('/api/boxes', apiRateLimit(60000, 30), boxRoutes);

// Get box by embedKey (public endpoint for embed)
const boxController = require('./src/controllers/boxController');
app.get('/api/embed/:embedKey', boxController.getBoxByEmbedKey);

// Root
app.get('/', (req, res) => {
  res.json({ 
    name: 'NexusBox Box Generator', 
    version: '2.0.0', 
    status: 'online',
    docs: '/api/health'
  });
});

// Error handlers
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ============================================
// Database connection
// ============================================
async function connectToMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to MongoDB Atlas');
    await Box.createIndexes();
    console.log('✅ Indexes created');
  } catch (error) {
    console.log('❌ MongoDB error:', error.message);
    setTimeout(connectToMongo, 5000);
  }
}

const PORT = process.env.PORT || 3000;
connectToMongo();

app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════');
  console.log(' NexusBox Box Generator v2.0.0');
  console.log('📦 Multi-Tenant Box System');
  console.log(' Port: ' + PORT);
  console.log('═══════════════════════════════════════');
});
