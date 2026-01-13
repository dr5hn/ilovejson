import { useState, useRef } from 'react';
import Layout from '@components/layout';
import AlertError from '@components/error';
import jmespath from 'jmespath';

const JSONQuery = () => {
  const [sourceJSON, setSourceJSON] = useState('');
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const exampleQueries = [
    { query: 'people[0].name', desc: 'First person name' },
    { query: 'people[*].name', desc: 'All names' },
    { query: 'people[?age > `18`]', desc: 'Adults only' },
    { query: 'length(people)', desc: 'Count people' },
    { query: 'people | [0]', desc: 'Pipe to first' },
  ];

  const sampleJSON = JSON.stringify(
    {
      people: [
        { name: 'Alice', age: 25, city: 'NYC' },
        { name: 'Bob', age: 17, city: 'LA' },
        { name: 'Charlie', age: 30, city: 'Chicago' },
      ],
    },
    null,
    2
  );

  const handleQuery = () => {
    try {
      const parsedJSON = JSON.parse(sourceJSON);
      const result = jmespath.search(parsedJSON, query);
      setQueryResult(JSON.stringify(result, null, 2));
      setShowError(false);
    } catch (e) {
      setErrorMessage(e.message || 'Invalid JSON or JMESPath query.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const loadSample = () => {
    setSourceJSON(sampleJSON);
  };

  const applyExample = (exampleQuery) => {
    setQuery(exampleQuery);
  };

  const copyToClipboard = () => {
    if (outputRef.current) {
      outputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Layout
      title="JSON Query"
      description="Query JSON data using JMESPath expressions."
    >
      <div className="app mt-5 w-full h-full p-8 font-sans">
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300">
                JMESPath Query Language
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Use JMESPath expressions to extract and transform JSON data.
                <a
                  href="https://jmespath.org/tutorial.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline"
                >
                  Learn more
                </a>
              </p>
            </div>
            <button
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={loadSample}
            >
              Load Sample
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {exampleQueries.map((ex, i) => (
              <button
                key={i}
                className="text-xs bg-white dark:bg-dark-surface border border-blue-300 dark:border-blue-700 rounded px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300"
                onClick={() => applyExample(ex.query)}
                title={ex.desc}
              >
                {ex.query}
              </button>
            ))}
          </div>
        </div>

        <div className="row sm:flex">
          <div className="col sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border box-height">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Input JSON
                </h3>
              </div>
              <textarea
                className="resize-none border-0 rounded text-grey-darkest dark:text-dark-text flex-1 p-2 m-1 bg-transparent font-mono text-sm"
                value={sourceJSON}
                onChange={(e) => setSourceJSON(e.target.value)}
                placeholder="Paste JSON here..."
              />
            </div>
          </div>

          <div className="col mt-8 sm:ml-8 sm:mt-0 sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border box-height">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border flex justify-between items-center">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Query Result
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
                    disabled={!queryResult}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <textarea
                ref={outputRef}
                className="resize-none border-0 rounded text-grey-darkest dark:text-dark-text flex-1 p-2 m-1 bg-transparent font-mono text-sm"
                value={queryResult}
                readOnly
                placeholder="Query result will appear here..."
              />
            </div>
          </div>
        </div>

        <AlertError message={errorMessage} showError={showError} />

        <div className="mt-4">
          <label className="block text-gray-700 dark:text-dark-text font-medium mb-2">
            JMESPath Query:
          </label>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              className="flex-1 min-w-0 border rounded px-4 py-2 bg-white dark:bg-dark-surface dark:text-dark-text dark:border-dark-border font-mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., people[*].name"
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            />
            <button
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow disabled:opacity-50"
              onClick={handleQuery}
              disabled={!sourceJSON || !query}
            >
              Query
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JSONQuery;
