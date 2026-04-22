import { createV1Handler } from '@lib/v1Handler';
import { jsonMerge } from '@lib/converters';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default createV1Handler(async (req, res) => {
  const { sources, strategy = 'deep' } = req.body || {};
  if (!Array.isArray(sources)) return res.status(400).json({ error: 'missing_field', field: 'sources', message: 'sources must be an array' });
  try {
    const output = jsonMerge(sources, strategy);
    return res.status(200).json({ output, strategy, fileCount: sources.length });
  } catch (e) {
    return res.status(400).json({ error: 'merge_failed', message: e.message });
  }
});
