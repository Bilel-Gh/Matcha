import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth';
import { protect } from './middlewares/auth';
import { swaggerOptions } from './config/swagger';

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Matcha API is running!' });
});

app.use('/api/auth', authRoutes);

app.get('/api/protected', protect, (req, res) => {
    res.json({ message: `Hello user ${req.user?.id}` });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
