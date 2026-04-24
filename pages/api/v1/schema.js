import { createV1Handler } from '@lib/v1Handler';
import { jsonSchema } from '@lib/converters';

export const config = { api: { bodyParser: { sizeLimit: '2gb' } } };

export default createV1Handler(async (req, res) => {
  const { input } = req.body || {};
  if (input === undefined || input === null) return res.status(400).json({ error: 'missing_field', field: 'input' });
  try {
    const schema = jsonSchema(typeof input === 'string' ? JSON.parse(input) : input);
    return res.status(200).json({ schema });
  } catch (e) {
    return res.status(422).json({ error: 'schema_failed', message: e.message });
  }
});
