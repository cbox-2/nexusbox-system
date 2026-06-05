const crypto = require('crypto');

const sanitizeInput = (input) => {
  if (input === null || input === undefined) return '';
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

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const isValidUsername = (username) => {
  if (typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 30) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(username);
};

const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
};

const isValidIP = (ip) => {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const num = parseInt(p, 10);
    return Number.isInteger(num) && num >= 0 && num <= 255;
  });
};

const securityLog = (type, details, req) => {
  const timestamp = new Date().toISOString();
  const ip = req ? (req.ip || 'unknown') : 'unknown';
  const entry = { timestamp, type, ip, details };
  console.log('[SECURITY]', JSON.stringify(entry));
  return entry;
};

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

const detectSuspicious = (req, res, next) => {
  const path = req.path || '';
  const ua = req.headers['user-agent'] || '';
  const combined = path + ' ' + ua;
  
  const patterns = [
    /\.\./,
    /<script/i,
    /javascript:/i,
    /eval\(/i,
    /union.*select/i,
    /etc\/passwd/i,
    /wp-admin/i,
    /phpmyadmin/i,
    /\.env/i,
    /\.git/i,
    /\.htaccess/i,
    /admin\.php/i
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(combined)) {
      securityLog('SUSPICIOUS_REQUEST', { path, pattern: String(pattern) }, req);
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
  }
  
  next();
};

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
  detectSuspicious,
  generateCSRFToken
};
