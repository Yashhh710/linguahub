const path = require('path');
const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const rateLimit = require('./middleware/rateLimit');

function createApp() {
  const app = express();

  app.use(cors(env.corsOrigins.length ? { origin: env.corsOrigins } : {}));
  app.use(express.json({ limit: '200kb' }));

  // Basic hardening headers without pulling in helmet.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use('/api/auth/login', rateLimit({ windowMs: 60_000, max: 10 }));
  app.use('/api/auth/register', rateLimit({ windowMs: 60_000, max: 10 }));
  app.use('/api/lessons/generate', rateLimit({ windowMs: 60_000, max: 6 }));
  app.use('/api/quizzes/generate', rateLimit({ windowMs: 60_000, max: 6 }));

  app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'LinguaHub API', time: new Date().toISOString() } }));
  app.get('/api/config/public', (req, res) => res.json({ success: true, data: { firebase: env.firebaseWeb } }));

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/lessons', require('./routes/lessonRoutes'));
  app.use('/api/quizzes', require('./routes/quizRoutes'));
  app.use('/api/progress', require('./routes/progressRoutes'));
  app.use('/api/streaks', require('./routes/streakRoutes'));
  app.use('/api/voice', require('./routes/voiceRoutes'));
  app.use('/api/achievements', require('./routes/achievementRoutes'));
  app.use('/api/friends', require('./routes/friendRoutes'));
  app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api', notFound);

  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
