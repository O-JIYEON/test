import { Router } from 'express';
import { getLookupValues } from './get.js';
import { createLookupValue } from './create.js';
import { updateLookupValue } from './update.js';
import { deleteLookupValue } from './delete.js';

const router = Router();

router.get('/', getLookupValues);
router.post('/', createLookupValue);
router.put('/:id', updateLookupValue);
router.delete('/:id', deleteLookupValue);

export default router;
