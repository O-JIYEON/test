import { getModels } from '../../models/index.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function createLookupCategory(req, res) {
  try {
    const { LookupCategory } = await getModels();
    const columns = await getWritableColumns('lookup_categories', ['created_at', 'updated_at']);
    const payload = req.body || {};
    const entries = columns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!entries.length) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const data = Object.fromEntries(entries.map((entry) => [entry.name, entry.value]));
    const created = await LookupCategory.create(data, { fields: entries.map((entry) => entry.name) });
    res.status(201).json({ id: created.id ?? created.get('id') });
  } catch (error) {
    console.error('Failed to create lookup category:', error);
    res.status(500).json({ error: 'Failed to create lookup category' });
  }
}
