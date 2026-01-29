import { Op } from '../../models/index.js';
import { getModels } from '../../models/index.js';

export async function getDeals(req, res) {
  try {
    const { Deal, Lead, Customer, CustomerContact } = await getModels();
    const deals = await Deal.findAll({
      where: { deleted_at: null },
      include: [
        {
          model: Lead,
          as: 'lead',
          required: true,
          where: { deleted_at: null },
          include: [
            { model: Customer, as: 'customer', required: false, attributes: ['company'] },
            { model: CustomerContact, as: 'leadContact', required: false, attributes: ['name', 'contact', 'email'] }
          ]
        }
      ],
      order: [['id', 'DESC']]
    });

    const customerIds = Array.from(
      new Set(
        deals
          .map((deal) => deal.lead?.customer_id)
          .filter(Boolean)
      )
    );

    let primaryContacts = [];
    if (customerIds.length) {
      primaryContacts = await CustomerContact.findAll({
        where: { customer_id: { [Op.in]: customerIds } },
        order: [
          ['customer_id', 'ASC'],
          ['id', 'ASC']
        ]
      });
    }

    const primaryMap = new Map();
    for (const contact of primaryContacts) {
      if (!primaryMap.has(contact.customer_id)) {
        primaryMap.set(contact.customer_id, contact);
      }
    }

    const data = deals.map((deal) => {
      const lead = deal.lead;
      const leadContact = lead?.leadContact;
      const primary = lead ? primaryMap.get(lead.customer_id) : null;
      return {
        id: deal.id,
        deal_code: deal.deal_code,
        lead_id: deal.lead_id,
        project_name: deal.project_name,
        stage: deal.stage,
        expected_amount: deal.expected_amount,
        expected_close_date: deal.expected_close_date,
        won_date: deal.won_date,
        next_action_date: deal.next_action_date,
        next_action_content: deal.next_action_content,
        loss_reason: deal.loss_reason,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
        lead_code: lead?.lead_code || null,
        lead_deleted_at: lead?.deleted_at || null,
        customer_id: lead?.customer_id || null,
        customer_owner: lead?.customer_owner || null,
        source: lead?.source || null,
        product_line: lead?.product_line || null,
        region: lead?.region || null,
        segment: lead?.segment || null,
        company: lead?.customer?.company || null,
        owner: leadContact?.name || primary?.name || null,
        contact: leadContact?.contact || primary?.contact || null,
        email: leadContact?.email || primary?.email || null
      };
    });

    res.json({ deals: data });
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
}
