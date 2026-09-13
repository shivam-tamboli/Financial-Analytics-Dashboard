import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getUserSummary } from '../controllers/users.controller';

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/users/{id}/summary:
 *   get:
 *     summary: A single user's totals
 *     description: >
 *       `id` is the transaction dataset's user_id (e.g. "user_001"), not a login
 *       account. revenue/expenses/balance are Paid-only; transactionCount counts
 *       every transaction for that user regardless of status.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: user_001 }
 *     responses:
 *       200:
 *         description: User summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id: { type: string }
 *                 user_name: { type: string }
 *                 revenue: { type: number }
 *                 expenses: { type: number }
 *                 balance: { type: number }
 *                 transactionCount: { type: integer }
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: No transactions found for that user id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id/summary', getUserSummary);

export default router;
