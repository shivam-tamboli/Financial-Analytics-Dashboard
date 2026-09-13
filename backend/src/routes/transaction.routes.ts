import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  compareSummaryPeriods,
  exportTransactionsCsv,
  getTransactionById,
  getTransactionStats,
  getTransactionSummary,
  listTransactionUsers,
  listTransactions,
} from '../controllers/transaction.controller';

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     summary: List transactions
 *     description: Paginated, filterable, sortable, searchable transaction list.
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, category, status, user_name], default: date }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches user name/id, category, status, or amount if the term is numeric.
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Revenue, Expense] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Paid, Pending] }
 *         description: Accepts 'Paid'/'Pending' in any case, plus 'completed' as a synonym for 'Paid' — all normalized before hitting the DB.
 *       - in: query
 *         name: userId
 *         schema: { type: string, example: user_002 }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2024 }
 *         description: Scopes to that calendar year. Takes precedence over dateFrom/dateTo if both are given.
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *         description: Narrows `year` to a single month. Ignored without `year`.
 *       - in: query
 *         name: amountMin
 *         schema: { type: number }
 *       - in: query
 *         name: amountMax
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Paginated list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Transaction' }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/', listTransactions);

/**
 * @openapi
 * /api/transactions/summary:
 *   get:
 *     summary: Dashboard summary — totals, category breakdown, yearly/monthly rollup, recent transactions
 *     description: >
 *       Accepts the same filters as the list endpoint (no pagination/sort), including
 *       year/month, which scope revenue/expenses/balance/categoryBreakdown/yearly the
 *       same way dateFrom/dateTo do. Revenue/expenses/balance only ever count Paid
 *       transactions, regardless of any status filter passed. The categoryBreakdown +
 *       yearly rollup are cached in memory briefly; recentTransactions is always live.
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Revenue, Expense] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Paid, Pending] }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2024 }
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *       - in: query
 *         name: amountMin
 *         schema: { type: number }
 *       - in: query
 *         name: amountMax
 *         schema: { type: number }
 *       - in: query
 *         name: filterBy
 *         schema: { type: string, enum: [date, status, user, month, year] }
 *         description: Advisory only — status/user/year/month above apply whether or not this is set.
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *         description: Matches user_id exactly or user_name as a substring, for recentTransactions only.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5, maximum: 50 }
 *         description: How many recentTransactions to return.
 *     responses:
 *       200:
 *         description: Summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     balance: { type: number }
 *                     revenue: { type: number }
 *                     expenses: { type: number }
 *                 categoryBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string }
 *                       total: { type: number }
 *                       count: { type: integer }
 *                 yearly:
 *                   type: object
 *                   description: Keyed by year, e.g. "2024". Only years with data are included. Each year's `monthly` is keyed "YYYY-MM" and always has all 12 months.
 *                 recentTransactions:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Transaction' }
 *                     total: { type: integer }
 *                     limit: { type: integer }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/summary', getTransactionSummary);

/**
 * @openapi
 * /api/transactions/summary/compare:
 *   get:
 *     summary: Compare revenue/expenses/balance between two months
 *     description: >
 *       Defaults to Paid-only — the response's `data.filter` field states exactly
 *       which status was compared, so it's never ambiguous from the numbers alone.
 *       Pass `status=Pending` or `status=all` to compare a different slice instead.
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: periodA
 *         required: true
 *         schema: { type: string, example: '2024-01' }
 *       - in: query
 *         name: periodB
 *         required: true
 *         schema: { type: string, example: '2024-02' }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Paid, Pending, all], default: Paid }
 *     responses:
 *       200:
 *         description: Comparison
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     filter: { type: string, enum: [Paid, Pending, all], description: The status filter actually applied. }
 *                     periodA: { type: object }
 *                     periodB: { type: object }
 *                     difference: { type: object }
 *       400:
 *         description: periodA/periodB not in YYYY-MM format
 *       401:
 *         description: Missing or invalid token
 */
router.get('/summary/compare', compareSummaryPeriods);

/**
 * @openapi
 * /api/transactions/users:
 *   get:
 *     summary: Distinct transacting users, for filter dropdowns
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id: { type: string }
 *                       user_name: { type: string }
 *                       user_profile: { type: string }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/users', listTransactionUsers);

/**
 * @openapi
 * /api/transactions/stats:
 *   get:
 *     summary: Dataset stats — total count, total volume, breakdown by status, breakdown by category
 *     description: >
 *       Defaults to Paid-only, same as every other aggregate endpoint — so
 *       `data.byCategory`'s Revenue/Expense totals match /transactions/summary and
 *       /analytics/kpis exactly under the default. Pass `status=all` to see the
 *       whole dataset including Pending, or `status=Pending` for just that slice.
 *       `data.byStatus` is computed over that same filtered set, so filtering to a
 *       single status makes it a (correct, if unremarkable) single-row breakdown —
 *       use `status=all` if you actually want the Paid-vs-Pending split.
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Paid, Pending, all], default: Paid }
 *     responses:
 *       200:
 *         description: Stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     filter: { type: string, enum: [Paid, Pending, all], description: The status filter actually applied. }
 *                     totalCount: { type: integer }
 *                     totalVolume: { type: number }
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties: { status: { type: string }, count: { type: integer }, total: { type: number } }
 *                     byCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties: { category: { type: string }, count: { type: integer }, total: { type: number } }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/stats', getTransactionStats);

/**
 * @openapi
 * /api/transactions/export:
 *   post:
 *     summary: Export transactions as CSV
 *     description: Streams back a CSV file with Content-Disposition attachment. 404s if no transactions match the given filters.
 *     tags: [Transactions]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               columns:
 *                 type: array
 *                 items: { type: string, enum: [id, date, amount, category, status, user_id, user_name] }
 *                 description: Defaults to all columns if omitted.
 *               filters:
 *                 type: object
 *                 description: Same shape as the list endpoint's filters.
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema: { type: string, format: binary }
 *       404:
 *         description: No transactions match the filters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Missing or invalid token
 */
router.post('/export', exportTransactionsCsv);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a single transaction by its Mongo id
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 66d1f0c9a1b2c3d4e5f60789 }
 *     responses:
 *       200:
 *         description: The transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Transaction' }
 *       400:
 *         description: id is not a valid Mongo ObjectId
 *       404:
 *         description: No transaction with that id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/:id', getTransactionById);

export default router;
