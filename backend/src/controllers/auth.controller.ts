import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'Invalid username or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid username or password');
  }

  const token = signToken({ sub: user.id, username: user.username, name: user.name });

  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  res.json({ user: { id: req.user.sub, username: req.user.username, name: req.user.name } });
});

// JWTs are stateless and carry no server-side session to revoke, so there is
// nothing to invalidate here — this exists so a login/logout pair is present
// server-side too, and to give the frontend one place to call on sign-out.
// The frontend's actual logout is still "discard the token client-side,"
// which is what actually ends the session in a stateless-JWT design.
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Logged out. Discard the token client-side.' });
});
