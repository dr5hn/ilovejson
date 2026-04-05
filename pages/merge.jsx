import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Head from 'next/head';
import Layout from '@components/layout';
import { Merge, Upload, X, FileJson, Download, RotateCcw, Sparkles, Check } from 'lucide-react';

const MERGE_COLOR = '#3b82f6';

const STRATEGIES = [
  { value: 'deep', label: 'Deep Merge', description: 'Recursively merge nested objects (recommended)' },
  { value: 'shallow', label: 'Shallow Merge', description: 'Merge only top-level properties' },
  { value: 'concat', label: 'Concat Arrays', description: 'Concatenate arrays instead of replacing' },
  { value: 'unique', label: 'Unique Arrays', description: 'Merge arrays with unique values only' },
];

export default function JsonMerge() {
  const [files, setFiles] = useState([]);
  const [strategy, setStrategy] = useState('deep');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 10));
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: true,
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 files to merge');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('strategy', strategy);

    try {
      const response = await fetch('/api/jsonmerge', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Merge failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setStrategy('deep');
  };

  const handleDownload = () => {
    if (result?.data) {
      window.location.href = result.data;
    }
  };

  return (
    <Layout>
      <Head>
        <title>JSON Merge - Merge Multiple JSON Files | I ❤️ JSON</title>
        <meta name="description" content="Merge multiple JSON files into one. Choose from different merge strategies: deep, shallow, concat arrays, or unique values." />
      </Head>

      <div className="flex-1 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Title Section */}
        <div className="text-center py-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: MERGE_COLOR }}
            >
              <Merge className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">JSON Merge</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Merge multiple JSON files into one with different strategies
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            {!result ? (
              <div className="space-y-6">
                {/* File Upload Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
                      : 'border-border bg-card hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Drop JSON files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload 2-10 files to merge
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Uploaded files are automatically deleted after 30 minutes.
                  </p>
                </div>

                {/* Selected Files List */}
                {files.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">
                        Selected Files ({files.length}/10)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)} KB total
                      </span>
                    </div>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-medium"
                              style={{ backgroundColor: MERGE_COLOR }}
                            >
                              <FileJson className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Merge Strategy Selection */}
                {files.length >= 2 && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-3">
                      Merge Strategy
                    </label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {STRATEGIES.map((s) => (
                        <label
                          key={s.value}
                          className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            strategy === s.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name="strategy"
                            value={s.value}
                            checked={strategy === s.value}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="mt-1 accent-blue-500"
                          />
                          <div>
                            <div className="font-medium text-foreground text-sm">{s.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {s.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

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
              /* Success Result */
              <div className="space-y-6">
                <div className="p-6 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-full font-medium mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Merge Successful!
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm mt-2 mb-6">
                    {result.message}
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                      style={{
                        backgroundColor: '#10b981',
                        boxShadow: '0 8px 30px -8px #10b98166',
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download Merged File
                    </button>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground font-semibold rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Merge More Files
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
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                backgroundColor: MERGE_COLOR,
                boxShadow: `0 8px 30px -8px ${MERGE_COLOR}66`,
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="w-4 h-4" />
                  {`Merge ${files.length} Files`}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
