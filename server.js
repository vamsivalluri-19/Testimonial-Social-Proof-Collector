require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down...', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Start Server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Proofly Backend API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`[Server] Base URL: http://localhost:${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION] Shutting down server...', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
