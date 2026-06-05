require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  validate: { xForwardedForHeader: false }
});
app.use(limiter);

app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const settingsRoutes = require('./routes/settings');
const regUserRoutes = require('./routes/registered-users');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', settingsRoutes);
app.use('/api/registered-users', regUserRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NexusBox Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'NexusBox API',
    version: '1.0.0',
    status: 'online'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Database connection
async function connectToMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.log('❌ MongoDB error:', error.message);
    setTimeout(connectToMongo, 5000);
  }
}

const PORT = process.env.PORT || 3000;

connectToMongo();

app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════');
  console.log(' NexusBox Backend Started!');
  console.log(`📡 Port: ${PORT}`);
  console.log('═══════════════════════════════════════');
});
