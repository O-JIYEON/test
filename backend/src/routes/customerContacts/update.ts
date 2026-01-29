import { getModels } from '../../models/index.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function updateCustomerContact(req, res) {
  try {
    const { CustomerContact } = await getModels();
    const { id } = req.params;
    const columns = await getWritableColumns('customer_contacts', ['id', 'created_at', 'updated_at']);
    const payload = req.body || {};
    const entries = columns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing contact id' });
      return;
    }

    if (!entries.length) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const data = Object.fromEntries(entries.map((entry) => [entry.name, entry.value]));
    const [updated] = await CustomerContact.update(data, { where: { id } });
    res.json({ updated });
  } catch (error) {
    console.error('Failed to update customer contact:', error);
    res.status(500).json({ error: 'Failed to update customer contact' });
  }
}
