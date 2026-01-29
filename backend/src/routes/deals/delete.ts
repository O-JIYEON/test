import { sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';

export async function deleteDeal(req, res) {
  try {
    const { Deal, ActivityLog } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing deal id' });
      return;
    }

    const result = await sequelize.transaction(async (transaction) => {
      const deletedAt = new Date();
      const [updated] = await Deal.update({ deleted_at: deletedAt }, { where: { id }, transaction });
      await ActivityLog.update({ deleted_at: deletedAt }, { where: { deal_id: id }, transaction });
      return updated;
    });

    res.json({ deleted: result });
  } catch (error) {
    console.error('Failed to delete deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
}
