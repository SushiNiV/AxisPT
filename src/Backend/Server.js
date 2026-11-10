require('dotenv').config(); // load env first, once, before anything reads process.env

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db'); // adjust path if your db.js lives elsewhere
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const avatarRoutes = require('./routes/avatarRoutes');
const authController = require('./controllers/authController');
const notificationRoutes = require('./routes/notificationRoute'); // <-- Matches your singular file name
const notificationModel = require('./models/notificationModel'); // <-- ADDED for cleanup job

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.BACK_PORT || 5000;

const app = express();

// If deployed behind a proxy (Render, Railway, Nginx...), set TRUST_PROXY=1
// so rate limiting sees the real client IP instead of the proxy's.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

// ---------- Security & performance ----------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

// CORS_ORIGINS="https://app.example.com,http://localhost:5173"
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (isProd && allowedOrigins.length === 0) {
  console.warn('WARNING: CORS_ORIGINS is not set; allowing all origins.');
}

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
}));

// ---------- Avatars ----------
// Must be mounted BEFORE the global express.json(), because the avatar router
// has its own larger body limit (see avatarRoutes.js).
app.use('/api/avatars', avatarRoutes);

app.use(express.json());

// ---------- Auth (rate limited) ----------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                       // 20 attempts per IP per 15 min
  skipSuccessfulRequests: true,  // only failed logins count
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

app.post('/api/auth/login', authLimiter, authController.login);
app.post('/api/auth/google', authLimiter, authController.googleLogin);

// ---------- App routes ----------
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);

// ---------- 404 + error handling ----------
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large.' });
  }
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(err.status || 500).json({
    message: isProd ? 'Internal server error.' : err.message,
  });
});

// ---------- Cleanup Job ----------
// Run at server start, then every 6 hours
const startCleanupJob = () => {
  // Run once on boot
  notificationModel.cleanupOldNotifications().catch(console.error);
  
  // Then every 6 hours
  setInterval(() => {
    notificationModel.cleanupOldNotifications().catch(console.error);
  }, 6 * 60 * 60 * 1000);
};

// ---------- Start + graceful shutdown ----------
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCleanupJob(); // <-- Added here
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));