import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAnyOrigin = process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }
  if (allowAnyOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'java',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'test',
  timezone: 'Z'
};

function normalizeDateValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const text = String(value);
  return text.includes('T') ? text.split('T')[0] : text;
}

function normalizeNumberValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return value;
}

function normalizeIdValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return value;
}

async function getUserColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'user']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getUsers(req, res) {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM `user` ORDER BY id DESC');
    res.json({ users: rows });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getUsersSchema(req, res) {
  try {
    const columns = await getUserColumns();
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch user schema:', error);
    res.status(500).json({ error: 'Failed to fetch user schema' });
  }
}

async function createUser(req, res) {
  let connection;
  try {
    const columns = await getUserColumns();
    const writableColumns = columns.filter((col) => !col.isAutoIncrement);
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map((entry) => entry.value);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`user\` (${fieldNames}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateUser(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getUserColumns();
    const writableColumns = columns.filter((col) => !col.isAutoIncrement && col.name !== 'id');
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const sets = entries.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const values = entries.map((entry) => entry.value);
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `UPDATE \`user\` SET ${sets} WHERE id = ?`,
      values
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteUser(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `user` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getProjectColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'project']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getCustomersColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'customers']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getCustomerContactColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'customer_contacts']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getLookupCategoryColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'lookup_categories']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getLookupValueColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'lookup_values']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function createActivityLog(connection, payload) {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return;
  }
  const fieldNames = entries.map(([key]) => `\`${key}\``).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  const values = entries.map(([, value]) => value);
  await connection.query(
    `INSERT INTO \`activity_logs\` (${fieldNames}) VALUES (${placeholders})`,
    values
  );
}

async function getLeadLogPayload(connection, leadId) {
  const [rows] = await connection.query(
    `SELECT
      lead.id AS lead_id,
      lead.customer_owner AS sales_owner,
      lead.next_action_date,
      lead.next_action_content,
      COALESCE(lead_contact.name, primary_contact.name) AS manager
    FROM \`lead\`
    LEFT JOIN \`customer_contacts\` lead_contact ON lead_contact.id = lead.contact_id
    LEFT JOIN (
      SELECT cc.customer_id, cc.name, cc.contact, cc.email
      FROM \`customer_contacts\` cc
      INNER JOIN (
        SELECT customer_id, MIN(id) AS min_id
        FROM \`customer_contacts\`
        GROUP BY customer_id
      ) cc_min ON cc.id = cc_min.min_id
    ) AS primary_contact ON primary_contact.customer_id = lead.customer_id
    WHERE lead.id = ?`,
    [leadId]
  );
  if (!rows.length) {
    return null;
  }
  const row = rows[0];
  return {
    lead_id: row.lead_id,
    manager: row.manager || '',
    sales_owner: row.sales_owner || '',
    next_action_date: row.next_action_date || null,
    next_action_content: row.next_action_content || ''
  };
}

async function getDealLogPayload(connection, dealId) {
  const [rows] = await connection.query(
    `SELECT
      deal.id AS deal_id,
      deal.lead_id,
      lead.customer_owner AS sales_owner,
      deal.next_action_date,
      deal.next_action_content,
      COALESCE(lead_contact.name, primary_contact.name) AS manager
    FROM \`deal\`
    LEFT JOIN \`lead\` ON lead.id = deal.lead_id
    LEFT JOIN \`customer_contacts\` lead_contact ON lead_contact.id = lead.contact_id
    LEFT JOIN (
      SELECT cc.customer_id, cc.name, cc.contact, cc.email
      FROM \`customer_contacts\` cc
      INNER JOIN (
        SELECT customer_id, MIN(id) AS min_id
        FROM \`customer_contacts\`
        GROUP BY customer_id
      ) cc_min ON cc.id = cc_min.min_id
    ) AS primary_contact ON primary_contact.customer_id = lead.customer_id
    WHERE deal.id = ?`,
    [dealId]
  );
  if (!rows.length) {
    return null;
  }
  const row = rows[0];
  return {
    deal_id: row.deal_id,
    lead_id: row.lead_id,
    manager: row.manager || '',
    sales_owner: row.sales_owner || '',
    next_action_date: row.next_action_date || null,
    next_action_content: row.next_action_content || ''
  };
}

async function getLeadColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'lead']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getNextDailySequence(connection, table, codeColumn, token, dateValue) {
  const [rows] = await connection.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(${codeColumn}, ?, -1) AS UNSIGNED)) AS maxSeq
     FROM \`${table}\`
     WHERE DATE(created_at) = DATE(?) AND ${codeColumn} IS NOT NULL
     FOR UPDATE`,
    [token, dateValue]
  );
  const maxSeq = rows[0]?.maxSeq || 0;
  return String(maxSeq + 1).padStart(3, '0');
}

async function ensureDealForLead(connection, lead) {
  if (!lead || !lead.id) {
    return { created: false };
  }
  const [existing] = await connection.query(
    'SELECT id FROM `deal` WHERE lead_id = ? LIMIT 1 FOR UPDATE',
    [lead.id]
  );
  if (existing.length > 0) {
    return { created: false };
  }
  const [result] = await connection.query(
    `INSERT INTO \`deal\`
      (lead_id, project_name, stage, expected_amount, expected_close_date, next_action_date, next_action_content, loss_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead.id,
      lead.content || '',
      '자격확인(가능성판단)',
      null,
      null,
      lead.next_action_date || null,
      lead.next_action_content || '',
      null
    ]
  );
  const [dealRows] = await connection.query('SELECT created_at FROM `deal` WHERE id = ?', [
    result.insertId
  ]);
  const createdAt = dealRows[0]?.created_at || new Date();
  const seq = await getNextDailySequence(connection, 'deal', 'deal_code', '-D', createdAt);
  await connection.query(
    `UPDATE \`deal\`
     SET deal_code = CONCAT(DATE_FORMAT(created_at, '%Y%m%d'), '-D', ?)
     WHERE id = ?`,
    [seq, result.insertId]
  );
  const dealLogPayload = await getDealLogPayload(connection, result.insertId);
  if (dealLogPayload) {
    await createActivityLog(connection, dealLogPayload);
  }
  return { created: true, dealId: result.insertId };
}

async function getDealColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'deal']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getProjects(req, res) {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM `project` ORDER BY id DESC');
    res.json({ projects: rows });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getProjectsSchema(req, res) {
  try {
    const columns = await getProjectColumns();
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch project schema:', error);
    res.status(500).json({ error: 'Failed to fetch project schema' });
  }
}

async function createProject(req, res) {
  let connection;
  try {
    const columns = await getProjectColumns();
    const writableColumns = columns.filter((col) => !col.isAutoIncrement);
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map((entry) => entry.value);
    const columnNames = entries.map((entry) => entry.name);
    const normalizedValues = values.map((value, index) => {
      const column = columnNames[index];
      if (column === 'start_date' || column === 'end_date') {
        return normalizeDateValue(value);
      }
      if (column === 'amount') {
        return normalizeNumberValue(value);
      }
      return value;
    });

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`project\` (${fieldNames}) VALUES (${placeholders})`,
      normalizedValues
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateProject(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getProjectColumns();
    const writableColumns = columns.filter((col) => !col.isAutoIncrement && col.name !== 'id');
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing project id' });
      return;
    }

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const sets = entries.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const values = entries.map((entry) => {
      if (entry.name === 'start_date' || entry.name === 'end_date') {
        return normalizeDateValue(entry.value);
      }
      if (entry.name === 'amount') {
        return normalizeNumberValue(entry.value);
      }
      return entry.value;
    });
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `UPDATE \`project\` SET ${sets} WHERE id = ?`,
      values
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteProject(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing project id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `project` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getDeals(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT
        deal.id,
        deal.deal_code,
        deal.lead_id,
        deal.project_name,
        deal.stage,
        deal.expected_amount,
        deal.expected_close_date,
        deal.next_action_date,
        deal.next_action_content,
        deal.loss_reason,
        deal.created_at,
        deal.updated_at,
        lead.lead_code,
        lead.deleted_at AS lead_deleted_at,
        lead.customer_id,
        lead.customer_owner,
        lead.source,
        lead.product_line,
        lead.region,
        lead.segment,
        customers.company,
        primary_contact.name AS owner,
        primary_contact.contact,
        primary_contact.email
      FROM \`deal\`
      LEFT JOIN \`lead\` ON lead.id = deal.lead_id
      LEFT JOIN \`customers\` ON customers.id = lead.customer_id
      LEFT JOIN (
        SELECT cc.customer_id, cc.name, cc.contact, cc.email
        FROM \`customer_contacts\` cc
        INNER JOIN (
          SELECT customer_id, MIN(id) AS min_id
          FROM \`customer_contacts\`
          GROUP BY customer_id
        ) cc_min ON cc.id = cc_min.min_id
      ) AS primary_contact ON primary_contact.customer_id = customers.id
      WHERE deal.deleted_at IS NULL
        AND lead.deleted_at IS NULL
      ORDER BY deal.id DESC`
    );
    res.json({ deals: rows });
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createDeal(req, res) {
  let connection;
  try {
    const columns = await getDealColumns();
    const writableColumns = columns.filter(
      (col) =>
        !col.isAutoIncrement && col.name !== 'created_at' && col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const columnNames = entries.map((entry) => entry.name);
    const normalizedValues = entries.map((entry, index) => {
      const column = columnNames[index];
      if (column.endsWith('_date')) {
        return normalizeDateValue(entry.value);
      }
      if (column === 'expected_amount') {
        return normalizeNumberValue(entry.value);
      }
      return entry.value;
    });

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO \`deal\` (${fieldNames}) VALUES (${placeholders})`,
      normalizedValues
    );
    const [dealRows] = await connection.query('SELECT created_at FROM `deal` WHERE id = ?', [
      result.insertId
    ]);
    const createdAt = dealRows[0]?.created_at || new Date();
    const seq = await getNextDailySequence(connection, 'deal', 'deal_code', '-D', createdAt);
    await connection.query(
      `UPDATE \`deal\`
       SET deal_code = CONCAT(DATE_FORMAT(created_at, '%Y%m%d'), '-D', ?)
       WHERE id = ?`,
      [seq, result.insertId]
    );
    const dealLogPayload = await getDealLogPayload(connection, result.insertId);
    if (dealLogPayload) {
      await createActivityLog(connection, dealLogPayload);
    }
    await connection.commit();
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Failed to create deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateDeal(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getDealColumns();
    const writableColumns = columns.filter(
      (col) =>
        !col.isAutoIncrement &&
        col.name !== 'id' &&
        col.name !== 'created_at' &&
        col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing deal id' });
      return;
    }

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const sets = entries.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const columnNames = entries.map((entry) => entry.name);
    const values = entries.map((entry, index) => {
      const column = columnNames[index];
      if (column.endsWith('_date')) {
        return normalizeDateValue(entry.value);
      }
      if (column === 'expected_amount') {
        return normalizeNumberValue(entry.value);
      }
      return entry.value;
    });
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(`UPDATE \`deal\` SET ${sets} WHERE id = ?`, values);
    const dealLogPayload = await getDealLogPayload(connection, id);
    if (dealLogPayload) {
      await createActivityLog(connection, dealLogPayload);
    }
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteDeal(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing deal id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const dealLogPayload = await getDealLogPayload(connection, id);
    if (dealLogPayload) {
      await createActivityLog(connection, dealLogPayload);
    }
    const [result] = await connection.query(
      'UPDATE `deal` SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    await connection.query('UPDATE `activity_logs` SET deleted_at = NOW() WHERE deal_id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getCustomers(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT
        customers.*,
        COALESCE(contact_counts.contact_count, 0) AS contact_count,
        primary_contact.name AS owner,
        primary_contact.contact,
        primary_contact.email
      FROM \`customers\`
      LEFT JOIN (
        SELECT customer_id, COUNT(*) AS contact_count
        FROM \`customer_contacts\`
        GROUP BY customer_id
      ) AS contact_counts ON contact_counts.customer_id = customers.id
      LEFT JOIN (
        SELECT cc.customer_id, cc.name, cc.contact, cc.email
        FROM \`customer_contacts\` cc
        INNER JOIN (
          SELECT customer_id, MIN(id) AS min_id
          FROM \`customer_contacts\`
          GROUP BY customer_id
        ) cc_min ON cc.id = cc_min.min_id
      ) AS primary_contact ON primary_contact.customer_id = customers.id
      ORDER BY customers.id DESC`
    );
    res.json({ customers: rows });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getCustomersSchema(req, res) {
  try {
    const columns = await getCustomersColumns();
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch customers schema:', error);
    res.status(500).json({ error: 'Failed to fetch customers schema' });
  }
}

async function createCustomers(req, res) {
  let connection;
  try {
    const columns = await getCustomersColumns();
    const writableColumns = columns.filter(
      (col) =>
        !col.isAutoIncrement && col.name !== 'created_at' && col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const brnEntry = entries.find((entry) => entry.name === 'business_registration_number');
    if (brnEntry?.value) {
      connection = await mysql.createConnection(dbConfig);
      const [existing] = await connection.query(
        'SELECT id FROM `customers` WHERE business_registration_number = ? LIMIT 1',
        [brnEntry.value]
      );
      if (existing.length > 0) {
        res.status(409).json({ error: 'Duplicate business registration number' });
        return;
      }
      await connection.end();
      connection = null;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map((entry) => entry.value);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`customers\` (${fieldNames}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create customers:', error);
    res.status(500).json({ error: 'Failed to create customers' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateCustomers(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getCustomersColumns();
    const writableColumns = columns.filter(
      (col) =>
        !col.isAutoIncrement &&
        col.name !== 'id' &&
        col.name !== 'created_at' &&
        col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing customers id' });
      return;
    }

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const sets = entries.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const values = entries.map((entry) => entry.value);
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `UPDATE \`customers\` SET ${sets} WHERE id = ?`,
      values
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update customers:', error);
    res.status(500).json({ error: 'Failed to update customers' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteCustomers(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing customers id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `customers` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete customers:', error);
    res.status(500).json({ error: 'Failed to delete customers' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getCustomerContacts(req, res) {
  let connection;
  try {
    const { customer_id: customerId } = req.query;
    connection = await mysql.createConnection(dbConfig);
    if (customerId) {
      const [rows] = await connection.query(
        'SELECT * FROM `customer_contacts` WHERE customer_id = ? ORDER BY id DESC',
        [customerId]
      );
      res.json({ contacts: rows });
      return;
    }
    const [rows] = await connection.query('SELECT * FROM `customer_contacts` ORDER BY id DESC');
    res.json({ contacts: rows });
  } catch (error) {
    console.error('Failed to fetch customer contacts:', error);
    res.status(500).json({ error: 'Failed to fetch customer contacts' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createCustomerContact(req, res) {
  let connection;
  try {
    const columns = await getCustomerContactColumns();
    const writableColumns = columns.filter(
      (col) =>
        !col.isAutoIncrement && col.name !== 'created_at' && col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    const hasCustomerId = entries.some((entry) => entry.name === 'customer_id' && entry.value);
    if (!hasCustomerId) {
      res.status(400).json({ error: 'Missing customer id' });
      return;
    }

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map((entry) => entry.value);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`customer_contacts\` (${fieldNames}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create customer contact:', error);
    res.status(500).json({ error: 'Failed to create customer contact' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateCustomerContact(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getCustomerContactColumns();
    const writableColumns = columns.filter(
      (col) =>
        !col.isAutoIncrement &&
        col.name !== 'id' &&
        col.name !== 'created_at' &&
        col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing contact id' });
      return;
    }

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const sets = entries.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const values = entries.map((entry) => entry.value);
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `UPDATE \`customer_contacts\` SET ${sets} WHERE id = ?`,
      values
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update customer contact:', error);
    res.status(500).json({ error: 'Failed to update customer contact' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteCustomerContact(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing contact id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `customer_contacts` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete customer contact:', error);
    res.status(500).json({ error: 'Failed to delete customer contact' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getLookupCategories(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT
        id,
        label,
        created_at,
        updated_at
      FROM \`lookup_categories\`
      ORDER BY id DESC`
    );
    res.json({ categories: rows });
  } catch (error) {
    console.error('Failed to fetch lookup categories:', error);
    res.status(500).json({ error: 'Failed to fetch lookup categories' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createLookupCategory(req, res) {
  let connection;
  try {
    const columns = await getLookupCategoryColumns();
    const writableColumns = columns.filter(
      (col) => !col.isAutoIncrement && col.name !== 'created_at' && col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map((entry) => entry.value);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`lookup_categories\` (${fieldNames}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create lookup category:', error);
    res.status(500).json({ error: 'Failed to create lookup category' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateLookupCategory(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing category id' });
      return;
    }
    const columns = await getLookupCategoryColumns();
    const writableColumns = columns.filter(
      (col) => !col.isAutoIncrement && col.name !== 'created_at' && col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const updates = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (updates.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const setClause = updates.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const values = updates.map((entry) => entry.value);
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `UPDATE \`lookup_categories\` SET ${setClause} WHERE id = ?`,
      values
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update lookup category:', error);
    res.status(500).json({ error: 'Failed to update lookup category' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteLookupCategory(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing category id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `lookup_categories` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete lookup category:', error);
    res.status(500).json({ error: 'Failed to delete lookup category' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getLookupValues(req, res) {
  let connection;
  try {
    const { category_id } = req.query;
    connection = await mysql.createConnection(dbConfig);
    const conditions = [];
    const params = [];

    if (category_id) {
      conditions.push('c.id = ?');
      params.push(category_id);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT
        v.id,
        v.category_id,
        c.label AS category_label,
        v.label,
        v.probability,
        v.sort_order,
        v.created_at,
        v.updated_at
      FROM \`lookup_values\` v
      INNER JOIN \`lookup_categories\` c ON c.id = v.category_id
      ${whereClause}
      ORDER BY v.sort_order ASC, v.id ASC`,
      params
    );
    res.json({ values: rows });
  } catch (error) {
    console.error('Failed to fetch lookup values:', error);
    res.status(500).json({ error: 'Failed to fetch lookup values' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createLookupValue(req, res) {
  let connection;
  try {
    const columns = await getLookupValueColumns();
    const writableColumns = columns.filter(
      (col) => !col.isAutoIncrement && col.name !== 'created_at' && col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map((entry) => entry.value);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`lookup_values\` (${fieldNames}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create lookup value:', error);
    res.status(500).json({ error: 'Failed to create lookup value' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateLookupValue(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing value id' });
      return;
    }
    const columns = await getLookupValueColumns();
    const writableColumns = columns.filter(
      (col) => !col.isAutoIncrement && col.name !== 'created_at' && col.name !== 'updated_at'
    );
    const payload = req.body || {};
    const updates = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (updates.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const setClause = updates.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const values = updates.map((entry) => entry.value);
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `UPDATE \`lookup_values\` SET ${setClause} WHERE id = ?`,
      values
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update lookup value:', error);
    res.status(500).json({ error: 'Failed to update lookup value' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteLookupValue(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing value id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `lookup_values` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete lookup value:', error);
    res.status(500).json({ error: 'Failed to delete lookup value' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getActivityLogs(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT
        activity_logs.id,
        activity_logs.lead_id,
        activity_logs.deal_id,
        activity_logs.activity_date,
        activity_logs.manager,
        activity_logs.sales_owner,
        activity_logs.next_action_date,
        activity_logs.next_action_content,
        lead.lead_code,
        deal.deal_code,
        customers.company
      FROM \`activity_logs\`
      LEFT JOIN \`lead\` ON lead.id = activity_logs.lead_id
      LEFT JOIN \`deal\` ON deal.id = activity_logs.deal_id
      LEFT JOIN \`customers\` ON customers.id = lead.customer_id
      WHERE activity_logs.deleted_at IS NULL
        AND (activity_logs.lead_id IS NULL OR lead.deleted_at IS NULL)
        AND (activity_logs.deal_id IS NULL OR deal.deleted_at IS NULL)
      ORDER BY activity_logs.id DESC`
    );
    res.json({ logs: rows });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getLeads(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT
        lead.id,
        lead.lead_code,
        lead.customer_id,
        lead.contact_id,
        lead.customer_owner,
        lead.source,
        lead.product_line,
        lead.region,
        lead.segment,
        lead.content,
        lead.lead_status,
        lead.next_action_date,
        lead.next_action_content,
        lead.created_at,
        customers.company,
        COALESCE(lead_contact.name, primary_contact.name) AS owner,
        COALESCE(lead_contact.contact, primary_contact.contact) AS contact,
        COALESCE(lead_contact.email, primary_contact.email) AS email
      FROM \`lead\`
      LEFT JOIN \`customers\` ON customers.id = lead.customer_id
      LEFT JOIN \`customer_contacts\` lead_contact ON lead_contact.id = lead.contact_id
      LEFT JOIN (
        SELECT cc.customer_id, cc.name, cc.contact, cc.email
        FROM \`customer_contacts\` cc
        INNER JOIN (
          SELECT customer_id, MIN(id) AS min_id
          FROM \`customer_contacts\`
          GROUP BY customer_id
        ) cc_min ON cc.id = cc_min.min_id
      ) AS primary_contact ON primary_contact.customer_id = customers.id
      WHERE lead.deleted_at IS NULL
      ORDER BY lead.id DESC`
    );
    res.json({ leads: rows });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getLeadsSchema(req, res) {
  try {
    const columns = await getLeadColumns();
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch lead schema:', error);
    res.status(500).json({ error: 'Failed to fetch lead schema' });
  }
}

async function createLead(req, res) {
  let connection;
  try {
    const columns = await getLeadColumns();
    const writableColumns = columns.filter((col) => !col.isAutoIncrement);
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const fieldNames = entries.map((entry) => `\`${entry.name}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const columnNames = entries.map((entry) => entry.name);
    const normalizedValues = entries.map((entry, index) => {
      const column = columnNames[index];
      if (column.endsWith('_date')) {
        return normalizeDateValue(entry.value);
      }
      if (column.endsWith('_id')) {
        return normalizeIdValue(entry.value);
      }
      return entry.value;
    });

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO \`lead\` (${fieldNames}) VALUES (${placeholders})`,
      normalizedValues
    );
    const [leadRows] = await connection.query('SELECT * FROM `lead` WHERE id = ?', [
      result.insertId
    ]);
    const leadRow = leadRows[0];
    const seq = await getNextDailySequence(
      connection,
      'lead',
      'lead_code',
      '-L',
      leadRow?.created_at || new Date()
    );
    await connection.query(
      `UPDATE \`lead\`
       SET lead_code = CONCAT(DATE_FORMAT(created_at, '%Y%m%d'), '-L', ?)
       WHERE id = ?`,
      [seq, result.insertId]
    );
    const leadLogPayload = await getLeadLogPayload(connection, result.insertId);
    if (leadLogPayload) {
      await createActivityLog(connection, leadLogPayload);
    }
    let dealCreated = false;
    if (leadRow?.lead_status === '딜전환') {
      const resultDeal = await ensureDealForLead(connection, leadRow);
      dealCreated = resultDeal.created;
    }
    await connection.commit();
    res.status(201).json({ id: result.insertId, dealCreated });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Failed to create lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateLead(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getLeadColumns();
    const writableColumns = columns.filter((col) => !col.isAutoIncrement && col.name !== 'id');
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing lead id' });
      return;
    }

    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const sets = entries.map((entry) => `\`${entry.name}\` = ?`).join(', ');
    const values = entries.map((entry) => {
      if (entry.name.endsWith('_date')) {
        return normalizeDateValue(entry.value);
      }
      if (entry.name.endsWith('_id')) {
        return normalizeIdValue(entry.value);
      }
      return entry.value;
    });
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    const [result] = await connection.query(`UPDATE \`lead\` SET ${sets} WHERE id = ?`, values);
    const [leadRows] = await connection.query('SELECT * FROM `lead` WHERE id = ?', [id]);
    const leadRow = leadRows[0];
    const leadLogPayload = await getLeadLogPayload(connection, id);
    if (leadLogPayload) {
      await createActivityLog(connection, leadLogPayload);
    }
    let dealCreated = false;
    if (leadRow?.lead_status === '딜전환') {
      const resultDeal = await ensureDealForLead(connection, leadRow);
      dealCreated = resultDeal.created;
    }
    await connection.commit();
    res.json({ updated: result.affectedRows, dealCreated });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Failed to update lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteLead(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing lead id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const leadLogPayload = await getLeadLogPayload(connection, id);
    if (leadLogPayload) {
      await createActivityLog(connection, leadLogPayload);
    }
    const [result] = await connection.query('UPDATE `lead` SET deleted_at = NOW() WHERE id = ?', [id]);
    await connection.query('UPDATE `deal` SET deleted_at = NOW() WHERE lead_id = ?', [id]);
    await connection.query('UPDATE `activity_logs` SET deleted_at = NOW() WHERE lead_id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/overview', (req, res) => {
  res.json({
    message: '딜(기회) 백엔드가 실행 중입니다.',
    summary: {
      newLeads: 12,
      activeDeals: 5,
      upcomingMeetings: 3
    }
  });
});

app.get('/api/users', getUsers);
app.get('/api/users/schema', getUsersSchema);
app.post('/api/users', createUser);
app.put('/api/users/:id', updateUser);
app.delete('/api/users/:id', deleteUser);

app.get('/api/projects', getProjects);
app.get('/api/projects/schema', getProjectsSchema);
app.post('/api/projects', createProject);
app.put('/api/projects/:id', updateProject);
app.delete('/api/projects/:id', deleteProject);

app.get('/api/customers', getCustomers);
app.get('/api/customers/schema', getCustomersSchema);
app.post('/api/customers', createCustomers);
app.put('/api/customers/:id', updateCustomers);
app.delete('/api/customers/:id', deleteCustomers);
app.get('/api/customer-contacts', getCustomerContacts);
app.post('/api/customer-contacts', createCustomerContact);
app.put('/api/customer-contacts/:id', updateCustomerContact);
app.delete('/api/customer-contacts/:id', deleteCustomerContact);
app.get('/api/lookup-categories', getLookupCategories);
app.post('/api/lookup-categories', createLookupCategory);
app.put('/api/lookup-categories/:id', updateLookupCategory);
app.delete('/api/lookup-categories/:id', deleteLookupCategory);
app.get('/api/lookup-values', getLookupValues);
app.post('/api/lookup-values', createLookupValue);
app.put('/api/lookup-values/:id', updateLookupValue);
app.delete('/api/lookup-values/:id', deleteLookupValue);
app.get('/api/activity-logs', getActivityLogs);
app.get('/api/deals', getDeals);
app.post('/api/deals', createDeal);
app.put('/api/deals/:id', updateDeal);
app.delete('/api/deals/:id', deleteDeal);
app.get('/api/leads', getLeads);
app.get('/api/leads/schema', getLeadsSchema);
app.post('/api/leads', createLead);
app.put('/api/leads/:id', updateLead);
app.delete('/api/leads/:id', deleteLead);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Customers management backend listening on port ${PORT}`);
});
