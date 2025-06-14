import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  NODE_ENV: string;
  SERVER_PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: number;
  PASSWORD_RESET_EXPIRES_HOURS: number;
  CORS_ORIGIN: string;
  EMAIL_FROM: string;
  EMAIL_SERVICE?: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  SERVER_PORT: parseInt(process.env.SERVER_PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matcha',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  PASSWORD_RESET_EXPIRES_HOURS: parseInt(process.env.PASSWORD_RESET_EXPIRES_HOURS || '1', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@matcha.com',
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export default config;
