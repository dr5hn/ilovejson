import { createV1Handler } from '@lib/v1Handler';
import { jsonValidate } from '@lib/converters';

export const config = { api: { bodyParser: { sizeLimit: '2gb' } } };

export default createV1Handler(async (req, res) => {
  const { input } = req.body || {};
  if (input === undefined || input === null) {
    return res.status(400).json({ error: 'missing_field', field: 'input' });
  }
  return res.status(200).json(jsonValidate(input));
});
