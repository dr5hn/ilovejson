const CONVERSIONS = [
  'json/csv','csv/json','json/yaml','yaml/json','json/xml','xml/json',
  'json/php','php/json','json/markdown','markdown/json','json/html','html/json',
  'json/toml','toml/json','json/sql','sql/json','json/typescript','typescript/json',
  'json/excel','excel/json',
];

function buildSpec(baseUrl) {
  const convertPaths = {};
  CONVERSIONS.forEach(pair => {
    const [from, to] = pair.split('/');
    convertPaths[`/api/v1/convert/${from}/${to}`] = {
      post: {
        tags: ['Conversions'],
        summary: `Convert ${from.toUpperCase()} to ${to.toUpperCase()}`,
        operationId: `convert_${from}_${to}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['input'],
                properties: {
                  input: { description: 'Input data (string for text formats, object/array for JSON)' },
                  options: { type: 'object', description: 'Conversion options (tableName, rootName, sheetName, etc.)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Successful conversion', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConvertResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    };
  });

  return {
    openapi: '3.1.0',
    info: {
      title: 'ILoveJSON API',
      version: '1.0.0',
      description: 'Public REST API for JSON conversion and utility tools. Authenticate with API tokens from /dashboard/api-tokens.',
      contact: { url: 'https://www.ilovejson.com' },
    },
    servers: [{ url: baseUrl, description: 'Production' }],
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Conversions', description: 'Convert between JSON and other formats' },
      { name: 'Utilities', description: 'JSON utility operations' },
      { name: 'Tokens', description: 'API token management (session auth)' },
    ],
    paths: {
      ...convertPaths,
      '/api/v1/validate': {
        post: {
          tags: ['Utilities'], summary: 'Validate JSON', operationId: 'validate',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['input'], properties: { input: {} } } } } },
          responses: {
            200: { description: 'Validation result', content: { 'application/json': { schema: { type: 'object', properties: { valid: { type: 'boolean' }, errors: { type: 'array' } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/v1/beautify': {
        post: {
          tags: ['Utilities'], summary: 'Beautify JSON', operationId: 'beautify',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['input'], properties: { input: {}, indent: { type: 'integer', default: 4 } } } } } },
          responses: { 200: { $ref: '#/components/responses/TextOutput' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/v1/compress': {
        post: {
          tags: ['Utilities'], summary: 'Compress / minify JSON', operationId: 'compress',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['input'], properties: { input: {} } } } } },
          responses: { 200: { $ref: '#/components/responses/TextOutput' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/v1/diff': {
        post: {
          tags: ['Utilities'], summary: 'Diff two JSON values', operationId: 'diff',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['left', 'right'], properties: { left: {}, right: {} } } } } },
          responses: { 200: { description: 'Diff result' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/v1/merge': {
        post: {
          tags: ['Utilities'], summary: 'Merge multiple JSON objects', operationId: 'merge',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['sources'], properties: { sources: { type: 'array', minItems: 2, maxItems: 10 }, strategy: { type: 'string', enum: ['deep', 'shallow', 'concat', 'unique'], default: 'deep' } } } } } },
          responses: { 200: { description: 'Merged result' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/v1/query': {
        post: {
          tags: ['Utilities'], summary: 'JMESPath query on JSON', operationId: 'query',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['input', 'expr'], properties: { input: {}, expr: { type: 'string', description: 'JMESPath expression' } } } } } },
          responses: { 200: { description: 'Query result' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/v1/schema': {
        post: {
          tags: ['Utilities'], summary: 'Generate JSON Schema from data', operationId: 'schema',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['input'], properties: { input: {} } } } } },
          responses: { 200: { description: 'JSON Schema', content: { 'application/json': { schema: { type: 'object', properties: { schema: { type: 'object' } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/v1/faker': {
        post: {
          tags: ['Utilities'], summary: 'Generate fake JSON data', operationId: 'faker',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['schema'], properties: { schema: { type: 'object' }, count: { type: 'integer', minimum: 1, maximum: 10000, default: 10 }, seed: { type: 'integer' } } } } } },
          responses: { 200: { description: 'Generated data' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', description: 'API token from /dashboard/api-tokens. Format: Bearer ilj_...' },
      },
      schemas: {
        ConvertResponse: {
          type: 'object',
          properties: {
            output: { description: 'Converted output (string, object, or base64 for Excel)' },
            format: { type: 'string' },
            encoding: { type: 'string', enum: ['base64'], description: 'Present only when output is base64-encoded (Excel)' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
      responses: {
        Unauthorized: { description: 'Missing or invalid token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, examples: { missing: { value: { error: 'missing_token' } }, invalid: { value: { error: 'invalid_token' } } } } } },
        RateLimited: { description: 'Rate limit exceeded', headers: { 'Retry-After': { schema: { type: 'integer' } }, 'X-RateLimit-Limit': { schema: { type: 'integer' } }, 'X-RateLimit-Remaining': { schema: { type: 'integer' } }, 'X-RateLimit-Reset': { schema: { type: 'string', format: 'date-time' } } }, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'rate_limit_exceeded' } } } },
        BadRequest: { description: 'Invalid request body', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        TextOutput: { description: 'Successful output', content: { 'application/json': { schema: { type: 'object', properties: { output: { type: 'string' }, format: { type: 'string' } } } } } },
      },
    },
  };
}

export default function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.ilovejson.com';
  const baseUrl = `${proto}://${host}`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(buildSpec(baseUrl));
}
