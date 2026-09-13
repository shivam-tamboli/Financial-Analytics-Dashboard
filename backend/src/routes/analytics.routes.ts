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
 *     description: >
 *       Defaults to Paid-only, same rule as /transactions/summary. Pass `status=Pending`
 *       or `status=all` to compute the same metrics over a different slice — count and
 *       averageTransactionValue always describe the exact same set as revenue/expenses,
 *       whichever status filter is in effect.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Paid, Pending, all], default: Paid }
 *         description: Accepts 'Paid'/'Pending' in any case, plus 'completed' as a synonym for 'Paid'.
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Optional. Scopes all figures to one calendar year (UTC). Omit for all-time totals.
 *     responses:
 *       200:
 *         description: KPI snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     filter: { type: string, enum: [Paid, Pending, all], description: The status filter actually applied. }
 *                     year: { type: integer, nullable: true, description: The year requested, or null when all-time. }
 *                     revenue: { type: number }
 *                     expenses: { type: number }
 *                     balance: { type: number }
 *                     transactionCount: { type: integer }
 *                     averageTransactionValue: { type: number }
 *                     topCategory: { type: string, enum: [Revenue, Expense] }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/kpis', getKpis);

/**
 * @openapi
 * /api/analytics/cashflow:
 *   get:
 *     summary: Monthly cashflow (revenue minus expenses) for a year
 *     description: >
 *       Defaults to Paid-only and to the most recent year that has data under that
 *       status filter — not the real calendar year the server is running in, which
 *       would return 12 zeroed months against a fixed sample dataset. Pass `year` to
 *       request a specific year explicitly, or `status` to change which transactions
 *       count.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2024 }
 *         description: Defaults to the latest year with data under the given status filter.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Paid, Pending, all], default: Paid }
 *     responses:
 *       200:
 *         description: 12 months of cashflow for the resolved year
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     year: { type: integer, example: 2024 }
 *                     filter: { type: string, enum: [Paid, Pending, all] }
 *                     months:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month: { type: string, example: '2024-01' }
 *                           revenue: { type: number }
 *                           expenses: { type: number }
 *                           cashflow: { type: number }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/cashflow', getCashflow);

export default router;
