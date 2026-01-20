import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

async function getDealLogColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'deal_log']
    );
    return rows.map((row) => ({
      name: row.name,
      isAutoIncrement: String(row.extra).includes('auto_increment')
    }));
  } finally {
    await connection.end();
  }
}

async function getSalesProjectColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME AS name, EXTRA AS extra
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'sales_project']
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
    const [rows] = await connection.query('SELECT * FROM `deal` ORDER BY id DESC');
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

async function getDealSchema(req, res) {
  try {
    const columns = await getDealColumns();
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch deal schema:', error);
    res.status(500).json({ error: 'Failed to fetch deal schema' });
  }
}

async function createDeal(req, res) {
  let connection;
  try {
    const columns = await getDealColumns();
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
      if (column.endsWith('_amount') || column === 'probability') {
        return normalizeNumberValue(entry.value);
      }
      return entry.value;
    });

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`deal\` (${fieldNames}) VALUES (${placeholders})`,
      normalizedValues
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
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
    const writableColumns = columns.filter((col) => !col.isAutoIncrement && col.name !== 'id');
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
    const values = entries.map((entry) => {
      if (entry.name.endsWith('_date')) {
        return normalizeDateValue(entry.value);
      }
      if (entry.name.endsWith('_amount') || entry.name === 'probability') {
        return normalizeNumberValue(entry.value);
      }
      return entry.value;
    });
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(`UPDATE \`deal\` SET ${sets} WHERE id = ?`, values);
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
    const [result] = await connection.query('DELETE FROM `deal` WHERE id = ?', [id]);
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

async function getDealLogs(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing deal id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT * FROM `deal_log` WHERE deal_id = ? ORDER BY id DESC',
      [id]
    );
    res.json({ logs: rows });
  } catch (error) {
    console.error('Failed to fetch deal logs:', error);
    res.status(500).json({ error: 'Failed to fetch deal logs' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createDealLog(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing deal id' });
      return;
    }
    const columns = await getDealLogColumns();
    const writableColumns = columns.filter(
      (col) => !col.isAutoIncrement && col.name !== 'id' && col.name !== 'created_at'
    );
    const payload = { ...(req.body || {}), deal_id: id };
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
      if (column.endsWith('_amount') || column === 'probability') {
        return normalizeNumberValue(entry.value);
      }
      return entry.value;
    });

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`deal_log\` (${fieldNames}) VALUES (${placeholders})`,
      normalizedValues
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create deal log:', error);
    res.status(500).json({ error: 'Failed to create deal log' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateDealLog(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getDealLogColumns();
    const writableColumns = columns.filter(
      (col) =>
        !col.isAutoIncrement && col.name !== 'id' && col.name !== 'created_at' && col.name !== 'deal_id'
    );
    const payload = req.body || {};
    const entries = writableColumns
      .map((col) => col.name)
      .filter((name) => Object.prototype.hasOwnProperty.call(payload, name))
      .map((name) => ({ name, value: payload[name] }));

    if (!id) {
      res.status(400).json({ error: 'Missing deal log id' });
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
      if (entry.name.endsWith('_amount') || entry.name === 'probability') {
        return normalizeNumberValue(entry.value);
      }
      return entry.value;
    });
    values.push(id);

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(`UPDATE \`deal_log\` SET ${sets} WHERE id = ?`, values);
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update deal log:', error);
    res.status(500).json({ error: 'Failed to update deal log' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteDealLog(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing deal log id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `deal_log` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete deal log:', error);
    res.status(500).json({ error: 'Failed to delete deal log' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getSalesProjects(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM `sales_project` ORDER BY id DESC');
    res.json({ salesProjects: rows });
  } catch (error) {
    console.error('Failed to fetch sales projects:', error);
    res.status(500).json({ error: 'Failed to fetch sales projects' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getSalesProjectsSchema(req, res) {
  try {
    const columns = await getSalesProjectColumns();
    res.json({ columns });
  } catch (error) {
    console.error('Failed to fetch sales project schema:', error);
    res.status(500).json({ error: 'Failed to fetch sales project schema' });
  }
}

async function createSalesProject(req, res) {
  let connection;
  try {
    const columns = await getSalesProjectColumns();
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
      `INSERT INTO \`sales_project\` (${fieldNames}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Failed to create sales project:', error);
    res.status(500).json({ error: 'Failed to create sales project' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateSalesProject(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const columns = await getSalesProjectColumns();
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
      res.status(400).json({ error: 'Missing sales project id' });
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
      `UPDATE \`sales_project\` SET ${sets} WHERE id = ?`,
      values
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Failed to update sales project:', error);
    res.status(500).json({ error: 'Failed to update sales project' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function deleteSalesProject(req, res) {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing sales project id' });
      return;
    }
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM `sales_project` WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error('Failed to delete sales project:', error);
    res.status(500).json({ error: 'Failed to delete sales project' });
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

app.get('/api/deals', getDeals);
app.get('/api/deals/schema', getDealSchema);
app.post('/api/deals', createDeal);
app.put('/api/deals/:id', updateDeal);
app.delete('/api/deals/:id', deleteDeal);
app.get('/api/deals/:id/logs', getDealLogs);
app.post('/api/deals/:id/logs', createDealLog);
app.put('/api/deal-logs/:id', updateDealLog);
app.delete('/api/deal-logs/:id', deleteDealLog);
app.get('/api/sales-projects', getSalesProjects);
app.get('/api/sales-projects/schema', getSalesProjectsSchema);
app.post('/api/sales-projects', createSalesProject);
app.put('/api/sales-projects/:id', updateSalesProject);
app.delete('/api/sales-projects/:id', deleteSalesProject);

app.listen(PORT, () => {
  console.log(`Sales management backend listening on port ${PORT}`);
});
