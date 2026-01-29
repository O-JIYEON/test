import { getModels } from '../../models/index.js';
import { normalizeDateValue, normalizeNumberValue } from '../../utils/normalize.js';

export async function upsertGoal(req, res) {
  try {
    const { Goal } = await getModels();
    const { period_type, period_start, amount } = req.body || {};
    if (!period_type || !period_start) {
      res.status(400).json({ error: 'Missing period_type or period_start' });
      return;
    }
    const normalizedAmount = normalizeNumberValue(amount) ?? 0;
    const normalizedDate = normalizeDateValue(period_start);
    await Goal.upsert({
      period_type,
      period_start: normalizedDate,
      amount: normalizedAmount
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Failed to save goal:', error);
    res.status(500).json({ error: 'Failed to save goal' });
  }
}
