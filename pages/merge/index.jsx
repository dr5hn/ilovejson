import { useState, useRef } from 'react';
import Layout from '@components/layout';
import AlertError from '@components/error';

const JSONMerge = () => {
  const [jsonInputs, setJsonInputs] = useState(['', '']);
  const [mergeResult, setMergeResult] = useState('');
  const [mergeStrategy, setMergeStrategy] = useState('deep');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const addInput = () => {
    if (jsonInputs.length < 10) {
      setJsonInputs([...jsonInputs, '']);
    }
  };

  const removeInput = (index) => {
    if (jsonInputs.length > 2) {
      setJsonInputs(jsonInputs.filter((_, i) => i !== index));
    }
  };

  const updateInput = (index, value) => {
    const newInputs = [...jsonInputs];
    newInputs[index] = value;
    setJsonInputs(newInputs);
  };

  const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
  };

  const deepMerge = (target, source) => {
    const output = { ...target };
    for (const key in source) {
      if (isObject(source[key]) && isObject(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  };

  const handleMerge = () => {
    try {
      const parsedInputs = jsonInputs
        .filter((input) => input.trim())
        .map((input) => JSON.parse(input));

      if (parsedInputs.length < 2) {
        throw new Error('Please provide at least 2 JSON objects to merge.');
      }

      let result;
      switch (mergeStrategy) {
        case 'deep':
          result = parsedInputs.reduce((acc, obj) => deepMerge(acc, obj), {});
          break;
        case 'shallow':
          result = parsedInputs.reduce((acc, obj) => ({ ...acc, ...obj }), {});
          break;
        case 'concat':
          if (parsedInputs.every(Array.isArray)) {
            result = parsedInputs.flat();
          } else {
            result = parsedInputs;
          }
          break;
        case 'unique':
          if (parsedInputs.every(Array.isArray)) {
            result = [...new Set(parsedInputs.flat().map(JSON.stringify))].map(
              JSON.parse
            );
          } else {
            result = parsedInputs.reduce((acc, obj) => deepMerge(acc, obj), {});
          }
          break;
        default:
          result = parsedInputs.reduce((acc, obj) => deepMerge(acc, obj), {});
      }

      setMergeResult(JSON.stringify(result, null, 2));
      setShowError(false);
    } catch (e) {
      setErrorMessage(e.message || 'Invalid JSON in one or more inputs.');
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

  const downloadResult = () => {
    if (mergeResult) {
      const blob = new Blob([mergeResult], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Layout
      title="JSON Merge"
      description="Merge multiple JSON files with different strategies."
    >
      <div className="app mt-5 w-full h-full p-8 font-sans">
        <div className="mb-6 flex items-center gap-4 justify-center flex-wrap">
          <label className="text-gray-700 dark:text-dark-text font-medium">
            Merge Strategy:
          </label>
          <select
            className="border rounded px-3 py-2 bg-white dark:bg-dark-surface dark:text-dark-text dark:border-dark-border"
            value={mergeStrategy}
            onChange={(e) => setMergeStrategy(e.target.value)}
          >
            <option value="deep">Deep Merge (recursive)</option>
            <option value="shallow">Shallow Merge (top-level only)</option>
            <option value="concat">Concatenate (arrays/combine)</option>
            <option value="unique">Unique (dedupe arrays)</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {jsonInputs.map((input, index) => (
            <div
              key={index}
              className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border"
            >
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border flex justify-between items-center">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  JSON {index + 1}
                </h3>
                {jsonInputs.length > 2 && (
                  <button
                    className="text-red-500 hover:text-red-700 text-sm"
                    onClick={() => removeInput(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                className="w-full resize-none border-0 rounded text-grey-darkest dark:text-dark-text p-2 bg-transparent"
                style={{ minHeight: '150px' }}
                value={input}
                onChange={(e) => updateInput(index, e.target.value)}
                placeholder={`Paste JSON ${index + 1} here...`}
              />
            </div>
          ))}
        </div>

        {jsonInputs.length < 10 && (
          <div className="mt-4 text-center">
            <button
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm underline"
              onClick={addInput}
            >
              + Add Another JSON
            </button>
          </div>
        )}

        <AlertError message={errorMessage} showError={showError} />

        <div className="row sm:flex mt-5">
          <button
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow mx-auto disabled:opacity-50"
            onClick={handleMerge}
            disabled={jsonInputs.filter((i) => i.trim()).length < 2}
          >
            Merge
          </button>
        </div>

        {mergeResult && (
          <div className="mt-8">
            <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border">
              <div className="box__title bg-grey-lighter dark:bg-dark-border px-3 py-2 border-b dark:border-dark-border flex justify-between items-center">
                <h3 className="text-sm text-grey-darker dark:text-dark-text font-medium">
                  Merged Result
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
                  >
                    Copy
                  </button>
                  <button
                    className="py-1 px-3 shadow rounded-sm bg-blue-400 text-white text-xs hover:bg-blue-600"
                    onClick={downloadResult}
                  >
                    Download
                  </button>
                </div>
              </div>
              <textarea
                ref={outputRef}
                className="w-full resize-none border-0 rounded text-grey-darkest dark:text-dark-text p-4 bg-transparent font-mono text-sm"
                value={mergeResult}
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

export default JSONMerge;
