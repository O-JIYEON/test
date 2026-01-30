import { getModels } from '../../models/index.js';

export async function createActivityLog(payload, transaction) {
  const { ActivityLog } = await getModels();
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return null;
  }
  const data = Object.fromEntries(entries);
  return ActivityLog.create(data, { transaction });
}

async function getPrimaryContact(customerId, transaction) {
  const { CustomerContact } = await getModels();
  if (!customerId) return null;
  return CustomerContact.findOne({
    where: { customer_id: customerId },
    order: [['id', 'ASC']],
    transaction
  });
}

export async function getLeadLogPayload(leadId, transaction) {
  const { Lead, CustomerContact } = await getModels();
  const lead = await Lead.findOne({
    where: { id: leadId },
    include: [{ model: CustomerContact, as: 'leadContact', required: false, attributes: ['name'] }],
    transaction
  });
  if (!lead) return null;
  const primary = await getPrimaryContact(lead.customer_id, transaction);
  return {
    lead_id: lead.id,
    manager: lead.leadContact?.name || primary?.name || '',
    sales_owner: lead.customer_owner || '',
    next_action_date: lead.next_action_date || null,
    next_action_content: lead.next_action_content || ''
  };
}

export async function getDealLogPayload(dealId, transaction) {
  const { Deal, Lead, CustomerContact } = await getModels();
  const deal = await Deal.findOne({
    where: { id: dealId },
    include: [
      {
        model: Lead,
        as: 'lead',
        required: false,
        include: [{ model: CustomerContact, as: 'leadContact', required: false, attributes: ['name'] }]
      }
    ],
    transaction
  });
  if (!deal) return null;
  const lead = deal.lead;
  const primary = await getPrimaryContact(lead?.customer_id, transaction);
  return {
    deal_id: deal.id,
    lead_id: deal.lead_id,
    manager: lead?.leadContact?.name || primary?.name || '',
    sales_owner: lead?.customer_owner || '',
    project_name: deal.project_name || '',
    expected_amount: deal.expected_amount ?? null,
    next_action_date: deal.next_action_date || null,
    next_action_content: deal.next_action_content || ''
  };
}
