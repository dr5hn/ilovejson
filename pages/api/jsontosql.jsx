import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontosql';
const downloadDir = globals.downloadDir + '/jsontosql';

export const config = {
  api: {
    bodyParser: false,
  },
};

function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonToSQL(jsonData, tableName = 'data') {
  if (!Array.isArray(jsonData)) {
    jsonData = [jsonData];
  }

  if (jsonData.length === 0) {
    return '-- No data to insert';
  }

  const statements = [];

  for (const row of jsonData) {
    const columns = Object.keys(row);
    const values = columns.map((col) => escapeValue(row[col]));

    statements.push(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`
    );
  }

  return statements.join('\n');
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }),
  ]);

  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);

  const tableName = req.uploadedFile.fields?.tableName || 'data';
  const sqlOutput = jsonToSQL(jsonData, tableName);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.sql`;
  fs.writeFileSync(outputFilePath, sqlOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to SQL Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
