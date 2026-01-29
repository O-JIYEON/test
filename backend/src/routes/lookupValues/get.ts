import { Sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';

export async function getLookupValues(req, res) {
  try {
    const { LookupValue, LookupCategory } = await getModels();
    const { category_id: categoryId } = req.query;
    const where = categoryId ? { category_id: categoryId } : undefined;

    const values = await LookupValue.findAll({
      where,
      attributes: [
        'id',
        'category_id',
        'label',
        'department',
        'probability',
        'sort_order',
        'created_at',
        'updated_at',
        [Sequelize.col('category.label'), 'category_label']
      ],
      include: [{ model: LookupCategory, as: 'category', attributes: [], required: true }],
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC']
      ],
      raw: true
    });

    res.json({ values });
  } catch (error) {
    console.error('Failed to fetch lookup values:', error);
    res.status(500).json({ error: 'Failed to fetch lookup values' });
  }
}
