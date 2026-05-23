import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export default generateToken;
