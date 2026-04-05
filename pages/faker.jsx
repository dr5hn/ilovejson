import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '@components/layout';
import { Dices, Plus, Trash2, Download, RotateCcw, Sparkles, Keyboard } from 'lucide-react';

const JsonView = dynamic(() => import('@uiw/react-json-view').then(mod => mod.default || mod), { ssr: false });

const FAKER_COLOR = '#ec4899';

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

      <div className="flex-1 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Title Section */}
        <div className="text-center py-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: FAKER_COLOR }}
            >
              <Dices className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">JSON Faker</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Generate realistic fake JSON data for testing and development
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            {!result ? (
              <div className="space-y-6">
                {/* Templates */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Quick Templates
                  </label>
                  <div className="flex gap-2">
                    {['users', 'products', 'posts'].map((tmpl) => (
                      <button
                        key={tmpl}
                        onClick={() => loadTemplate(tmpl)}
                        className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                      >
                        {tmpl === 'posts' ? 'Blog Posts' : tmpl.charAt(0).toUpperCase() + tmpl.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schema Builder */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-foreground">
                      Schema Fields
                    </label>
                    <button
                      onClick={addField}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium"
                      style={{ backgroundColor: FAKER_COLOR }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Field
                    </button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                      <Dices className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
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
                          <div key={field.id} className="p-4 border border-border rounded-lg bg-card">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateField(field.id, { name: e.target.value })}
                                placeholder="Field name"
                                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                              />

                              <select
                                value={field.type}
                                onChange={(e) => updateField(field.id, { type: e.target.value, subtype: FIELD_TYPES.find(t => t.value === e.target.value)?.subtypes?.[0] || '' })}
                                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                              >
                                {FIELD_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>

                              {hasSubtypes ? (
                                <select
                                  value={field.subtype}
                                  onChange={(e) => updateField(field.id, { subtype: e.target.value })}
                                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                                >
                                  {fieldType.subtypes.map(subtype => (
                                    <option key={subtype} value={subtype}>{subtype}</option>
                                  ))}
                                </select>
                              ) : needsRange ? (
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={field.min}
                                    onChange={(e) => updateField(field.id, { min: parseInt(e.target.value) })}
                                    placeholder="Min"
                                    className="w-1/2 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                                  />
                                  <input
                                    type="number"
                                    value={field.max}
                                    onChange={(e) => updateField(field.id, { max: parseInt(e.target.value) })}
                                    placeholder="Max"
                                    className="w-1/2 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                                  />
                                </div>
                              ) : (
                                <div />
                              )}

                              <button
                                onClick={() => removeField(field.id)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                            {needsRange && hasSubtypes && (
                              <div className="flex gap-2 mt-3">
                                <input
                                  type="number"
                                  value={field.min}
                                  onChange={(e) => updateField(field.id, { min: parseInt(e.target.value) })}
                                  placeholder="Min"
                                  className="w-24 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                                />
                                <input
                                  type="number"
                                  value={field.max}
                                  onChange={(e) => updateField(field.id, { max: parseInt(e.target.value) })}
                                  placeholder="Max"
                                  className="w-24 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Generation Options */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Number of Records
                    </label>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => setCount(Math.min(10000, Math.max(1, parseInt(e.target.value) || 1)))}
                      min="1"
                      max="10000"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Max: 10,000 records
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Seed (optional)
                    </label>
                    <input
                      type="text"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="e.g., 12345"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use same seed for reproducible data
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex flex-col items-center text-center p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center mb-2">
                      <span className="text-red-500 text-lg">!</span>
                    </div>
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Results */
              <div className="space-y-6">
                <div className="p-6 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-full font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      Generation Successful!
                    </span>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm mb-4">
                    {result.message}
                  </p>

                  {/* Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Preview (first 3 records)
                    </h4>
                    <div className="border border-border rounded-lg overflow-hidden bg-card">
                      <JsonView
                        value={result.preview}
                        collapsed={false}
                        style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                      style={{
                        backgroundColor: '#10b981',
                        boxShadow: '0 8px 30px -8px #10b98166',
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download All {result.count} Records
                    </button>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground font-semibold rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Generate More Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        {!result && (
          <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-border bg-muted/20">
            <button
              onClick={handleGenerate}
              disabled={fields.length === 0 || loading}
              className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                backgroundColor: FAKER_COLOR,
                boxShadow: `0 8px 30px -8px ${FAKER_COLOR}66`,
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Dices className="w-4 h-4" />
                  {`Generate ${count} Records`}
                </>
              )}
            </button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Keyboard className="w-3.5 h-3.5" />
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+Enter</kbd>
            </span>
          </div>
        )}
      </div>
    </Layout>
  );
}
