import dayjs from 'dayjs';
import { sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';
import { normalizeDateValue, normalizeIdValue } from '../../utils/normalize.js';
import { createActivityLog, getLeadLogPayload, getDealLogPayload } from '../_shared/activityLogs.js';
import { assignDailyCodeWithRetry } from '../_shared/sequence.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function createLead(req, res) {
  try {
    const { Lead, Deal } = await getModels();
    const columns = await getWritableColumns('lead');
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
        if (entry.name.endsWith('_id')) {
          return [entry.name, normalizeIdValue(entry.value)];
        }
        return [entry.name, entry.value];
      })
    );

    const result = await sequelize.transaction(async (transaction) => {
      const created = await Lead.create(data, {
        fields: entries.map((entry) => entry.name),
        transaction
      });

      const leadRow = await Lead.findByPk(created.id, { transaction });
      const baseCreatedAt = leadRow?.created_at ?? dayjs().toDate();
      const kstDate = dayjs(baseCreatedAt).add(9, 'hour');
      const kstDateKey = kstDate.format('YYYYMMDD');
      await assignDailyCodeWithRetry(
        Lead,
        created.id,
        'lead_code',
        '-L',
        kstDate.toDate(),
        kstDateKey,
        transaction
      );

      const leadLogPayload = await getLeadLogPayload(created.id, transaction);
      if (leadLogPayload) {
        await createActivityLog(leadLogPayload, transaction);
      }

      let dealCreated = false;
      if (leadRow?.lead_status === '딜전환') {
        const existing = await Deal.findOne({
          where: { lead_id: leadRow.id, deleted_at: null },
          transaction
        });
        if (!existing) {
          const deal = await Deal.create(
            {
              lead_id: leadRow.id,
              project_name: leadRow.content || '',
              stage: '자격확인(가능성판단)',
              expected_amount: null,
              expected_close_date: null,
              next_action_date: leadRow.next_action_date || null,
              next_action_content: leadRow.next_action_content || '',
              loss_reason: null
            },
            { transaction }
          );

          const dealRow = await Deal.findByPk(deal.id, { attributes: ['created_at'], transaction });
          const createdAt = dealRow?.created_at ?? dayjs().toDate();
          const dealKst = dayjs(createdAt).add(9, 'hour');
          const dealKey = dealKst.format('YYYYMMDD');
          await assignDailyCodeWithRetry(
            Deal,
            deal.id,
            'deal_code',
            '-D',
            dealKst.toDate(),
            dealKey,
            transaction
          );

          const dealLogPayload = await getDealLogPayload(deal.id, transaction);
          if (dealLogPayload) {
            await createActivityLog(dealLogPayload, transaction);
          }

          dealCreated = true;
        }
      }

      return { id: created.id, dealCreated };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to create lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
}
