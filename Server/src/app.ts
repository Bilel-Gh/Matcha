import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
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
