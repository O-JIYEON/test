import dayjs from 'dayjs';
import { sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';
import { normalizeDateValue, normalizeNumberValue } from '../../utils/normalize.js';
import { createActivityLog, getDealLogPayload } from '../_shared/activityLogs.js';
import { assignDailyCodeWithRetry } from '../_shared/sequence.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function createDeal(req, res) {
  try {
    const { Deal } = await getModels();
    const columns = await getWritableColumns('deal', ['created_at', 'updated_at']);
    const payload = req.body || {};
    const entries = columns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

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

    const result = await sequelize.transaction(async (transaction) => {
      const created = await Deal.create(data, {
        fields: entries.map((entry) => entry.name),
        transaction
      });

      const dealRow = await Deal.findByPk(created.id, { attributes: ['created_at'], transaction });
      const createdAt = dealRow?.created_at ?? dayjs().toDate();
      const kstDate = dayjs(createdAt).add(9, 'hour');
      const kstDateKey = kstDate.format('YYYYMMDD');
      await assignDailyCodeWithRetry(
        Deal,
        created.id,
        'deal_code',
        '-D',
        kstDate.toDate(),
        kstDateKey,
        transaction
      );

      const dealLogPayload = await getDealLogPayload(created.id, transaction);
      if (dealLogPayload) {
        await createActivityLog(dealLogPayload, transaction);
      }

      return created.id;
    });

    res.status(201).json({ id: result });
  } catch (error) {
    console.error('Failed to create deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
}
