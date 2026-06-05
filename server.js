require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'NexusBox is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ name: 'NexusBox', version: '2.0.0' });
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  // Still start server without DB
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (without DB)`);
  });
});
