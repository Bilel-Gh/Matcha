import http from 'http';
import app from './app';
import config from './config/config';
import SocketManager from './config/socket';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const socketManager = new SocketManager(server);

const PORT = config.SERVER_PORT;

server.listen(PORT, () => {
  console.log(`🚀 Matcha server running on port ${PORT}`);
  console.log(`📡 Socket.IO server initialized`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close Socket.IO connections and set users offline
    await socketManager.shutdown();

    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
