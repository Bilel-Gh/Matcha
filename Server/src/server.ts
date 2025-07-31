import http from 'http';
import app from './app';
import config from './config/config';
import { SocketManager } from './config/socket';
import logger from './utils/logger';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const socketManager = new SocketManager(server);

// Initialize NotificationService with SocketManager
import { NotificationService } from './services/NotificationService';
NotificationService.setSocketManager(socketManager);

const PORT = config.SERVER_PORT;

server.listen(PORT, () => {
  // Silent server startup - no console output for defense requirements
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  // Silent shutdown handling - no console output for defense requirements
  server.close(() => {
    // Silent server close - no console output for defense requirements
    socketManager.shutdown();

    setTimeout(() => {
      // Silent forced shutdown - no console output for defense requirements
      process.exit(0);
    }, 10000);
  });

  setTimeout(() => {
    // Silent timeout handling - no console output for defense requirements
    process.exit(1);
  }, 15000);
};

// Handle process termination signals
process.on('SIGTERM', signal => {
  // Silent shutdown process - no console output for defense requirements
  gracefulShutdown(signal);
});

process.on('SIGINT', signal => {
  // Silent shutdown process - no console output for defense requirements
  gracefulShutdown(signal);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  // Log SEULEMENT les erreurs critiques 500+ - nécessaire pour le debug
  logger.error('💥 UNCAUGHT EXCEPTION - Server shutting down', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  // Log SEULEMENT les erreurs critiques 500+ - nécessaire pour le debug
  logger.error('💥 UNHANDLED REJECTION - Server shutting down', {
    reason,
    promise: promise.toString()
  });
  gracefulShutdown('UNHANDLED_REJECTION');
});
