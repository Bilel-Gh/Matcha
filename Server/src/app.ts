import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import photoRoutes from './routes/photos';
import interestRoutes from './routes/interests';
import userInterestRoutes from './routes/userInterests';
import locationRoutes from './routes/location';
import fameRatingRoutes from './routes/fameRating';
import browsingRoutes from './routes/browsing';
import interactionRoutes from './routes/interactions';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notifications';
import { protect } from './middlewares/auth';
import { errorHandler } from './middlewares/errorHandler';
import { swaggerOptions } from './config/swagger';
import config from './config/config';

const app = express();

// Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for photos with custom headers for CORS policy
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: function (res, path, stat) {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Matcha API is running!',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile/photos', photoRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/profile/interests', userInterestRoutes);
app.use('/api', locationRoutes);
app.use('/api/profile/fame-rating', fameRatingRoutes);
app.use('/api/browse', browsingRoutes);
app.use('/api/search', browsingRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Protected test route
app.get('/api/protected', protect, (req, res) => {
  res.json({
    status: 'success',
    message: `Hello ${req.user?.username}!`,
    user: {
      id: req.user?.id,
      username: req.user?.username,
      email: req.user?.email,
    }
  });
});

// Handle 404 errors
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

export default app;
