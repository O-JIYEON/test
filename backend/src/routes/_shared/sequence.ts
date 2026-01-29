import { sequelize } from '../../models/index.js';

export async function getNextDailySequence(model, codeColumn, token, dateValue, transaction) {
  const rows = await model.findAll({
    attributes: [codeColumn],
    where: sequelize.where(sequelize.fn('DATE', sequelize.col('created_at')), '=', sequelize.fn('DATE', dateValue)),
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
