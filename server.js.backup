require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const { router: authRouter, authMiddleware, adminMiddleware } = require("./routes/auth");

const app = express();

// ===== Trust Proxy (مهم لـ Railway) =====
app.set("trust proxy", true);

// ===== حفظ معلومات الاتصال للتشخيص =====
let connectionInfo = {
  status: 'connecting',
  error: null,
  uri: null,
  attempts: 0,
  lastAttempt: null
};

// ===== Security Middleware =====
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== Rate Limiting =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// ===== Body Parser =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ===== Static Files =====
app.use(express.static('public'));

// ===== تشخيص المتغيرات =====
console.log('');
console.log('═══════════════════════════════════════');
console.log('🔍 تشخيص المتغيرات:');
console.log('═══════════════════════════════════════');
console.log(`PORT: ${process.env.PORT || 'NOT SET'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET ✓' : 'NOT SET ✗'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET ✓' : 'NOT SET ✗'}`);

if (process.env.MONGODB_URI) {
  // إخفاء كلمة المرور للتشخيص
  const maskedUri = process.env.MONGODB_URI.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log(`URI Preview: ${maskedUri}`);
  connectionInfo.uri = maskedUri;
} else {
  console.log('❌ MONGODB_URI غير موجود!');
  connectionInfo.error = 'MONGODB_URI environment variable is not set';
}
console.log('═══════════════════════════════════════');
console.log('');

// ===== MongoDB Connection مع إعادة المحاولة =====
const MONGODB_URI = process.env.MONGODB_URI;

function connectToMongo() {
  if (!MONGODB_URI) {
    connectionInfo.status = 'failed';
    connectionInfo.error = 'MONGODB_URI not set';
    console.log('❌ لا يمكن الاتصال: MONGODB_URI غير موجود');
    return;
  }

  connectionInfo.attempts++;
  connectionInfo.lastAttempt = new Date().toISOString();
  console.log(`🔄 محاولة الاتصال #${connectionInfo.attempts}...`);

  mongoose.connect(MONGODB_URI)
    .then(() => {
      connectionInfo.status = 'connected';
      connectionInfo.error = null;
      console.log('✅ Connected to MongoDB Atlas');
      console.log('📦 Database: nexusbox');
    })
    .catch(err => {
      connectionInfo.status = 'disconnected';
      connectionInfo.error = err.message;
      console.error('❌ MongoDB connection error:', err.message);
      console.error('🔍 Error details:', err);
      
      // إعادة المحاولة بعد 5 ثواني
      setTimeout(connectToMongo, 5000);
    });
}

// بدء الاتصال
connectToMongo();

// ===== Authentication Routes =====
app.use("/api/auth", authRouter);

// ===== Protected Route Example =====
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to your profile",
    user: req.user.toJSON()
  });
});

// ===== Admin Route Example =====
app.get("/api/admin/dashboard", authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin!",
    user: req.user.toJSON()
  });
});

// ===== Health Check Endpoint =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NexusBox Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// ===== Debug Endpoint (للتشخيص) =====
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    debug: {
      connection: connectionInfo,
      mongooseState: mongoose.connection.readyState,
      mongooseStates: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        MONGODB_URI_SET: !!process.env.MONGODB_URI,
        JWT_SECRET_SET: !!process.env.JWT_SECRET
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    }
  });
});

// ===== Root Endpoint =====
app.get('/', (req, res) => {
  res.json({
    name: 'NexusBox API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      debug: '/api/debug',
      auth: '/api/auth',
      users: '/api/users',
      messages: '/api/messages',
      bans: '/api/bans'
    }
  });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🚀 NexusBox Backend Started!');
  console.log('═══════════════════════════════════════');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug: http://localhost:${PORT}/api/debug`);
  console.log('═══════════════════════════════════════');
  console.log('');
});

// ===== Graceful Shutdown =====
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
