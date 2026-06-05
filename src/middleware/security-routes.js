const { securityLog } = require('./security');

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

const apiRateLimit = (windowMs, max) => {
  windowMs = windowMs || 60000;
  max = max || 100;
  const requests = new Map();
  
  return (req, res, next) => {
    const key = (req.ip || 'unknown') + ':' + req.path;
    const now = Date.now();
    
    const reqs = (requests.get(key) || []).filter(t => now - t < windowMs);
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

const securityErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    securityLog('UNAUTHORIZED_ACCESS', { path: req.path }, req);
  }
  
  if (err.name === 'JsonWebTokenError') {
    securityLog('INVALID_JWT', { path: req.path }, req);
  }
  
  if (process.env.NODE_ENV === 'production') {
    console.error('[ERROR]', err.message);
    return res.status(err.status || 500).json({
      success: false,
      error: 'Internal server error'
    });
  }
  
  next(err);
};

module.exports = {
  securityHeaders,
  apiRateLimit,
  securityErrorHandler
};
