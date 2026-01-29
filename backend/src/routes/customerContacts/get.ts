import { getModels } from '../../models/index.js';

export async function getCustomerContacts(req, res) {
  try {
    const { CustomerContact } = await getModels();
    const { customer_id: customerId } = req.query;
    const where = customerId ? { customer_id: customerId } : undefined;
    const contacts = await CustomerContact.findAll({
      where,
      order: [['id', 'DESC']],
      raw: true
    });
    res.json({ contacts });
  } catch (error) {
    console.error('Failed to fetch customer contacts:', error);
    res.status(500).json({ error: 'Failed to fetch customer contacts' });
  }
}
