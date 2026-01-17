import { useState } from 'react';
import Head from 'next/head';
import Layout from '@components/layout';
import ReactJsonView from '@microlink/react-json-view';

const FIELD_TYPES = [
  { value: 'name', label: 'Name', subtypes: ['fullName', 'firstName', 'lastName'] },
  { value: 'email', label: 'Email', subtypes: [] },
  { value: 'phone', label: 'Phone', subtypes: [] },
  { value: 'address', label: 'Address', subtypes: ['full', 'street', 'city', 'state', 'country', 'zipCode'] },
  { value: 'date', label: 'Date', subtypes: ['anytime', 'past', 'future', 'recent', 'birthdate'] },
  { value: 'number', label: 'Number', subtypes: ['int', 'float'] },
  { value: 'boolean', label: 'Boolean', subtypes: [] },
  { value: 'uuid', label: 'UUID', subtypes: [] },
  { value: 'lorem', label: 'Lorem Text', subtypes: ['sentence', 'word', 'words', 'paragraph'] },
  { value: 'image', label: 'Image', subtypes: ['url', 'avatar'] },
  { value: 'company', label: 'Company', subtypes: ['name', 'catchPhrase'] },
  { value: 'internet', label: 'Internet', subtypes: ['url', 'username', 'domainName', 'ipAddress'] },
];

export default function JsonFaker() {
  const [fields, setFields] = useState([]);
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const addField = () => {
    setFields([
      ...fields,
      {
        id: Date.now(),
        name: `field${fields.length + 1}`,
        type: 'name',
        subtype: 'fullName',
        min: 0,
        max: 100,
      },
    ]);
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
    setResult(null);
  };

  const updateField = (id, updates) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    setResult(null);
  };

  const handleGenerate = async () => {
    if (fields.length === 0) {
      setError('Please add at least one field');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Build schema from fields
    const schema = {};
    fields.forEach(field => {
      schema[field.name] = {
        type: field.type,
        subtype: field.subtype,
        min: field.min,
        max: field.max,
      };
    });

    try {
      const response = await fetch('/api/jsonfaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema, count, seed: seed || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFields([]);
    setCount(10);
    setSeed('');
    setResult(null);
    setError(null);
  };

  const handleDownload = () => {
    if (result?.data) {
      window.location.href = result.data;
    }
  };

  const loadTemplate = (template) => {
    if (template === 'users') {
      setFields([
        { id: 1, name: 'id', type: 'uuid', subtype: '', min: 0, max: 100 },
        { id: 2, name: 'name', type: 'name', subtype: 'fullName', min: 0, max: 100 },
        { id: 3, name: 'email', type: 'email', subtype: '', min: 0, max: 100 },
        { id: 4, name: 'phone', type: 'phone', subtype: '', min: 0, max: 100 },
        { id: 5, name: 'age', type: 'number', subtype: 'int', min: 18, max: 80 },
        { id: 6, name: 'avatar', type: 'image', subtype: 'avatar', min: 0, max: 100 },
      ]);
    } else if (template === 'products') {
      setFields([
        { id: 1, name: 'id', type: 'uuid', subtype: '', min: 0, max: 100 },
        { id: 2, name: 'name', type: 'lorem', subtype: 'words', min: 2, max: 4 },
        { id: 3, name: 'description', type: 'lorem', subtype: 'sentence', min: 0, max: 100 },
        { id: 4, name: 'price', type: 'number', subtype: 'float', min: 10, max: 1000 },
        { id: 5, name: 'company', type: 'company', subtype: 'name', min: 0, max: 100 },
      ]);
    } else if (template === 'posts') {
      setFields([
        { id: 1, name: 'id', type: 'uuid', subtype: '', min: 0, max: 100 },
        { id: 2, name: 'title', type: 'lorem', subtype: 'sentence', min: 0, max: 100 },
        { id: 3, name: 'content', type: 'lorem', subtype: 'paragraph', min: 0, max: 100 },
        { id: 4, name: 'author', type: 'name', subtype: 'fullName', min: 0, max: 100 },
        { id: 5, name: 'createdAt', type: 'date', subtype: 'recent', min: 0, max: 100 },
      ]);
    }
    setResult(null);
  };

  return (
    <Layout>
      <Head>
        <title>JSON Faker - Generate Fake JSON Data | I ❤️ JSON</title>
        <meta name="description" content="Generate realistic fake JSON data for testing and development. Build custom schemas with various data types." />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-4">
            JSON Faker
          </h1>
          <p className="text-lg text-gray-600 dark:text-dark-muted">
            Generate realistic fake JSON data for testing and development
          </p>
        </div>

        {!result && (
          <div className="space-y-6">
            {/* Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                Quick Templates
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => loadTemplate('users')}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Users
                </button>
                <button
                  onClick={() => loadTemplate('products')}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Products
                </button>
                <button
                  onClick={() => loadTemplate('posts')}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Blog Posts
                </button>
              </div>
            </div>

            {/* Schema Builder */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                  Schema Fields
                </label>
                <button
                  onClick={addField}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="p-8 border-2 border-dashed dark:border-dark-border rounded-lg text-center">
                  <p className="text-gray-500 dark:text-dark-muted">
                    No fields yet. Add a field or use a template to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field) => {
                    const fieldType = FIELD_TYPES.find(t => t.value === field.type);
                    const hasSubtypes = fieldType?.subtypes?.length > 0;
                    const needsRange = field.type === 'number';

                    return (
                      <div key={field.id} className="p-4 border dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-surface">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            placeholder="Field name"
                            className="px-3 py-2 border dark:border-dark-border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-dark-text text-sm"
                          />

                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value, subtype: FIELD_TYPES.find(t => t.value === e.target.value)?.subtypes?.[0] || '' })}
                            className="px-3 py-2 border dark:border-dark-border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-dark-text text-sm"
                          >
                            {FIELD_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>

                          {hasSubtypes && (
                            <select
                              value={field.subtype}
                              onChange={(e) => updateField(field.id, { subtype: e.target.value })}
                              className="px-3 py-2 border dark:border-dark-border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-dark-text text-sm"
                            >
                              {fieldType.subtypes.map(subtype => (
                                <option key={subtype} value={subtype}>{subtype}</option>
                              ))}
                            </select>
                          )}

                          {needsRange && (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={field.min}
                                onChange={(e) => updateField(field.id, { min: parseInt(e.target.value) })}
                                placeholder="Min"
                                className="w-1/2 px-3 py-2 border dark:border-dark-border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-dark-text text-sm"
                              />
                              <input
                                type="number"
                                value={field.max}
                                onChange={(e) => updateField(field.id, { max: parseInt(e.target.value) })}
                                placeholder="Max"
                                className="w-1/2 px-3 py-2 border dark:border-dark-border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-dark-text text-sm"
                              />
                            </div>
                          )}

                          <button
                            onClick={() => removeField(field.id)}
                            className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Generation Options */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                  Number of Records
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.min(10000, Math.max(1, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="10000"
                  className="w-full px-4 py-2 border dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-dark-muted">
                  Max: 10,000 records
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                  Seed (optional)
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="e.g., 12345"
                  className="w-full px-4 py-2 border dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-dark-muted">
                  Use same seed for reproducible data
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGenerate}
                disabled={fields.length === 0 || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  `Generate ${count} Records`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="p-6 border border-green-200 dark:border-green-900/50 rounded-lg bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-green-900 dark:text-green-200">
                    Generation Successful!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                  Preview (first 3 records)
                </h4>
                <div className="border dark:border-dark-border rounded-lg overflow-hidden">
                  <ReactJsonView
                    src={result.preview}
                    theme="rjv-default"
                    collapsed={false}
                    displayDataTypes={false}
                    enableClipboard={true}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Download All {result.count} Records
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Generate More Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
