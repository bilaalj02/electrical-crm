require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/database');
const emailRoutes = require('./routes/emailRoutes');
const jobRoutes = require('./routes/jobRoutes');
const clientRoutes = require('./routes/clientRoutes');
const authRoutes = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauth');
const emailApiRoutes = require('./routes/emails');
const automationRoutes = require('./routes/automation');
const invitationRoutes = require('./routes/invitationRoutes');
const projectRoutes = require('./routes/projectRoutes');
const photoRoutes = require('./routes/photoRoutes');
const diagramRoutes = require('./routes/diagramRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
// const emailSyncService = require('./services/emailSyncService'); // Disabled - using new OAuth system

const app = express();

app.set('trust proxy', 1); // Railway sits behind a proxy — needed for rate-limit/IP detection to see the real client IP

app.use(helmet());

// CORS: only the real frontend origins, not a wildcard — the API is
// authenticated with a Bearer token (not cookies), so wildcard CORS doesn't
// enable classic cookie-based CSRF, but it does let any website make
// requests using a token it obtained some other way (e.g. XSS elsewhere),
// and offers no protection against automated scraping/abuse.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://meselectrical-crm.vercel.app', // hardcoded as a guaranteed fallback — FRONTEND_URL on Railway turned out not to match this exactly, which took the live site's login down until this was added
  'http://localhost:5174',
  'http://localhost:5173'
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  }
}));

// Brute-force protection on login — the only unauthenticated endpoint where
// an attacker gets to guess a secret. 10 attempts per 15 min per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);

// General abuse/DoS guardrail on everything else — generous enough to
// never bother a real user, just to stop unbounded scripted abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Block NoSQL operator injection (e.g. ?status[$ne]=x, or the same in a
// JSON body), which the qs/body parsers happily turn into real MongoDB
// query operators once assigned into a filter object.
//
// req.body and req.params are stable, mutable objects in Express 5, so
// mongoSanitize.sanitize()'s in-place mutation works on them directly.
// req.query is different: Express 5 made it a getter that re-parses the
// query string fresh on every access (verified directly — two reads of
// req.query in the same request return different object instances), so
// mutating one snapshot has no effect on what route handlers see later,
// and there's no setter to reassign it either. For query specifically we
// detect and reject instead of trying to silently sanitize a moving target
// — arguably the more defensible behavior anyway for something that looks
// like an injection attempt.
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query && mongoSanitize.has(req.query)) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }
  next();
});

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
app.use('/api/automation', automationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/diagrams', diagramRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar-events', calendarRoutes);
app.use('/api/integrations', integrationRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

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
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Not allowed by CORS' });
  }
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
