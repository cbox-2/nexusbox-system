const Box = require('../models/Box');
const ActivityLog = require('../models/ActivityLog');
const Message = require('../models/Message');
const RegisteredUser = require('../models/RegisteredUser');

// Create new box
exports.createBox = async (req, res) => {
  try {
    const { name, theme, layout, settings } = req.body;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Box name must be at least 3 characters' 
      });
    }
    
    // Check box limit (10 boxes per user)
    const boxCount = await Box.countDocuments({ ownerId: req.userId });
    if (boxCount >= 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 10 boxes per user' 
      });
    }
    
    const box = new Box({
      name: name.trim(),
      ownerId: req.userId,
      theme: theme || {},
      layout: layout || {},
      settings: settings || {}
    });
    
    await box.save();
    
    await ActivityLog.create({
      userId: req.userId,
      boxId: box._id,
      action: 'create_box',
      details: { boxName: box.name },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({ 
      success: true, 
      box: box.toJSON() 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Box name already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get all boxes for current user
exports.getMyBoxes = async (req, res) => {
  try {
    const boxes = await Box.find({ ownerId: req.userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json({ 
      success: true, 
      count: boxes.length, 
      boxes 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get single box
exports.getBox = async (req, res) => {
  try {
    const box = await Box.findOne({ 
      _id: req.params.id, 
      ownerId: req.userId 
    });
    
    if (!box) {
      return res.status(404).json({ 
        success: false, 
        error: 'Box not found' 
      });
    }
    
    res.json({ 
      success: true, 
      box 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Update box
exports.updateBox = async (req, res) => {
  try {
    const box = await Box.findOne({ 
      _id: req.params.id, 
      ownerId: req.userId 
    });
    
    if (!box) {
      return res.status(404).json({ 
        success: false, 
        error: 'Box not found' 
      });
    }
    
    const allowedUpdates = ['name', 'theme', 'layout', 'publish', 'settings', 'status'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    Object.assign(box, updates);
    await box.save();
    
    await ActivityLog.create({
      userId: req.userId,
      boxId: box._id,
      action: 'update_box',
      details: { updatedFields: Object.keys(updates) },
      ip: req.ip
    });
    
    res.json({ 
      success: true, 
      box 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Delete box
exports.deleteBox = async (req, res) => {
  try {
    const box = await Box.findOneAndDelete({ 
      _id: req.params.id, 
      ownerId: req.userId 
    });
    
    if (!box) {
      return res.status(404).json({ 
        success: false, 
        error: 'Box not found' 
      });
    }
    
    // Delete all related data
    await Promise.all([
      Message.deleteMany({ boxId: box._id }),
      RegisteredUser.deleteMany({ boxId: box._id })
    ]);
    
    await ActivityLog.create({
      userId: req.userId,
      boxId: box._id,
      action: 'delete_box',
      details: { boxName: box.name },
      ip: req.ip
    });
    
    res.json({ 
      success: true, 
      message: 'Box deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get box stats
exports.getBoxStats = async (req, res) => {
  try {
    const box = await Box.findOne({ 
      _id: req.params.id, 
      ownerId: req.userId 
    });
    
    if (!box) {
      return res.status(404).json({ 
        success: false, 
        error: 'Box not found' 
      });
    }
    
    const [totalMessages, totalUsers] = await Promise.all([
      Message.countDocuments({ boxId: box._id }),
      RegisteredUser.countDocuments({ boxId: box._id })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalMessages,
        totalUsers,
        totalViews: box.stats.totalViews || 0,
        createdAt: box.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Admin: Get all boxes
exports.getAllBoxes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const [boxes, total] = await Promise.all([
      Box.find()
        .populate('ownerId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Box.countDocuments()
    ]);
    
    res.json({
      success: true,
      count: boxes.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      boxes
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get box by embedKey (for embed system)
exports.getBoxByEmbedKey = async (req, res) => {
  try {
    const box = await Box.findOne({ 
      embedKey: req.params.embedKey,
      status: 'active',
      'publish.enabled': true
    }).select('-__v');
    
    if (!box) {
      return res.status(404).json({ 
        success: false, 
        error: 'Box not found or disabled' 
      });
    }
    
    // Increment views
    await Box.findByIdAndUpdate(box._id, { $inc: { 'stats.totalViews': 1 } });
    
    res.json({ 
      success: true, 
      box: {
        id: box._id,
        name: box.name,
        theme: box.theme,
        layout: box.layout,
        settings: box.settings
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
