import { getModels } from '../../models/index.js';

export async function deleteLookupCategory(req, res) {
  try {
    const { LookupCategory } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing category id' });
      return;
    }
    const deleted = await LookupCategory.destroy({ where: { id } });
    res.json({ deleted });
  } catch (error) {
    console.error('Failed to delete lookup category:', error);
    res.status(500).json({ error: 'Failed to delete lookup category' });
  }
}
