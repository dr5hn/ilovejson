import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Head from 'next/head';
import Layout from '@components/layout';
import DiffViewer from '@components/DiffViewer';

export default function JsonDiff() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop1 = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile1(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const onDrop2 = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile2(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps: getRootProps1, getInputProps: getInputProps1, isDragActive: isDragActive1 } = useDropzone({
    onDrop: onDrop1,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  const { getRootProps: getRootProps2, getInputProps: getInputProps2, isDragActive: isDragActive2 } = useDropzone({
    onDrop: onDrop2,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Please select both files to compare');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const response = await fetch('/api/jsondiff', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Comparison failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile1(null);
    setFile2(null);
    setResult(null);
    setError(null);
  };

  return (
    <Layout>
      <Head>
        <title>JSON Diff - Compare Two JSON Files | I ❤️ JSON</title>
        <meta name="description" content="Compare two JSON files and see the differences. Visual diff viewer with additions, deletions, and modifications highlighted." />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-4">
            JSON Diff
          </h1>
          <p className="text-lg text-gray-600 dark:text-dark-muted">
            Compare two JSON files and visualize the differences
          </p>
        </div>

        {/* File Upload Section */}
        {!result && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* File 1 Dropzone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                Original File
              </label>
              <div
                {...getRootProps1()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive1
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : file1
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <input {...getInputProps1()} />
                {file1 ? (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text">
                      {file1.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      {(file1.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
                      Drop JSON file here or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File 2 Dropzone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                Modified File
              </label>
              <div
                {...getRootProps2()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive2
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : file2
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <input {...getInputProps2()} />
                {file2 ? (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text">
                      {file2.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      {(file2.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
                      Drop JSON file here or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!result && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleCompare}
              disabled={!file1 || !file2 || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Comparing...
                </span>
              ) : (
                'Compare Files'
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <DiffViewer differences={result.differences} summary={result.summary} />

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Compare Different Files
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
