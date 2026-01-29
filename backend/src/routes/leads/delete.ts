import { sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';
import { createActivityLog, getLeadLogPayload } from '../_shared/activityLogs.js';

export async function deleteLead(req, res) {
  try {
    const { Lead, Deal, ActivityLog } = await getModels();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing lead id' });
      return;
    }

    const result = await sequelize.transaction(async (transaction) => {
      const leadLogPayload = await getLeadLogPayload(id, transaction);
      if (leadLogPayload) {
        await createActivityLog(leadLogPayload, transaction);
      }
      const deletedAt = new Date();
      const [updated] = await Lead.update({ deleted_at: deletedAt }, { where: { id }, transaction });
      await Deal.update({ deleted_at: deletedAt }, { where: { lead_id: id }, transaction });
      await ActivityLog.update({ deleted_at: deletedAt }, { where: { lead_id: id }, transaction });
      return updated;
    });

    res.json({ deleted: result });
  } catch (error) {
    console.error('Failed to delete lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
}
