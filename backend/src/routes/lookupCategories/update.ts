import { getModels } from '../../models/index.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function updateLookupCategory(req, res) {
  try {
    const { LookupCategory } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing category id' });
      return;
    }
    const columns = await getWritableColumns('lookup_categories', ['created_at', 'updated_at', 'id']);
    const payload = req.body || {};
    const updates = columns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!updates.length) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const data = Object.fromEntries(updates.map((entry) => [entry.name, entry.value]));
    const [updated] = await LookupCategory.update(data, { where: { id } });
    res.json({ updated });
  } catch (error) {
    console.error('Failed to update lookup category:', error);
    res.status(500).json({ error: 'Failed to update lookup category' });
  }
}
