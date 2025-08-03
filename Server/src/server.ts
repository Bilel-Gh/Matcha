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
});

const gracefulShutdown = (signal: string) => {
  server.close(() => {
    socketManager.shutdown();

    setTimeout(() => {
      process.exit(0);
    }, 10000);
  });

  setTimeout(() => {
    process.exit(1);
  }, 15000);
};

// Handle process termination signals
process.on('SIGTERM', signal => {
  gracefulShutdown(signal);
});

process.on('SIGINT', signal => {
  gracefulShutdown(signal);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 UNCAUGHT EXCEPTION - Server shutting down', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 UNHANDLED REJECTION - Server shutting down', {
    reason,
    promise: promise.toString()
  });
  gracefulShutdown('UNHANDLED_REJECTION');
});
