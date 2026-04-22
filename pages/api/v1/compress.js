import { createV1Handler } from '@lib/v1Handler';
import { jsonCompress } from '@lib/converters';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default createV1Handler(async (req, res) => {
  const { input } = req.body || {};
  if (input === undefined || input === null) {
    return res.status(400).json({ error: 'missing_field', field: 'input' });
  }
  try {
    const output = jsonCompress(input);
    return res.status(200).json({ output, format: 'json' });
  } catch {
    return res.status(422).json({ error: 'invalid_json' });
  }
});
