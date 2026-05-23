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
import { setIO, registerUserSocket, unregisterUserSocket } from './utils/realtime.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
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

// Auto-seed if database is empty
const userCount = await User.countDocuments();
if (userCount === 0) {
  logger.info('Database empty — seeding...');
  await seed();
}

// Seed default settings
await seedDefaults();

const app = express();
const server = http.createServer(app);

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
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return next(new Error('Not authorized, user not found'));
    if (user.status === 'inactive') return next(new Error('Account inactive'));

    (socket as any).user = user;
    next();
  } catch {
    next(new Error('Not authorized, token failed'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  if (user) {
    registerUserSocket(user._id.toString(), socket.id);
    if (user.role === 'admin') socket.join('admins');
  }
  socket.on('disconnect', () => {
    if (user) unregisterUserSocket(user._id.toString(), socket.id);
  });
});

setIO(io);

server.listen(env.port, () => {
  logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
});

export default app;
