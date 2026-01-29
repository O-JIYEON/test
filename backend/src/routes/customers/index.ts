import { Router } from 'express';
import { getCustomers, getCustomersSchema } from './get.js';
import { createCustomers } from './create.js';
import { updateCustomers } from './update.js';
import { deleteCustomers } from './delete.js';

const router = Router();

router.get('/', getCustomers);
router.get('/schema', getCustomersSchema);
router.post('/', createCustomers);
router.put('/:id', updateCustomers);
router.delete('/:id', deleteCustomers);

export default router;
