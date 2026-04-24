import { createV1Handler } from '@lib/v1Handler';
import { jsonQuery } from '@lib/converters';

export const config = { api: { bodyParser: { sizeLimit: '2gb' } } };

export default createV1Handler(async (req, res) => {
  const { input, expr } = req.body || {};
  if (input === undefined || input === null) return res.status(400).json({ error: 'missing_field', field: 'input' });
  if (!expr) return res.status(400).json({ error: 'missing_field', field: 'expr' });
  try {
    const result = jsonQuery(input, expr);
    return res.status(200).json({ result, expr });
  } catch (e) {
    return res.status(400).json({ error: 'query_failed', message: e.message });
  }
});
