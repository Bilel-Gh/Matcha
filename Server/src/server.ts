import app from './app';
import config from './config/config';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const server = app.listen(config.SERVER_PORT, () => {
  console.log(`🚀 Server is running on port ${config.SERVER_PORT}`);
  console.log(`📚 API Documentation: http://localhost:${config.SERVER_PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${config.SERVER_PORT}/health`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');

  server.close(() => {
    console.log('Process terminated!');
  });
});
