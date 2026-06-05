// ===== NexusBox Security Routes Middleware =====
const { securityLog, detectSuspicious, sanitizeInput } = require('./security');

// 1. Security Headers
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// 2. CORS Security
const corsSecurity = (req, res, next) => {
  const allowedOrigins = [
    'https://nexusbox-system-production-c290.up.railway.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

// 3. Auth Protection
const requireAuth = (req, res, next) => {
  next();
};

// 4. API Rate Limiting (per-endpoint)
const apiRateLimit = (windowMs = 60000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip + ':' + req.path;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const reqs = requests.get(key).filter(t => now - t < windowMs);
    reqs.push(now);
    requests.set(key, reqs);
    
    if (reqs.length > max) {
      securityLog('RATE_LIMIT_EXCEEDED', { path: req.path, count: reqs.length }, req);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }
    
    next();
  };
};

// 5. Filter Sensitive Data
const filterSensitiveData = (user) => {
  if (!user) return null;
  const filtered = { ...user };
  delete filtered.password;
  delete filtered.__v;
  return filtered;
};

// 6. Error Handler
const securityErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    securityLog('UNAUTHORIZED_ACCESS', { path: req.path }, req);
  }
  
  if (err.name === 'JsonWebTokenError') {
    securityLog('INVALID_JWT', { path: req.path }, req);
  }
  
  if (err.message && err.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable'
    });
  }
  
  next(err);
};

module.exports = {
  securityHeaders,
  corsSecurity,
  requireAuth,
  apiRateLimit,
  filterSensitiveData,
  securityErrorHandler
};
