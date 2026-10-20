import mongoose from 'mongoose';
import { logger } from './logger.js';
import { env } from './env.js';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      // Index builds on a live 60k+ collection must be a deploy step (`npm run indexes`), not a boot side-effect.
      autoIndex: env.nodeEnv !== 'production',
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err });
});
