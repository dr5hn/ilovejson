import { useState, useRef } from 'react';
import Layout from '@components/layout';
import AlertError from '@components/error';
import { faker } from '@faker-js/faker';

const JSONFaker = () => {
  const [schema, setSchema] = useState('');
  const [count, setCount] = useState(5);
  const [generatedData, setGeneratedData] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const fakerCategories = {
    person: ['firstName', 'lastName', 'fullName', 'gender', 'jobTitle'],
    internet: ['email', 'userName', 'password', 'url', 'ip'],
    location: ['city', 'country', 'state', 'streetAddress', 'zipCode'],
    phone: ['number'],
    commerce: ['price', 'productName', 'department'],
    date: ['past', 'future', 'recent'],
    lorem: ['word', 'words', 'sentence', 'paragraph'],
    string: ['uuid'],
    company: ['name', 'catchPhrase'],
  };

  const sampleSchema = JSON.stringify(
    {
      id: '{{string.uuid}}',
      firstName: '{{person.firstName}}',
      lastName: '{{person.lastName}}',
      email: '{{internet.email}}',
      age: '{{number.int(18,65)}}',
      city: '{{location.city}}',
      bio: '{{lorem.sentence}}',
    },
    null,
    2
  );

  const loadSample = () => {
    setSchema(sampleSchema);
  };

  const generateValue = (template) => {
    const match = template.match(/\{\{(\w+)\.(\w+)(?:\(([^)]*)\))?\}\}/);
    if (!match) return template;

    const [, category, method, args] = match;

    try {
      const fakerCategory = faker[category];
      if (!fakerCategory || typeof fakerCategory[method] !== 'function') {
        return template;
      }

      if (args) {
        const parsedArgs = args.split(',').map((arg) => {
          const trimmed = arg.trim();
          if (!isNaN(Number(trimmed))) return Number(trimmed);
          return trimmed.replace(/['"]/g, '');
        });
        return fakerCategory[method](...parsedArgs);
      }

      return fakerCategory[method]();
    } catch (e) {
      return template;
    }
  };

  const processSchema = (schemaObj) => {
    if (typeof schemaObj === 'string') {
      return generateValue(schemaObj);
    }

    if (Array.isArray(schemaObj)) {
      return schemaObj.map((item) => processSchema(item));
    }

    if (typeof schemaObj === 'object' && schemaObj !== null) {
      const result = {};
      for (const key in schemaObj) {
        result[key] = processSchema(schemaObj[key]);
      }
      return result;
    }

    return schemaObj;
  };

  const handleGenerate = () => {
    try {
      const parsedSchema = JSON.parse(schema);
      const results = [];

      for (let i = 0; i < count; i++) {
        results.push(processSchema(parsedSchema));
      }

      setGeneratedData(JSON.stringify(results, null, 2));
      setShowError(false);
    } catch (e) {
      setErrorMessage(e.message || 'Invalid schema JSON.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const copyToClipboard = () => {
    if (outputRef.current) {
      outputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadData = () => {
    if (generatedData) {
      const blob = new Blob([generatedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fake-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Layout
      title="JSON Faker"
      description="Generate realistic fake JSON data for testing."
    >
      <div className="app mt-5 w-full h-full p-8 font-sans">
        <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-300">
                Faker Schema Format
              </h4>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Use{' '}
                <code className="bg-purple-100 dark:bg-purple-800 px-1 rounded">
                  {'{{category.method}}'}
                </code>{' '}
                placeholders in your JSON schema.
              </p>
            </div>
            <button
              className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
              onClick={loadSample}
            >
              Load Sample
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {Object.entries(fakerCategories).map(([cat, methods]) => (
              <div
                key={cat}
                className="bg-white dark:bg-dark-surface p-2 rounded border dark:border-dark-border"
              >
                <strong className="text-purple-700 dark:text-purple-400">
                  {cat}:
                </strong>
                <span className="text-gray-600 dark:text-dark-muted ml-1">
                  {methods.slice(0, 3).join(', ')}
                  {methods.length > 3 && '...'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="row sm:flex">
          <div className="col sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border box-height">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Schema Template
                </h3>
              </div>
              <textarea
                className="resize-none border-0 rounded text-grey-darkest dark:text-dark-text flex-1 p-2 m-1 bg-transparent font-mono text-sm"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                placeholder="Define your JSON schema with faker placeholders..."
              />
            </div>
          </div>

          <div className="col mt-8 sm:ml-8 sm:mt-0 sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border box-height">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border flex justify-between items-center">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Generated Data
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs text-green-400 ${copied ? 'visible' : 'invisible'}`}
                  >
                    Copied!
                  </span>
                  <button
                    className="py-1 px-3 shadow rounded-sm bg-green-400 text-white text-xs hover:bg-green-600"
                    onClick={copyToClipboard}
                    disabled={!generatedData}
                  >
                    Copy
                  </button>
                  <button
                    className="py-1 px-3 shadow rounded-sm bg-blue-400 text-white text-xs hover:bg-blue-600"
                    onClick={downloadData}
                    disabled={!generatedData}
                  >
                    Download
                  </button>
                </div>
              </div>
              <textarea
                ref={outputRef}
                className="resize-none border-0 rounded text-grey-darkest dark:text-dark-text flex-1 p-2 m-1 bg-transparent font-mono text-sm"
                value={generatedData}
                readOnly
                placeholder="Generated fake data will appear here..."
              />
            </div>
          </div>
        </div>

        <AlertError message={errorMessage} showError={showError} />

        <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 dark:text-dark-text font-medium">
              Count:
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-20 border rounded px-2 py-1 bg-white dark:bg-dark-surface dark:text-dark-text dark:border-dark-border"
              value={count}
              onChange={(e) =>
                setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
              }
            />
          </div>
          <button
            className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded shadow disabled:opacity-50"
            onClick={handleGenerate}
            disabled={!schema}
          >
            Generate
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default JSONFaker;
