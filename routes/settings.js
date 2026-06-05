const express = require('express');
const { PublishSettings, Theme, LayoutSettings, IntegrationSettings, RegUserSettings } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Publish
router.get('/publish', authMiddleware, async (req, res) => {
  try {
    let settings = await PublishSettings.findOne({ user: req.userId });
    if (!settings) {
      settings = new PublishSettings({
        user: req.userId,
        securityTag: Math.random().toString(36).substring(2, 8).replace(/[uio]/g, 'x')
      });
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/publish', authMiddleware, async (req, res) => {
  try {
    const { siteUrl, whitelistEnabled, whitelist, useSSL, securityTag } = req.body;
    let settings = await PublishSettings.findOne({ user: req.userId });
    if (!settings) settings = new PublishSettings({ user: req.userId });
    if (siteUrl !== undefined) settings.siteUrl = siteUrl;
    if (whitelistEnabled !== undefined) settings.whitelistEnabled = whitelistEnabled;
    if (whitelist !== undefined) settings.whitelist = whitelist;
    if (useSSL !== undefined) settings.useSSL = useSSL;
    if (securityTag !== undefined) settings.securityTag = securityTag;
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/publish/generate-tag', authMiddleware, async (req, res) => {
  try {
    const tag = Math.round(Math.random() * 1838265624).toString(35).replace('u', 'z').replace('i', '5').replace('o', 'w');
    res.json({ success: true, tag });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Theme
router.get('/theme', authMiddleware, async (req, res) => {
  try {
    let theme = await Theme.findOne({ user: req.userId });
    if (!theme) {
      theme = new Theme({ user: req.userId, css: 'body { text-align: left; }' });
      await theme.save();
    }
    res.json({ success: true, theme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/theme', authMiddleware, async (req, res) => {
  try {
    const { css, preset, name } = req.body;
    let theme = await Theme.findOne({ user: req.userId });
    if (!theme) theme = new Theme({ user: req.userId });
    if (css !== undefined) theme.css = css;
    if (preset !== undefined) theme.preset = preset;
    if (name !== undefined) theme.name = name;
    theme.updatedAt = new Date();
    await theme.save();
    res.json({ success: true, theme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/theme/presets', authMiddleware, async (req, res) => {
  try {
    const presets = [
      { id: 13, name: 'Default blue', css: 'body { background: #f0f8ff; }' },
      { id: 11, name: 'Basic transparent', css: 'body { background: transparent; }' },
      { id: 1, name: 'Classic blue', css: 'body { background: #0066cc; color: white; }' },
      { id: 2, name: 'Classic red', css: 'body { background: #cc0000; color: white; }' },
      { id: 3, name: 'Classic yellow', css: 'body { background: #ffcc00; }' },
      { id: 4, name: 'Classic light', css: 'body { background: #ffffff; }' },
      { id: 5, name: 'Classic dark', css: 'body { background: #333333; color: white; }' }
    ];
    res.json({ success: true, presets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Layout
router.get('/layout', authMiddleware, async (req, res) => {
  try {
    let settings = await LayoutSettings.findOne({ user: req.userId });
    if (!settings) {
      settings = new LayoutSettings({ user: req.userId });
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/layout', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    let settings = await LayoutSettings.findOne({ user: req.userId });
    if (!settings) settings = new LayoutSettings({ user: req.userId });
    Object.keys(data).forEach(key => {
      if (settings[key] !== undefined) settings[key] = data[key];
    });
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Integration
router.get('/integration', authMiddleware, async (req, res) => {
  try {
    let settings = await IntegrationSettings.findOne({ user: req.userId });
    if (!settings) {
      const privateKey = Math.random().toString(36).substring(2, 18).replace(/[^a-z0-9]/g, '').substring(0, 16);
      settings = new IntegrationSettings({ user: req.userId, privateKey });
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/integration', authMiddleware, async (req, res) => {
  try {
    const { enabled, autoRegister } = req.body;
    let settings = await IntegrationSettings.findOne({ user: req.userId });
    if (!settings) {
      const privateKey = Math.random().toString(36).substring(2, 18).replace(/[^a-z0-9]/g, '').substring(0, 16);
      settings = new IntegrationSettings({ user: req.userId, privateKey });
    }
    if (enabled !== undefined) settings.enabled = enabled;
    if (autoRegister !== undefined) settings.autoRegister = autoRegister;
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integration/regenerate-key', authMiddleware, async (req, res) => {
  try {
    const newKey = Math.random().toString(36).substring(2, 18).replace(/[^a-z0-9]/g, '').substring(0, 16);
    let settings = await IntegrationSettings.findOne({ user: req.userId });
    if (!settings) {
      settings = new IntegrationSettings({ user: req.userId, privateKey: newKey });
    } else {
      settings.privateKey = newKey;
    }
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, privateKey: newKey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registered User Settings
router.get('/registered-users/settings', authMiddleware, async (req, res) => {
  try {
    let settings = await RegUserSettings.findOne({ user: req.userId });
    if (!settings) {
      settings = new RegUserSettings({ user: req.userId });
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/registered-users/settings', authMiddleware, async (req, res) => {
  try {
    const { regOnly, selfReg, authFacebook, lastPostDel } = req.body;
    let settings = await RegUserSettings.findOne({ user: req.userId });
    if (!settings) settings = new RegUserSettings({ user: req.userId });
    if (regOnly !== undefined) settings.regOnly = regOnly;
    if (selfReg !== undefined) settings.selfReg = selfReg;
    if (authFacebook !== undefined) settings.authFacebook = authFacebook;
    if (lastPostDel !== undefined) settings.lastPostDel = lastPostDel;
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
