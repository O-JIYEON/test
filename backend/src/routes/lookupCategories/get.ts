import { getModels } from '../../models/index.js';

export async function getLookupCategories(req, res) {
  try {
    const { LookupCategory } = await getModels();
    const categories = await LookupCategory.findAll({
      attributes: ['id', 'label', 'created_at', 'updated_at'],
      order: [['id', 'DESC']],
      raw: true
    });
    res.json({ categories });
  } catch (error) {
    console.error('Failed to fetch lookup categories:', error);
    res.status(500).json({ error: 'Failed to fetch lookup categories' });
  }
}
