import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import mongoose from 'mongoose';
import { setIO } from './utils/realtime.js';
import { getCachedUser, setCachedUser } from './utils/userCache.js';
import { AuthUser } from './types/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1); // state is undefined after this; let the supervisor (Render/Docker) restart cleanly
});
import taskRoutes from './routes/taskRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import User from './models/User.js';
import { seed } from './seed.js';
import { seedDefaults } from './services/settingsService.js';

// Connect to Database
await connectDB();

// Auto-seed the small demo dataset if the database is empty (AUTO_SEED=false to disable)
const hasUsers = await User.exists({});
if (!hasUsers && process.env.AUTO_SEED !== 'false') {
  logger.info('Database empty — seeding...');
  await seed();
}

// Seed default settings
await seedDefaults();

const app = express();
const server = http.createServer(app);

// Behind Render/Nginx every request arrives from the proxy IP unless this is set,
// which would put all users in one rate-limit bucket.
if (env.trustProxy) app.set('trust proxy', env.trustProxy);

// Security & performance middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: env.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Logging
if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Advidus Premium RBAC & Task Manager API is running',
    version: '2.0.0',
    environment: env.nodeEnv,
    serverTime: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/tasks/:taskId/comments', commentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO
const io = new SocketIOServer(server, {
  path: '/ws',
  maxHttpBufferSize: 1e5, // clients only receive; cap what they can send
  cors: {
    origin: env.corsOrigin,
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const header = socket.handshake.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new Error('Not authorized, no token'));
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    let user = getCachedUser(decoded.id);
    if (!user) {
      const found = await User.findById(decoded.id).select('role status').lean();
      if (!found) return next(new Error('Not authorized, user not found'));
      if (found.status === 'inactive') return next(new Error('Account inactive'));
      user = found as unknown as AuthUser;
      setCachedUser(decoded.id, user);
    }

    (socket as any).user = user;
    next();
  } catch {
    next(new Error('Not authorized, token failed'));
  }
});

// Rooms: every user joins `user:<id>`; admins also join `admins`. Events are emitted to rooms only (utils/realtime.ts).
io.on('connection', (socket) => {
  const user = (socket as any).user as AuthUser | undefined;
  if (user) {
    socket.join(`user:${user._id.toString()}`);
    if (user.role === 'admin') socket.join('admins');
  }
});

setIO(io);

server.listen(env.port, () => {
  logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
});

// Graceful shutdown: stop accepting, let in-flight requests finish, close sockets + DB, then exit.
const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  io.close(() => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
