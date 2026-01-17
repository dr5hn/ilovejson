import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Head from 'next/head';
import Layout from '@components/layout';
import ReactJsonView from '@microlink/react-json-view';

const EXAMPLE_QUERIES = [
  { label: 'Select All', query: '@', description: 'Return entire JSON' },
  { label: 'Get Array Length', query: 'length(@)', description: 'Count items in root array' },
  { label: 'Filter Array', query: '[?age > `25`]', description: 'Filter items where age > 25' },
  { label: 'Map Names', query: '[*].name', description: 'Extract all name fields' },
  { label: 'First Item', query: '[0]', description: 'Get first item from array' },
  { label: 'Sort by Field', query: 'sort_by(@, &age)', description: 'Sort array by age field' },
  { label: 'Keys', query: 'keys(@)', description: 'Get all object keys' },
  { label: 'Nested Path', query: 'users[*].profile.email', description: 'Deep nested extraction' },
];

export default function JsonQuery() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  const handleExecuteQuery = async () => {
    if (!file) {
      setError('Please select a JSON file');
      return;
    }

    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', query);

    try {
      const response = await fetch('/api/jsonquery', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Query execution failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setQuery('');
    setResult(null);
    setError(null);
  };

  const handleDownload = () => {
    if (result?.data) {
      window.location.href = result.data;
    }
  };

  const applyExampleQuery = (exampleQuery) => {
    setQuery(exampleQuery);
    setResult(null);
  };

  return (
    <Layout>
      <Head>
        <title>JSON Query - JMESPath Playground | I ❤️ JSON</title>
        <meta name="description" content="Query and filter JSON data using JMESPath expressions. Interactive playground with example queries." />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-4">
            JSON Query
          </h1>
          <p className="text-lg text-gray-600 dark:text-dark-muted">
            Query JSON data using JMESPath expressions
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                JSON File
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : file
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div>
                    <svg className="mx-auto h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
                      Drop JSON file or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Query Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                JMESPath Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., [*].name or [?age > `25`]"
                className="w-full px-4 py-3 border dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleExecuteQuery();
                  }
                }}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-dark-muted">
                Press Enter or click Execute to run query
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExecuteQuery}
                disabled={!file || !query.trim() || loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Executing...
                  </span>
                ) : (
                  'Execute Query'
                )}
              </button>
              {result && (
                <>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                  Query Results
                </h3>
                <div className="border dark:border-dark-border rounded-lg overflow-hidden">
                  <ReactJsonView
                    src={result.result}
                    theme="rjv-default"
                    collapsed={2}
                    displayDataTypes={false}
                    displayObjectSize={true}
                    enableClipboard={true}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Examples */}
          <div>
            <div className="sticky top-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
                Example Queries
              </h3>
              <div className="space-y-2">
                {EXAMPLE_QUERIES.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => applyExampleQuery(example.query)}
                    className="w-full text-left p-3 border dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors group"
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {example.label}
                    </div>
                    <code className="block text-xs text-gray-600 dark:text-dark-muted mt-1 font-mono">
                      {example.query}
                    </code>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {example.description}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 border dark:border-dark-border rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  JMESPath Syntax
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li><code>@</code> - Current node</li>
                  <li><code>[*]</code> - All elements</li>
                  <li><code>[?condition]</code> - Filter</li>
                  <li><code>field.nested</code> - Nested access</li>
                  <li><code>|</code> - Pipe expressions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
