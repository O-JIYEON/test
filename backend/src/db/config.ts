const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'java',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'test',
  timezone: 'Z'
};

export default dbConfig;
