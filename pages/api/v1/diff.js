import { createV1Handler } from '@lib/v1Handler';
import { jsonDiff } from '@lib/converters';

export const config = { api: { bodyParser: { sizeLimit: '2gb' } } };

export default createV1Handler(async (req, res) => {
  const { left, right } = req.body || {};
  if (left === undefined || left === null) return res.status(400).json({ error: 'missing_field', field: 'left' });
  if (right === undefined || right === null) return res.status(400).json({ error: 'missing_field', field: 'right' });
  return res.status(200).json(jsonDiff(left, right));
});
