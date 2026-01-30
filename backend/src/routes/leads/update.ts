import dayjs from 'dayjs';
import { sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';
import { normalizeDateValue, normalizeIdValue } from '../../utils/normalize.js';
import { createActivityLog, getLeadLogPayload, getDealLogPayload } from '../_shared/activityLogs.js';
import { getNextDailySequence } from '../_shared/sequence.js';
import { getWritableColumns } from '../_shared/columns.js';

export async function updateLead(req, res) {
  try {
    const { Lead, Deal } = await getModels();
    const { id } = req.params;
    const columns = await getWritableColumns('lead', ['id']);
    const payload = req.body || {};
    const entries = columns
      .map((col) => col.name)
      .filter((name) => name !== 'lead_code')
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing lead id' });
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
        if (entry.name.endsWith('_id')) {
          return [entry.name, normalizeIdValue(entry.value)];
        }
        return [entry.name, entry.value];
      })
    );

    const result = await sequelize.transaction(async (transaction) => {
      const [updated] = await Lead.update(data, { where: { id }, transaction });
      const leadRow = await Lead.findByPk(id, { transaction });
      const leadLogPayload = await getLeadLogPayload(id, transaction);
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
          const dealSeq = await getNextDailySequence(Deal, 'deal_code', '-D', dealKst.toDate(), transaction);
          await Deal.update(
            { deal_code: `${dealKey}-D${dealSeq}` },
            { where: { id: deal.id }, transaction }
          );

          const dealLogPayload = await getDealLogPayload(deal.id, transaction);
          if (dealLogPayload) {
            await createActivityLog(dealLogPayload, transaction);
          }

          dealCreated = true;
        }
      }

      return { updated, dealCreated };
    });

    res.json(result);
  } catch (error) {
    console.error('Failed to update lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
}
