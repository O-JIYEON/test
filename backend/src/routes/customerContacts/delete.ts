import { getModels } from '../../models/index.js';

export async function deleteCustomerContact(req, res) {
  try {
    const { CustomerContact } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing contact id' });
      return;
    }
    const deleted = await CustomerContact.destroy({ where: { id } });
    res.json({ deleted });
  } catch (error) {
    console.error('Failed to delete customer contact:', error);
    res.status(500).json({ error: 'Failed to delete customer contact' });
  }
}
