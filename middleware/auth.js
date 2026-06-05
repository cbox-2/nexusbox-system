const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (user.status !== 'active') return res.status(403).json({ success: false, error: 'Account not active' });
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required' });
  next();
};
const moderatorMiddleware = (req, res, next) => {
  next();
};
module.exports = { authMiddleware, adminMiddleware, moderatorMiddleware };
