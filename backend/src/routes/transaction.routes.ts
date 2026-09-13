import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  exportTransactionsCsv,
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
 *     summary: Dashboard summary — totals, category breakdown, monthly/yearly trend, recent transactions
 *     description: >
 *       Accepts the same filters as the list endpoint (no pagination/sort). Revenue, expenses,
 *       balance and savings only ever count Paid transactions, regardless of any status filter
 *       passed — Pending transactions never affect a financial total, only the recent-transactions
 *       list, which additionally accepts filterBy/user/month/year.
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Revenue, Expense] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Paid, Pending, completed, pending] }
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
 *         name: amountMin
 *         schema: { type: number }
 *       - in: query
 *         name: amountMax
 *         schema: { type: number }
 *       - in: query
 *         name: filterBy
 *         schema: { type: string, enum: [date, status, user, month, year] }
 *         description: Which dimension to narrow the recentTransactions list by. Optional — status/user/month/year below work whether or not this is set, and can be combined.
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *         description: Matches user_id exactly or user_name as a substring, for recentTransactions only.
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *         description: For recentTransactions only.
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2024 }
 *         description: For recentTransactions only.
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
 *                     savings: { type: number }
 *                 categoryBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string }
 *                       total: { type: number }
 *                       count: { type: integer }
 *                 monthlyTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month: { type: string, example: '2024-01' }
 *                       income: { type: number }
 *                       expense: { type: number }
 *                 yearly:
 *                   type: object
 *                   description: Keyed by year, e.g. "2024". Only years with data are included; every year always has all 12 months.
 *                 recentTransactions:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Transaction' }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/summary', getTransactionSummary);

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

export default router;
