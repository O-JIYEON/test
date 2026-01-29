import { Router } from 'express';
import { getGoals } from './get.js';
import { upsertGoal } from './update.js';
import { deleteGoal } from './delete.js';

const router = Router();

router.get('/', getGoals);
router.post('/', upsertGoal);
router.delete('/:id', deleteGoal);

export default router;
