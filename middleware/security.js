// ===== NexusBox Security Layer =====
const crypto = require('crypto');

// 1. Input Sanitization
const sanitizeInput = (input) => {
  if (!input) return '';
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// 2. Email Validation
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// 3. Username Validation
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 30) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(username);
};

// 4. Password Validation
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
};

// 5. IP Validation
const isValidIP = (ip) => {
  if (!ip) return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const num = parseInt(p);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
};

// 6. Security Logger
const securityLog = (type, details, req) => {
  const timestamp = new Date().toISOString();
  const ip = req ? (req.ip || req.connection.remoteAddress) : 'unknown';
  const entry = {
    timestamp,
    type,
    ip,
    details,
    userAgent: req ? req.headers['user-agent'] : ''
  };
  console.log('🔒 SECURITY:', JSON.stringify(entry));
  return entry;
};

// 7. Failed Login Tracker
const failedLogins = new Map();

const trackFailedLogin = (username, ip) => {
  const key = ip + ':' + username;
  const record = failedLogins.get(key) || { count: 0, lastAttempt: 0 };
  record.count++;
  record.lastAttempt = Date.now();
  failedLogins.set(key, record);
  
  const oneHourAgo = Date.now() - 3600000;
  for (const [k, v] of failedLogins.entries()) {
    if (v.lastAttempt < oneHourAgo) failedLogins.delete(k);
  }
  
  return record.count;
};

const isBlockedByFailedLogins = (username, ip) => {
  const key = ip + ':' + username;
  const record = failedLogins.get(key);
  return record && record.count >= 10;
};

const clearFailedLogins = (username, ip) => {
  const key = ip + ':' + username;
  failedLogins.delete(key);
};

// 8. Request Validation Middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const data = req.body || {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && (!value || value === '')) {
        errors.push(field + ' is required');
      }
      
      if (value && rules.type === 'email' && !isValidEmail(value)) {
        errors.push(field + ' must be a valid email');
      }
      
      if (value && rules.type === 'username' && !isValidUsername(value)) {
        errors.push(field + ' must be 3-30 chars, alphanumeric only');
      }
      
      if (value && rules.type === 'password' && !isValidPassword(value)) {
        errors.push(field + ' must be 6-128 characters');
      }
      
      if (value && rules.type === 'ip' && !isValidIP(value)) {
        errors.push(field + ' must be a valid IP');
      }
      
      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors.push(field + ' exceeds max length of ' + rules.maxLength);
      }
      
      if (value && rules.minLength && value.length < rules.minLength) {
        errors.push(field + ' must be at least ' + rules.minLength + ' characters');
      }
      
      if (value && rules.enum && !rules.enum.includes(value)) {
        errors.push(field + ' must be one of: ' + rules.enum.join(', '));
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

// 9. Suspicious Request Detector
const detectSuspicious = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const path = req.path || '';
  
  const suspiciousPatterns = [
    /\.\./,           
    /<script/i,         
    /javascript:/i,     
    /eval\(/,          
    /union.*select/i,   
    /etc\/passwd/i,    
    /wp-admin/i,        
    /phpmyadmin/i,      
    /\.env/i,          
    /\.git/i           
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path) || pattern.test(userAgent)) {
      securityLog('SUSPICIOUS_REQUEST', { path, pattern: pattern.toString() }, req);
      return res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
    }
  }
  
  next();
};

// 10. Generate CSRF Token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidIP,
  securityLog,
  trackFailedLogin,
  isBlockedByFailedLogins,
  clearFailedLogins,
  validateRequest,
  detectSuspicious,
  generateCSRFToken
};
