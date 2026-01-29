import { Sequelize } from '../../models/index.js';
import { getModels } from '../../models/index.js';
import { getTableColumns } from '../_shared/columns.js';

export async function getCustomers(req, res) {
  try {
    const { Customer } = await getModels();
    const customers = await Customer.findAll({
      attributes: {
        include: [
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM `customer_contacts` cc WHERE cc.customer_id = `customers`.id)'
            ),
            'contact_count'
          ],
          [
            Sequelize.literal(
              '(SELECT cc.name FROM `customer_contacts` cc WHERE cc.customer_id = `customers`.id ORDER BY cc.id ASC LIMIT 1)'
            ),
            'owner'
          ],
          [
            Sequelize.literal(
              '(SELECT cc.contact FROM `customer_contacts` cc WHERE cc.customer_id = `customers`.id ORDER BY cc.id ASC LIMIT 1)'
            ),
            'contact'
          ],
          [
            Sequelize.literal(
              '(SELECT cc.email FROM `customer_contacts` cc WHERE cc.customer_id = `customers`.id ORDER BY cc.id ASC LIMIT 1)'
            ),
            'email'
          ]
        ]
      },
      order: [['id', 'DESC']],
      raw: true
    });
    res.json({ customers });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

export async function getCustomersSchema(req, res) {
  try {
    const columns = await getTableColumns('customers');
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch customers schema:', error);
    res.status(500).json({ error: 'Failed to fetch customers schema' });
  }
}
