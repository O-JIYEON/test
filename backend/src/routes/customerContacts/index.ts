import { Router } from 'express';
import { getCustomerContacts } from './get.js';
import { createCustomerContact } from './create.js';
import { updateCustomerContact } from './update.js';
import { deleteCustomerContact } from './delete.js';

const router = Router();

router.get('/', getCustomerContacts);
router.post('/', createCustomerContact);
router.put('/:id', updateCustomerContact);
router.delete('/:id', deleteCustomerContact);

export default router;
