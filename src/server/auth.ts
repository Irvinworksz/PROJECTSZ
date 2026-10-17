import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types.js';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'BARANGAY_IAS_SECURE_JWT_SIGNING_KEY_2026_PROD';
const TOKEN_EXPIRY = '8h';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Signs a tamper-proof JWT token with user identity and role
 */
export function signAuthToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' }
  );
}

/**
 * Safely decodes and validates a JWT token without throwing
 */
export function verifyTokenSafely(token: string): AuthenticatedUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
  } catch {
    return null;
  }
}

/**
 * Middleware: Verifies JWT token and attaches user object to request
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid.',
      code: 'AUTH_TOKEN_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    const dbUser = db.findUserById(decoded.id);

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists or session has expired. Please sign in again.',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role as UserRole,
      fullName: dbUser.full_name
    };
    next();
  } catch (err: any) {
    return res.status(403).json({
      success: false,
      error: 'Session expired or token is invalid. Please sign in again.',
      code: 'AUTH_TOKEN_INVALID'
    });
  }
}

/**
 * Middleware: Enforces Role-Based Access Control (Confidentiality)
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized access.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized attempt to audit log for Non-Repudiation
      db.appendAuditLog({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        actionType: 'RBAC_ACCESS_DENIED',
        category: 'SECURITY',
        severity: 'WARN',
        details: `User with role '${req.user.role}' attempted to access restricted endpoint requiring [${allowedRoles.join(', ')}]`,
        resourceType: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error: `Access Denied: Your account role (${req.user.role}) does not have permission to execute this operation.`,
        code: 'RBAC_FORBIDDEN'
      });
    }

    next();
  };
}
