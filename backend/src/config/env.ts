import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  logLevel: string;
  trustProxy: number; // reverse-proxy hops in front of the app (Render/Nginx = 1); 0 = direct
}

function validateEnv(): EnvConfig {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please create a .env file based on .env.example'
    );
  }

  return {
    port: parseInt(process.env.PORT || '5050', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5180',
    logLevel: process.env.LOG_LEVEL || 'debug',
    trustProxy: parseInt(process.env.TRUST_PROXY || '0', 10) || 0,
  };
}

export const env = validateEnv();
