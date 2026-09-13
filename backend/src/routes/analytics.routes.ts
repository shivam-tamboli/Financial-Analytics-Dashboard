import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getCashflow, getKpis } from '../controllers/analytics.controller';

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/analytics/kpis:
 *   get:
 *     summary: Key metrics — revenue, expenses, balance, transaction count, average value, top category
 *     description: Paid-only, same rule as /transactions/summary.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: KPI snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue: { type: number }
 *                 totalExpenses: { type: number }
 *                 balance: { type: number }
 *                 transactionCount: { type: integer }
 *                 averageTransactionValue: { type: number }
 *                 topCategory: { type: string, enum: [Revenue, Expense] }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/kpis', getKpis);

/**
 * @openapi
 * /api/analytics/cashflow:
 *   get:
 *     summary: Monthly cashflow (revenue minus expenses) for the current calendar year
 *     description: >
 *       "Current year" is the real calendar year the server is running in. With the
 *       bundled sample data (all dated 2024), this returns all-zero months unless
 *       the server's clock is actually in 2024.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: 12 months of cashflow for the current year
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year: { type: integer }
 *                 months:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month: { type: string, example: '2026-01' }
 *                       revenue: { type: number }
 *                       expenses: { type: number }
 *                       cashflow: { type: number }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/cashflow', getCashflow);

export default router;
