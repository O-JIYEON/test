import { Sequelize } from 'sequelize';
import dbConfig from './config.js';

const sequelize = new Sequelize(
  dbConfig.database || '',
  dbConfig.user || '',
  dbConfig.password || '',
  {
    host: dbConfig.host,
    dialect: 'mysql',
    timezone: '+00:00',
    logging: false,
    dialectOptions: {
      timezone: 'Z'
    }
  }
);

export default sequelize;
