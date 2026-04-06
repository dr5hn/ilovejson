import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '@components/layout';
import { Search, Upload, FileJson, Download, RotateCcw, Sparkles, Keyboard, Check } from 'lucide-react';

const JsonView = dynamic(() => import('@uiw/react-json-view').then(mod => mod.default || mod), { ssr: false });

const QUERY_COLOR = '#eab308';

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
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

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

  const handleExecuteQuery = useCallback(async () => {
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
    formData.append('fileInfo', file);
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
  }, [file, query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteQuery();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExecuteQuery]);

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

  return (
    <Layout>
      <Head>
        <title>JSON Query - JMESPath Playground Online Free | ILoveJSON</title>
        <meta name="description" content="Query and filter JSON data using JMESPath expressions. Interactive playground with example queries — free online tool." />
      </Head>
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Title Section */}
        <div className="text-center py-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: QUERY_COLOR }}
            >
              <Search className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">JSON Query</h1>
          </div>
          <p className="text-muted-foreground text-sm">Query JSON data using JMESPath expressions</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* File Upload */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? 'border-amber-400 bg-amber-50 scale-[1.01]'
                      : file
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-border bg-card hover:border-amber-300'
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg text-white text-sm font-medium bg-emerald-500">
                        <FileJson className="w-5 h-5" />
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <Check className="w-5 h-5 text-emerald-500 ml-2" />
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">Drop JSON file here or click to browse</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Files are automatically deleted after 30 minutes.</p>
                    </div>
                  )}
                </div>

                {/* Query Input */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <span className="text-sm font-semibold text-foreground">JMESPath Query</span>
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., [*].name or [?age > `25`]"
                    className="w-full px-4 py-3 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) handleExecuteQuery();
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center justify-center p-4 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Query Results</span>
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Done
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md transition bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-card max-h-[500px] overflow-auto">
                      <JsonView
                        value={result.result || null}
                        collapsed={2}
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Examples */}
              <div>
                <div className="sticky top-20">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <span className="text-sm font-semibold text-foreground">Example Queries</span>
                    </div>
                    <div className="divide-y divide-border">
                      {EXAMPLE_QUERIES.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => { setQuery(example.query); setResult(null); }}
                          className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="font-medium text-sm text-foreground group-hover:text-amber-600">{example.label}</div>
                          <code className="block text-xs text-muted-foreground mt-0.5 font-mono">{example.query}</code>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">JMESPath Syntax</h4>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li><code className="font-mono">@</code> — Current node</li>
                      <li><code className="font-mono">[*]</code> — All elements</li>
                      <li><code className="font-mono">[?condition]</code> — Filter</li>
                      <li><code className="font-mono">field.nested</code> — Nested access</li>
                      <li><code className="font-mono">|</code> — Pipe expressions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-border bg-muted/20">
          <button
            onClick={handleExecuteQuery}
            disabled={!file || !query.trim() || loading}
            className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              backgroundColor: QUERY_COLOR,
              boxShadow: `0 8px 30px -8px ${QUERY_COLOR}66`,
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Execute Query
              </>
            )}
          </button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Keyboard className="w-3.5 h-3.5" />
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{isMac ? "⌘" : "Ctrl"}+Enter</kbd>
          </span>
        </div>
      </div>
    </Layout>
  );
}
