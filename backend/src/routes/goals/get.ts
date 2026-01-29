import { getModels } from '../../models/index.js';

export async function getGoals(req, res) {
  try {
    const { Goal } = await getModels();
    const goals = await Goal.findAll({
      attributes: ['id', 'period_type', 'period_start', 'amount', 'created_at', 'updated_at'],
      order: [['period_start', 'DESC']],
      raw: true
    });
    res.json({ goals });
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
}
