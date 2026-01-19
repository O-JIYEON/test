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

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO \`project\` (${fieldNames}) VALUES (${placeholders})`,
      values
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
    const values = entries.map((entry) => entry.value);
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/overview', (req, res) => {
  res.json({
    message: '영업 관리 백엔드가 실행 중입니다.',
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

app.listen(PORT, () => {
  console.log(`Sales management backend listening on port ${PORT}`);
});
