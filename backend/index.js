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
  database: process.env.DB_NAME || 'test'
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

async function getCustomers(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM `customers` ORDER BY id DESC');
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

async function getLeads(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT
        lead.id,
        lead.customer_id,
        lead.content,
        lead.lead_status,
        lead.next_action_date,
        lead.next_action_content,
        lead.created_at,
        customers.company,
        customers.owner,
        customers.contact,
        customers.email,
        customers.customer_owner,
        customers.source,
        customers.product_line,
        customers.region,
        customers.segment
      FROM \`lead\`
      LEFT JOIN \`customers\` ON customers.id = lead.customer_id
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
      return entry.value;
    });

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`lead\` (${fieldNames}) VALUES (${placeholders})`,
      normalizedValues
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
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
      return entry.value;
    });
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(`UPDATE \`lead\` SET ${sets} WHERE id = ?`, values);
    res.json({ updated: result.affectedRows });
  } catch (error) {
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
    const [result] = await connection.query('DELETE FROM `lead` WHERE id = ?', [id]);
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
app.get('/api/leads', getLeads);
app.get('/api/leads/schema', getLeadsSchema);
app.post('/api/leads', createLead);
app.put('/api/leads/:id', updateLead);
app.delete('/api/leads/:id', deleteLead);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Customers management backend listening on port ${PORT}`);
});
