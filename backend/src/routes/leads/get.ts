import { Op } from '../../models/index.js';
import { getModels } from '../../models/index.js';
import { getTableColumns } from '../_shared/columns.js';

export async function getLeads(req, res) {
  try {
    const { Lead, Customer, CustomerContact } = await getModels();
    const leads = await Lead.findAll({
      where: { deleted_at: null },
      include: [
        { model: Customer, as: 'customer', required: false, attributes: ['company'] },
        { model: CustomerContact, as: 'leadContact', required: false, attributes: ['name', 'contact', 'email'] }
      ],
      order: [['id', 'DESC']]
    });

    const customerIds = Array.from(
      new Set(leads.map((lead) => lead.customer_id).filter(Boolean))
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

    const data = leads.map((lead) => {
      const leadContact = lead.leadContact;
      const primary = primaryMap.get(lead.customer_id);
      return {
        id: lead.id,
        lead_code: lead.lead_code,
        customer_id: lead.customer_id,
        contact_id: lead.contact_id,
        customer_owner: lead.customer_owner,
        source: lead.source,
        product_line: lead.product_line,
        region: lead.region,
        segment: lead.segment,
        content: lead.content,
        lead_status: lead.lead_status,
        next_action_date: lead.next_action_date,
        next_action_content: lead.next_action_content,
        created_at: lead.created_at,
        company: lead.customer?.company || null,
        owner: leadContact?.name || primary?.name || null,
        contact: leadContact?.contact || primary?.contact || null,
        email: leadContact?.email || primary?.email || null
      };
    });

    res.json({ leads: data });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
}

export async function getLeadsSchema(req, res) {
  try {
    const columns = await getTableColumns('lead');
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch lead schema:', error);
    res.status(500).json({ error: 'Failed to fetch lead schema' });
  }
}
