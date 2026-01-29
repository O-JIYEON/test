import { DataTypes, Op, Sequelize } from 'sequelize';
import sequelize from '../db/sequelize.js';

const TABLES = {
  user: 'User',
  project: 'Project',
  customers: 'Customer',
  customer_contacts: 'CustomerContact',
  lead: 'Lead',
  deal: 'Deal',
  activity_logs: 'ActivityLog',
  lookup_categories: 'LookupCategory',
  lookup_values: 'LookupValue',
  goals: 'Goal'
} as const;

let modelsPromise: Promise<Record<string, any>> | null = null;

function parseEnumValues(type: string) {
  const match = type.match(/^ENUM\((.*)\)$/i);
  if (!match) return null;
  const raw = match[1];
  const values: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === "'") {
      inQuote = !inQuote;
      continue;
    }
    if (ch === ',' && !inQuote) {
      values.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current) values.push(current);
  return values.map((value) => value.trim());
}

function mapColumnType(type: string) {
  const upper = type.toUpperCase();
  if (upper.startsWith('INT')) return DataTypes.INTEGER;
  if (upper.startsWith('BIGINT')) return DataTypes.BIGINT;
  if (upper.startsWith('DECIMAL')) return DataTypes.DECIMAL;
  if (upper.startsWith('FLOAT')) return DataTypes.FLOAT;
  if (upper.startsWith('DOUBLE')) return DataTypes.DOUBLE;
  if (upper.startsWith('DATETIME')) return DataTypes.DATE;
  if (upper.startsWith('TIMESTAMP')) return DataTypes.DATE;
  if (upper.startsWith('DATE')) return DataTypes.DATEONLY;
  if (upper.startsWith('TEXT')) return DataTypes.TEXT;
  if (upper.startsWith('ENUM')) {
    const values = parseEnumValues(type) || [];
    return DataTypes.ENUM(...values);
  }
  const varchar = upper.match(/^VARCHAR\((\d+)\)/);
  if (varchar) return DataTypes.STRING(Number(varchar[1]));
  const char = upper.match(/^CHAR\((\d+)\)/);
  if (char) return DataTypes.STRING(Number(char[1]));
  return DataTypes.STRING;
}

async function defineModelFromTable(tableName: string, modelName: string) {
  const columns = await sequelize.getQueryInterface().describeTable(tableName);
  const attributes: Record<string, any> = {};
  Object.entries(columns).forEach(([name, column]) => {
    attributes[name] = {
      type: mapColumnType(column.type as string),
      allowNull: column.allowNull,
      primaryKey: column.primaryKey,
      autoIncrement: column.autoIncrement,
      defaultValue: column.defaultValue
    };
  });
  return sequelize.define(modelName, attributes, {
    tableName,
    timestamps: false,
    underscored: true
  });
}

async function initModels() {
  const models: Record<string, any> = {};
  for (const [tableName, modelName] of Object.entries(TABLES)) {
    models[modelName] = await defineModelFromTable(tableName, modelName);
  }

  const {
    Customer,
    CustomerContact,
    Lead,
    Deal,
    ActivityLog,
    LookupCategory,
    LookupValue
  } = models;

  if (Customer && CustomerContact) {
    Customer.hasMany(CustomerContact, { foreignKey: 'customer_id', as: 'contacts' });
    CustomerContact.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  }

  if (Lead && Customer) {
    Lead.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  }

  if (Lead && CustomerContact) {
    Lead.belongsTo(CustomerContact, { foreignKey: 'contact_id', as: 'leadContact' });
  }

  if (Deal && Lead) {
    Deal.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
  }

  if (ActivityLog && Lead) {
    ActivityLog.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
  }

  if (ActivityLog && Deal) {
    ActivityLog.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });
  }

  if (LookupCategory && LookupValue) {
    LookupCategory.hasMany(LookupValue, { foreignKey: 'category_id', as: 'values' });
    LookupValue.belongsTo(LookupCategory, { foreignKey: 'category_id', as: 'category' });
  }

  return models;
}

export async function getModels() {
  if (!modelsPromise) {
    modelsPromise = initModels();
  }
  return modelsPromise;
}

export { sequelize, Sequelize, Op };
