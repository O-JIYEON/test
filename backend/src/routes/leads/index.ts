import { Router } from 'express';
import { getLeads, getLeadsSchema } from './get.js';
import { createLead } from './create.js';
import { updateLead } from './update.js';
import { deleteLead } from './delete.js';

const router = Router();

router.get('/', getLeads);
router.get('/schema', getLeadsSchema);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
