import { sequelize } from '../../models/index.js';

export async function getTableColumns(tableName: string) {
  const columns = await sequelize.getQueryInterface().describeTable(tableName);
  return Object.entries(columns).map(([name, column]) => ({
    name,
    isAutoIncrement: Boolean(column.autoIncrement)
  }));
}

export async function getWritableColumns(tableName: string, exclude: string[] = []) {
  const columns = await getTableColumns(tableName);
  return columns.filter((col) => !col.isAutoIncrement && !exclude.includes(col.name));
}
