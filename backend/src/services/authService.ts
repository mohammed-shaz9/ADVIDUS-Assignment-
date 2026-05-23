import User, { IUserDocument } from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { logActivity } from '../utils/activityLogger.js';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

export interface AuthResult {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  token: string;
  lastLogin?: Date;
}

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResult> => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('User already exists');
  }

  const userCount = await User.countDocuments({});
  const role = userCount === 0 ? 'admin' : 'user';

  const user = await User.create({ name, email, password, role });

  await logActivity(user._id.toString(), 'REGISTER', `User registered successfully as ${role}`);

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    token: generateToken(user._id.toString()),
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status === 'inactive') {
    throw new ForbiddenError('Your account is deactivated. Please contact an admin.');
  }

  user.lastLogin = new Date();
  await user.save();

  await logActivity(user._id.toString(), 'LOGIN', 'User logged in successfully');

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin,
    token: generateToken(user._id.toString()),
  };
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin,
  };
};

const DEMO_NAMES = ['Raj Patel', 'Priya Sharma', 'Amit Singh', 'Sneha Reddy', 'Vikram Joshi'];

export const ensureDemoUsers = async () => {
  const existing = await User.find({ role: 'user' }).limit(5).select('name email');
  const created: string[] = [];
  if (existing.length < 5) {
    const needed = 5 - existing.length;
    for (let i = 0; i < needed; i++) {
      const name = DEMO_NAMES[existing.length + i];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@demo.com`;
      const exists = await User.findOne({ email });
      if (!exists) {
        await User.create({ name, email, password: 'User@123', role: 'user', status: 'active' });
        created.push(email);
      }
    }
  }
  return { message: 'Demo users ensured', created, total: 5 };
};

export const getDemoCredentials = async () => {
  const users = await User.find({ role: 'user' }).limit(5).select('name email role');
  return users.map(u => ({ name: u.name, email: u.email, role: u.role }));
};
