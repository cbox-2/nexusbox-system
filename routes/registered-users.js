const express = require('express');
const { RegisteredUser } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { srch, srchin } = req.query;
    let query = { owner: req.userId };
    
    if (srch && srchin) {
      if (srchin === 'nme') {
        query.name = { $regex: srch, $options: 'i' };
      } else if (srchin === 'lastip') {
        query.lastIP = { $regex: srch, $options: 'i' };
      }
    }
    
    const users = await RegisteredUser.find(query).sort({ registeredAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { uname, pword, lvl } = req.body;
    
    if (!uname || !pword) {
      return res.status(400).json({ success: false, error: 'Name and password required' });
    }
    
    const existing = await RegisteredUser.findOne({ owner: req.userId, name: uname });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username exists' });
    }
    
    const level = parseInt(lvl) || 2;
    if (![2, 3, 4, 5].includes(level)) {
      return res.status(400).json({ success: false, error: 'Invalid level' });
    }
    
    const user = new RegisteredUser({
      owner: req.userId,
      name: uname,
      password: pword,
      level: level
    });
    
    await user.save();
    res.status(201).json({ success: true, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { action, ids } = req.body;
    
    if (!action || !ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }
    
    switch (action) {
      case 'delete':
        const result = await RegisteredUser.deleteMany({ _id: { $in: ids }, owner: req.userId });
        res.json({ success: true, message: `Deleted ${result.deletedCount} user(s)` });
        break;
      case 'voice':
        await RegisteredUser.updateMany({ _id: { $in: ids }, owner: req.userId }, { $set: { voiced: true } });
        res.json({ success: true, message: 'Voiced users' });
        break;
      case 'unvoice':
        await RegisteredUser.updateMany({ _id: { $in: ids }, owner: req.userId }, { $set: { voiced: false } });
        res.json({ success: true, message: 'Unvoiced users' });
        break;
      case 'mod':
        await RegisteredUser.updateMany({ _id: { $in: ids }, owner: req.userId }, { $set: { level: 3 } });
        res.json({ success: true, message: 'Mod status set' });
        break;
      case 'unmod':
        await RegisteredUser.updateMany({ _id: { $in: ids }, owner: req.userId }, { $set: { level: 2 } });
        res.json({ success: true, message: 'Mod status removed' });
        break;
      case 'admin':
        await RegisteredUser.updateMany({ _id: { $in: ids }, owner: req.userId }, { $set: { level: 4 } });
        res.json({ success: true, message: 'Admin status set' });
        break;
      case 'unadmin':
        await RegisteredUser.updateMany({ _id: { $in: ids }, owner: req.userId }, { $set: { level: 2 } });
        res.json({ success: true, message: 'Admin status removed' });
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await RegisteredUser.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
