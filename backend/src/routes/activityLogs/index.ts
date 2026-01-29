import { Router } from 'express';
import { getActivityLogs } from './get.js';

const router = Router();

router.get('/', getActivityLogs);

export default router;
