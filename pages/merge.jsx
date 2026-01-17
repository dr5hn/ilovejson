import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Head from 'next/head';
import Layout from '@components/layout';

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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-4">
            JSON Merge
          </h1>
          <p className="text-lg text-gray-600 dark:text-dark-muted">
            Merge multiple JSON files into one with different strategies
          </p>
        </div>

        {!result && (
          <>
            {/* File Upload Section */}
            <div className="mb-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <input {...getInputProps()} />
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
                  Drop JSON files here or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">
                  Upload 2-10 files to merge
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
                  Selected Files ({files.length}/10)
                </h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-surface"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-muted">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merge Strategy Selection */}
            {files.length >= 2 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
                  Merge Strategy
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    strategy === 'deep'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="strategy"
                      value="deep"
                      checked={strategy === 'deep'}
                      onChange={(e) => setStrategy(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-dark-text">Deep Merge</div>
                      <div className="text-sm text-gray-600 dark:text-dark-muted">
                        Recursively merge nested objects (recommended)
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    strategy === 'shallow'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="strategy"
                      value="shallow"
                      checked={strategy === 'shallow'}
                      onChange={(e) => setStrategy(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-dark-text">Shallow Merge</div>
                      <div className="text-sm text-gray-600 dark:text-dark-muted">
                        Merge only top-level properties
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    strategy === 'concat'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="strategy"
                      value="concat"
                      checked={strategy === 'concat'}
                      onChange={(e) => setStrategy(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-dark-text">Concat Arrays</div>
                      <div className="text-sm text-gray-600 dark:text-dark-muted">
                        Concatenate arrays instead of replacing
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    strategy === 'unique'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="strategy"
                      value="unique"
                      checked={strategy === 'unique'}
                      onChange={(e) => setStrategy(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-dark-text">Unique Arrays</div>
                      <div className="text-sm text-gray-600 dark:text-dark-muted">
                        Merge arrays with unique values only
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleMerge}
                disabled={files.length < 2 || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Merging...
                  </span>
                ) : (
                  `Merge ${files.length} Files`
                )}
              </button>
            </div>
          </>
        )}

        {/* Success Result */}
        {result && (
          <div className="space-y-6">
            <div className="p-6 border border-green-200 dark:border-green-900/50 rounded-lg bg-green-50 dark:bg-green-900/10 text-center">
              <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-green-900 dark:text-green-200 mb-2">
                Merge Successful!
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-4">
                {result.message}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Download Merged File
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Merge More Files
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
