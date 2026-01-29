import { Op } from '../../models/index.js';
import { getModels } from '../../models/index.js';

export async function getActivityLogs(req, res) {
  try {
    const { ActivityLog, Lead, Deal, Customer } = await getModels();
    const logs = await ActivityLog.findAll({
      where: {
        deleted_at: null,
        [Op.and]: [
          { [Op.or]: [{ lead_id: null }, { '$lead.deleted_at$': null }] },
          { [Op.or]: [{ deal_id: null }, { '$deal.deleted_at$': null }] }
        ]
      },
      include: [
        {
          model: Lead,
          as: 'lead',
          required: false,
          attributes: ['lead_code', 'customer_id', 'deleted_at'],
          include: [{ model: Customer, as: 'customer', required: false, attributes: ['company'] }]
        },
        { model: Deal, as: 'deal', required: false, attributes: ['deal_code', 'deleted_at'] }
      ],
      order: [['id', 'DESC']],
      raw: true,
      nest: true
    });

    const mapped = logs.map((log) => ({
      id: log.id,
      lead_id: log.lead_id,
      deal_id: log.deal_id,
      activity_date: log.activity_date,
      manager: log.manager,
      sales_owner: log.sales_owner,
      deal_stage: log.deal_stage,
      next_action_date: log.next_action_date,
      next_action_content: log.next_action_content,
      lead_code: log.lead?.lead_code || null,
      deal_code: log.deal?.deal_code || null,
      company: log.lead?.customer?.company || null
    }));

    res.json({ logs: mapped });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
}
