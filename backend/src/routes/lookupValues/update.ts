import { getModels } from '../../models/index.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function updateLookupValue(req, res) {
  try {
    const { LookupValue } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing value id' });
      return;
    }
    const columns = await getWritableColumns('lookup_values', ['created_at', 'updated_at', 'id']);
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
    const [updated] = await LookupValue.update(data, { where: { id } });
    res.json({ updated });
  } catch (error) {
    console.error('Failed to update lookup value:', error);
    res.status(500).json({ error: 'Failed to update lookup value' });
  }
}
