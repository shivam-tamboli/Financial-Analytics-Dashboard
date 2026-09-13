import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many login attempts. Please try again later.' } },
});

router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
