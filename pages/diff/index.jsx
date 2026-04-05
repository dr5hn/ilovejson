import { useState, useRef } from 'react';
import Head from 'next/head';
import Layout from '@components/layout';
import AlertError from '@components/error';
import diff from 'microdiff';

const JSONDiff = () => {
  const [sourceJSON1, setSourceJSON1] = useState('');
  const [sourceJSON2, setSourceJSON2] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const handleCompare = () => {
    try {
      const obj1 = JSON.parse(sourceJSON1);
      const obj2 = JSON.parse(sourceJSON2);

      const differences = diff(obj1, obj2);
      setDiffResult(differences);
      setShowError(false);
    } catch (e) {
      setErrorMessage('Invalid JSON in one or both inputs.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const formatDiff = (differences) => {
    if (!differences || differences.length === 0) {
      return 'No differences found. The JSON objects are identical.';
    }

    return differences
      .map((d, i) => {
        const path = d.path.join('.');
        switch (d.type) {
          case 'CREATE':
            return `[${i + 1}] ADDED at "${path}": ${JSON.stringify(d.value)}`;
          case 'REMOVE':
            return `[${i + 1}] DELETED at "${path}": ${JSON.stringify(d.oldValue)}`;
          case 'CHANGE':
            return `[${i + 1}] EDITED at "${path}": ${JSON.stringify(d.oldValue)} -> ${JSON.stringify(d.value)}`;
          default:
            return `[${i + 1}] UNKNOWN at "${path}"`;
        }
      })
      .join('\n');
  };

  const copyToClipboard = () => {
    if (outputRef.current) {
      navigator.clipboard.writeText(outputRef.current.value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const getSummary = () => {
    if (!diffResult) return null;
    if (diffResult.length === 0)
      return { added: 0, deleted: 0, edited: 0 };
    return {
      added: diffResult.filter((d) => d.type === 'CREATE').length,
      deleted: diffResult.filter((d) => d.type === 'REMOVE').length,
      edited: diffResult.filter((d) => d.type === 'CHANGE').length,
    };
  };

  const summary = getSummary();

  return (
    <Layout title="JSON Diff" description="Compare two JSON files and find differences.">
      <Head>
        <title>JSON Diff - Compare JSON Files Online Free | ILoveJSON</title>
        <meta name="description" content="Compare two JSON files and find differences instantly. Free online JSON diff tool — highlight additions, deletions, and changes." />
      </Head>
      <div className="app mt-5 w-full h-full p-8 font-sans">
        <div className="row sm:flex">
          <div className="col sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border box-height">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Original JSON
                </h3>
              </div>
              <textarea
                className="resize-none border-0 rounded text-grey-darkest dark:text-dark-text flex-1 p-2 m-1 bg-transparent"
                value={sourceJSON1}
                onChange={(e) => setSourceJSON1(e.target.value)}
                placeholder="Paste first JSON here..."
              />
            </div>
          </div>

          <div className="col mt-8 sm:ml-8 sm:mt-0 sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border box-height">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Modified JSON
                </h3>
              </div>
              <textarea
                className="resize-none border-0 rounded text-grey-darkest dark:text-dark-text flex-1 p-2 m-1 bg-transparent"
                value={sourceJSON2}
                onChange={(e) => setSourceJSON2(e.target.value)}
                placeholder="Paste second JSON here..."
              />
            </div>
          </div>
        </div>

        <AlertError message={errorMessage} showError={showError} />

        <div className="row sm:flex mt-5">
          <button
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow mx-auto disabled:opacity-50"
            onClick={handleCompare}
            disabled={!sourceJSON1 || !sourceJSON2}
          >
            Compare
          </button>
        </div>

        {diffResult !== null && (
          <div className="mt-8">
            {summary && (
              <div className="flex gap-4 mb-4 justify-center flex-wrap">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm">
                  + Added: {summary.added}
                </span>
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">
                  - Deleted: {summary.deleted}
                </span>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-sm">
                  ~ Edited: {summary.edited}
                </span>
              </div>
            )}
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border flex justify-between items-center">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Differences ({diffResult.length} found)
                </h3>
                <div className="flex items-center">
                  <span
                    className={`mr-2 text-xs text-green-400 ${copied ? 'visible' : 'invisible'}`}
                  >
                    Copied!
                  </span>
                  <button
                    className="py-1 px-4 shadow rounded-sm bg-green-400 text-white text-xs hover:bg-green-600"
                    onClick={copyToClipboard}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <textarea
                ref={outputRef}
                className="resize-none border-0 rounded text-grey-darkest dark:text-dark-text flex-1 p-4 m-1 bg-transparent font-mono text-sm"
                value={formatDiff(diffResult)}
                readOnly
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default JSONDiff;
