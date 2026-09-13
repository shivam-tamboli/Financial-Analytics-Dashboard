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

router.get('/', listTransactions);
router.get('/summary', getTransactionSummary);
router.get('/users', listTransactionUsers);
router.post('/export', exportTransactionsCsv);

export default router;
