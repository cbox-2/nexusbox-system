const express = require('express');
const { Message, Ban, Channel } = require('../models');
const { authMiddleware, adminMiddleware, moderatorMiddleware } = require('../middleware/auth');
const router = express.Router();
router.get('/messages', authMiddleware, async (req, res) => {
  try { const messages = await Message.find().populate('author', 'username role').sort({ createdAt: -1 }).limit(100); res.json({ success: true, count: messages.length, messages }); }
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { content, channel, isSticky } = req.body;
    const message = new Message({ content, author: req.userId, channel: channel || 'general', isSticky });
    await message.save();
    await message.populate('author', 'username role');
    res.status(201).json({ success: true, message });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.delete('/messages/:id', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.get('/bans', authMiddleware, moderatorMiddleware, async (req, res) => {
  try { const bans = await Ban.find().populate('bannedBy', 'username').sort({ createdAt: -1 }); res.json({ success: true, count: bans.length, bans }); }
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.post('/bans', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { target, reason, expiresAt } = req.body;
    const ban = new Ban({ target, reason: reason || '', bannedBy: req.userId, expiresAt: expiresAt ? new Date(expiresAt) : null });
    await ban.save();
    await ban.populate('bannedBy', 'username');
    res.status(201).json({ success: true, ban });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.delete('/bans/:id', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const ban = await Ban.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ban removed' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.get('/channels', authMiddleware, async (req, res) => {
  try { const channels = await Channel.find().populate('createdBy', 'username').sort({ createdAt: -1 }); res.json({ success: true, count: channels.length, channels }); }
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.post('/channels', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const existing = await Channel.findOne({ name });
    if (existing) return res.status(400).json({ success: false, error: 'Channel exists' });
    const channel = new Channel({ name, description: description || '', createdBy: req.userId });
    await channel.save();
    await channel.populate('createdBy', 'username');
    res.status(201).json({ success: true, channel });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.delete('/channels/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Channel deleted' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
module.exports = router;
