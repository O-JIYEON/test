import { getModels } from '../../models/index.js';

export async function deleteLookupValue(req, res) {
  try {
    const { LookupValue } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing value id' });
      return;
    }
    const deleted = await LookupValue.destroy({ where: { id } });
    res.json({ deleted });
  } catch (error) {
    console.error('Failed to delete lookup value:', error);
    res.status(500).json({ error: 'Failed to delete lookup value' });
  }
}
