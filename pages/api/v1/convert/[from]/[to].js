import { createV1Handler } from '@lib/v1Handler';
import * as conv from '@lib/converters';

const OUTPUT_LIMIT = 50 * 1024 * 1024; // 50 MB

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const SUPPORTED = {
  'json/csv':        async (input, opts) => ({ output: await conv.jsonToCsv(input), format: 'csv' }),
  'csv/json':        async (input, opts) => ({ output: await conv.csvToJson(input), format: 'json' }),
  'json/yaml':       (input, opts) => ({ output: conv.jsonToYaml(input), format: 'yaml' }),
  'yaml/json':       (input, opts) => ({ output: conv.yamlToJson(input), format: 'json' }),
  'json/xml':        (input, opts) => ({ output: conv.jsonToXml(input), format: 'xml' }),
  'xml/json':        (input, opts) => ({ output: conv.xmlToJson(input), format: 'json' }),
  'json/php':        (input, opts) => ({ output: conv.jsonToPhp(input), format: 'php' }),
  'php/json':        (input, opts) => ({ output: conv.phpToJson(input), format: 'json' }),
  'json/markdown':   (input, opts) => ({ output: conv.jsonToMarkdown(input), format: 'markdown' }),
  'markdown/json':   (input, opts) => ({ output: conv.markdownToJson(input), format: 'json' }),
  'json/html':       (input, opts) => ({ output: conv.jsonToHtml(input), format: 'html' }),
  'html/json':       (input, opts) => ({ output: conv.htmlToJson(input), format: 'json' }),
  'json/toml':       (input, opts) => ({ output: conv.jsonToToml(input), format: 'toml' }),
  'toml/json':       (input, opts) => ({ output: conv.tomlToJson(input), format: 'json' }),
  'json/sql':        (input, opts) => ({ output: conv.jsonToSql(input, opts?.tableName), format: 'sql' }),
  'sql/json':        (input, opts) => ({ output: conv.sqlToJson(input), format: 'json' }),
  'json/typescript': (input, opts) => ({ output: conv.jsonToTypescript(input, opts?.rootName), format: 'typescript' }),
  'typescript/json': (input, opts) => ({ output: conv.typescriptToJson(input), format: 'json' }),
  'json/excel': async (input, opts) => {
    const buf = await conv.jsonToExcel(input, opts?.sheetName);
    return { output: buf.toString('base64'), format: 'xlsx', encoding: 'base64' };
  },
  'excel/json': async (input, opts) => {
    if (typeof input !== 'string') throw new Error('Excel input must be a base64-encoded string.');
    return { output: await conv.excelToJson(input, opts?.sheetName), format: 'json' };
  },
};

export default createV1Handler(async (req, res) => {
  const { from, to } = req.query;
  const key = `${from}/${to}`;

  if (!SUPPORTED[key]) {
    return res.status(404).json({
      error: 'unsupported_conversion',
      supported: Object.keys(SUPPORTED),
    });
  }

  const { input, options } = req.body || {};
  if (input === undefined || input === null) {
    return res.status(400).json({ error: 'missing_field', field: 'input' });
  }

  const result = await SUPPORTED[key](input, options);

  const outputStr = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
  if (Buffer.byteLength(outputStr) > OUTPUT_LIMIT) {
    return res.status(413).json({ error: 'output_too_large', message: 'Output exceeds 50 MB limit.' });
  }

  return res.status(200).json(result);
});
