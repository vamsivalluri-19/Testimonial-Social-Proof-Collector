const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const publicRoutes = require('./routes/publicRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in dev mode for flexibility
      }
    },
    credentials: true, // Allow httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// General Rate Limiter
app.use('/api', apiLimiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Proofly Backend API',
  });
});

// Static files for web interface & live demo website
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Route Handler
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
