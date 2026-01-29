import { getModels } from '../../models/index.js';

export async function deleteGoal(req, res) {
  try {
    const { Goal } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing goal id' });
      return;
    }
    const deleted = await Goal.destroy({ where: { id } });
    res.json({ deleted });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
}
