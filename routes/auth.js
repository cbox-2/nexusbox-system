const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (password.length < 6) return res.status(400).json({ success: false, error: 'Password min 6 chars' });
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ success: false, error: 'Username/email exists' });
    const user = new User({ username, email, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, user: user.toJSON(), token });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    const isMatch = await user.comparePassword(password);
    if (user.status !== 'active') return res.status(403).json({ success: false, error: 'Account not active' });
    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: user.toJSON(), token });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.get('/me', authMiddleware, (req, res) => { res.json({ success: true, user: req.user.toJSON() }); });
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try { const users = await User.find().sort({ createdAt: -1 }); res.json({ success: true, count: users.length, users }); }
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user: user.toJSON() });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.put('/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, user: user.toJSON() });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
module.exports = router;
