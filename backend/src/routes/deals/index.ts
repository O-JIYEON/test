import { Router } from 'express';
import { getDeals } from './get.js';
import { createDeal } from './create.js';
import { updateDeal } from './update.js';
import { deleteDeal } from './delete.js';

const router = Router();

router.get('/', getDeals);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;
