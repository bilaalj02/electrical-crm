require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const emailRoutes = require('./routes/emailRoutes');
const jobRoutes = require('./routes/jobRoutes');
const clientRoutes = require('./routes/clientRoutes');
const authRoutes = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauth');
const emailApiRoutes = require('./routes/emails');
// const emailSyncService = require('./services/emailSyncService'); // Disabled - using new OAuth system

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5174',
      'http://localhost:3000',
      'https://electrical-crm-beta.vercel.app',
      'https://meselectrical.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove any undefined values

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
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
      auth: '/api/auth',
      emails: '/api/emails',
      jobs: '/api/jobs',
      clients: '/api/clients',
      sync: '/api/emails/sync',
      stats: '/api/emails/stats/summary',
      oauth: '/api/oauth',
      emailSync: '/api/email-sync'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/email-sync', emailApiRoutes);

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

  // Old auto-sync disabled - using new OAuth system
  // if (process.env.AUTO_SYNC !== 'false') {
  //   console.log('Starting automatic email sync...');
  //   emailSyncService.startAutoSync();
  // }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  // emailSyncService.stopAutoSync();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  // emailSyncService.stopAutoSync();
  process.exit(0);
});

module.exports = app;
