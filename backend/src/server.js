require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const emailRoutes = require('./routes/emailRoutes');
const jobRoutes = require('./routes/jobRoutes');
const clientRoutes = require('./routes/clientRoutes');
const emailSyncService = require('./services/emailSyncService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Electrical CRM API',
    version: '1.0.0',
    endpoints: {
      emails: '/api/emails',
      jobs: '/api/jobs',
      clients: '/api/clients',
      sync: '/api/emails/sync',
      stats: '/api/emails/stats/summary'
    }
  });
});

app.use('/api/emails', emailRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/clients', clientRoutes);

// OAuth callback routes (for future implementation)
app.get('/auth/gmail/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await emailSyncService.getTokensFromCode('gmail1', code);
    res.json({
      message: 'Gmail authentication successful',
      tokens
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/auth/microsoft/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await emailSyncService.getTokensFromCode('microsoft', code);
    res.json({
      message: 'Microsoft authentication successful',
      tokens
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Start automatic email sync
  if (process.env.AUTO_SYNC !== 'false') {
    console.log('Starting automatic email sync...');
    emailSyncService.startAutoSync();
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  emailSyncService.stopAutoSync();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  emailSyncService.stopAutoSync();
  process.exit(0);
});

module.exports = app;
