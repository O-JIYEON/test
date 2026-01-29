import mysql from 'mysql2/promise';
import dbConfig from './config.js';

export default function getConnection() {
  return mysql.createConnection(dbConfig);
}
