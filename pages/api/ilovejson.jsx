import { withErrorTracking } from '@middleware/errorHandler';

const handler = (_req, res) => {
  res.status(200).json({ message: 'I ❤️ JSON' })
}

export default withErrorTracking(handler, { tool: 'ilovejson' });
