import { getModels } from '../../models/index.js';

export async function deleteCustomers(req, res) {
  try {
    const { Customer } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing customer id' });
      return;
    }
    const deleted = await Customer.destroy({ where: { id } });
    res.json({ deleted });
  } catch (error) {
    console.error('Failed to delete customers:', error);
    res.status(500).json({ error: 'Failed to delete customers' });
  }
}
