const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errors');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
