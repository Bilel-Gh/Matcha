import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  NODE_ENV: string | undefined;
  SERVER_PORT: number | undefined;
  DATABASE_URL: string | undefined;
  JWT_SECRET: string | undefined;
  JWT_EXPIRES_IN: string | undefined;
  BCRYPT_SALT_ROUNDS: number | undefined;
  PASSWORD_RESET_EXPIRES_HOURS: number | undefined;
  CORS_ORIGIN: string | undefined;
  FRONTEND_URL: string | undefined;
  EMAIL_FROM: string | undefined;
  EMAIL_SERVICE?: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  SMTP_HOST: string | undefined;
  SMTP_PORT: number | undefined;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV,
  SERVER_PORT: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : undefined ,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  PASSWORD_RESET_EXPIRES_HOURS: parseInt(process.env.PASSWORD_RESET_EXPIRES_HOURS || '1', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  FRONTEND_URL: process.env.FRONTEND_URL,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  SMTP_HOST: process.env.SMTP_HOST,
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
