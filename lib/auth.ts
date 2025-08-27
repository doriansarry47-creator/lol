import { storage } from './storage.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { InsertUser, User } from '../shared/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'a-secret-for-development';
const COOKIE_NAME = 'auth_token';

export interface AuthUser {
  id: string;
  email: string;
  role: string | null;
}

// --- JWT and Cookie Utilities ---

export function signJwt(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(res: VercelResponse, user: AuthUser) {
  const token = signJwt(user);
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res: VercelResponse) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
  });
  res.setHeader('Set-Cookie', cookie);
}

// --- Authentication Service Logic ---

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async register(userData: InsertUser): Promise<AuthUser> {
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = await this.hashPassword(userData.password);
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
  }

  static async login(email: string, password: string): Promise<AuthUser> {
    const user = await storage.getUserByEmail(email);
    if (!user || !user.isActive) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}

// --- Middleware for Serverless Functions ---

type ApiHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req, res) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'Authentication requis' });
    }

    const user = verifyJwt(token);
    if (!user) {
      return res.status(401).json({ message: 'Token non valide' });
    }

    // Attach user to request object for use in the handler
    (req as any).user = user;
    return handler(req, res);
  };
}

export function withAdminAuth(handler: ApiHandler): ApiHandler {
  return withAuth(async (req, res) => {
    const user = (req as any).user as AuthUser;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès administrateur requis' });
    }
    return handler(req, res);
  });
}
