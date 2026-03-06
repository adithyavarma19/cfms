require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');
const facultyRoutes = require('./routes/faculty');
const coursesRoutes = require('./routes/courses');
const formsRoutes = require('./routes/forms');
const responsesRoutes = require('./routes/responses');
const targetsRoutes = require('./routes/targets');
const { validateProductionEnv } = require('./config/env');

function buildCorsOptions() {
  const allowedOrigin = String(process.env.CORS_ORIGIN || '').trim();
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

  if (!isProduction) {
    return { origin: true };
  }

  return {
    origin: (origin, callback) => {
      // Requests without Origin (curl/postman/server-to-server) are allowed.
      if (!origin) return callback(null, true);
      if (origin === allowedOrigin) return callback(null, true);
      return callback(new Error('CORS_ORIGIN_BLOCKED'));
    },
  };
}

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '100kb' }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/faculty', facultyRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api/forms', formsRoutes);
  app.use('/api/responses', responsesRoutes);
  app.use('/api/targets', targetsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    if (err && err.message === 'CORS_ORIGIN_BLOCKED') {
      return res.status(403).json({ error: 'CORS origin not allowed' });
    }
    console.error(err.stack);
    return res.status(500).json({ error: 'Something went wrong!' });
  });

  return app;
}

function startServer() {
  const missingVars = validateProductionEnv(process.env);
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }

  const app = createApp();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, buildCorsOptions, startServer };
