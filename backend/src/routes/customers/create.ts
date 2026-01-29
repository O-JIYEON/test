import { getModels } from '../../models/index.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function createCustomers(req, res) {
  try {
    const { Customer } = await getModels();
    const columns = await getWritableColumns('customers', ['created_at', 'updated_at']);
    const payload = req.body || {};
    const entries = columns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!entries.length) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const brnEntry = entries.find((entry) => entry.name === 'business_registration_number');
    if (brnEntry?.value) {
      const existing = await Customer.findOne({
        where: { business_registration_number: brnEntry.value },
        attributes: ['id']
      });
      if (existing) {
        res.status(409).json({ error: 'Duplicate business registration number' });
        return;
      }
    }

    const data = Object.fromEntries(entries.map((entry) => [entry.name, entry.value]));
    const created = await Customer.create(data, { fields: entries.map((entry) => entry.name) });
    res.status(201).json({ id: created.id ?? created.get('id') });
  } catch (error) {
    console.error('Failed to create customers:', error);
    res.status(500).json({ error: 'Failed to create customers' });
  }
}
