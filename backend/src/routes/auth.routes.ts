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

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in
 *     description: Rate-limited to 20 attempts per 15 minutes per IP.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: analyst }
 *               password: { type: string, example: Analyst@123 }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     username: { type: string }
 *                     name: { type: string }
 *       401:
 *         description: Invalid username or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', loginLimiter, login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: The user derived from the JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     username: { type: string }
 *                     name: { type: string }
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/me', requireAuth, me);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out
 *     description: >
 *       JWTs are stateless, so there is no server-side session to revoke — this exists so a
 *       real endpoint is available to call on sign-out. The token is discarded client-side
 *       either way, which is what actually ends the session.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/logout', requireAuth, logout);

export default router;
