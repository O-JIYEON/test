import { Router } from 'express';
import { getLookupCategories } from './get.js';
import { createLookupCategory } from './create.js';
import { updateLookupCategory } from './update.js';
import { deleteLookupCategory } from './delete.js';

const router = Router();

router.get('/', getLookupCategories);
router.post('/', createLookupCategory);
router.put('/:id', updateLookupCategory);
router.delete('/:id', deleteLookupCategory);

export default router;
