import { sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';
import { normalizeDateValue, normalizeNumberValue } from '../../utils/normalize.js';
import { createActivityLog, getDealLogPayload } from '../_shared/activityLogs.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function updateDeal(req, res) {
  try {
    const { Deal } = await getModels();
    const { id } = req.params;
    const columns = await getWritableColumns('deal', ['id', 'created_at', 'updated_at']);
    const payload = req.body || {};
    const entries = columns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing deal id' });
      return;
    }

    if (!entries.length) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const data = Object.fromEntries(
      entries.map((entry) => {
        if (entry.name.endsWith('_date')) {
          return [entry.name, normalizeDateValue(entry.value)];
        }
        if (entry.name === 'expected_amount') {
          return [entry.name, normalizeNumberValue(entry.value)];
        }
        return [entry.name, entry.value];
      })
    );

    const stageEntry = entries.find((entry) => entry.name === 'stage');

    const result = await sequelize.transaction(async (transaction) => {
      const [updated] = await Deal.update(data, { where: { id }, transaction });
      const dealLogPayload = await getDealLogPayload(id, transaction);
      if (dealLogPayload) {
        if (stageEntry) {
          dealLogPayload.deal_stage = stageEntry.value ?? null;
        }
        await createActivityLog(dealLogPayload, transaction);
      }
      return updated;
    });

    res.json({ updated: result });
  } catch (error) {
    console.error('Failed to update deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
}
