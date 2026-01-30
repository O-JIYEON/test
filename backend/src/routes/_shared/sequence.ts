import { Op } from 'sequelize';
import { sequelize } from '../../models/index.js';

export async function getNextDailySequence(model, codeColumn, token, dateValue, transaction) {
  const rows = await model.findAll({
    attributes: [codeColumn],
    where: sequelize.where(sequelize.fn('DATE', sequelize.col('created_at')), '=', sequelize.fn('DATE', dateValue)),
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    transaction,
    raw: true
  });
  let maxSeq = 0;
  for (const row of rows) {
    const code = row[codeColumn];
    if (!code || typeof code !== 'string') continue;
    const index = code.lastIndexOf(token);
    if (index === -1) continue;
    const seqText = code.slice(index + token.length).replace(/[^0-9]/g, '');
    const seq = Number(seqText);
    if (!Number.isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }
  return String(maxSeq + 1).padStart(3, '0');
}

async function getNextSequenceByPrefix(model, codeColumn, prefix, transaction) {
  const rows = await model.findAll({
    attributes: [codeColumn],
    where: {
      [codeColumn]: { [Op.like]: `${prefix}%` }
    },
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    transaction,
    raw: true
  });
  let maxSeq = 0;
  for (const row of rows) {
    const code = row[codeColumn];
    if (!code || typeof code !== 'string') continue;
    const seqText = code.slice(prefix.length).replace(/[^0-9]/g, '');
    const seq = Number(seqText);
    if (!Number.isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }
  return String(maxSeq + 1).padStart(3, '0');
}

export async function assignDailyCodeWithRetry(
  model,
  id,
  codeColumn,
  token,
  dateValue,
  dateKey,
  transaction,
  attempts = 5
) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const prefix = `${dateKey}${token}`;
    const seq = await getNextSequenceByPrefix(model, codeColumn, prefix, transaction);
    const code = `${prefix}${seq}`;
    try {
      await model.update({ [codeColumn]: code }, { where: { id }, transaction });
      return code;
    } catch (error) {
      const isUnique =
        error?.name === 'SequelizeUniqueConstraintError' || error?.original?.code === 'ER_DUP_ENTRY';
      if (!isUnique) {
        throw error;
      }
      lastError = error;
    }
  }
  if (lastError) {
    throw lastError;
  }
  throw new Error(`Failed to assign ${codeColumn} after ${attempts} attempts`);
}
