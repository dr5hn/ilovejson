import dynamic from 'next/dynamic';
import { useState } from 'react';
import Head from 'next/head';
import Layout from '@components/layout';
import AlertError from '@components/error';

const JsonView = dynamic(() => import('@uiw/react-json-view').then(mod => mod.default || mod), { ssr: false });

const Viewer = () => {
  const [sourceJSON, setSourceJSON] = useState('');
  const [outputJSON, setOutputJSON] = useState(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSourceJSON(value);
    try {
      if (value.trim()) {
        setOutputJSON(JSON.parse(value));
        setShowError(false);
        setErrorMessage('');
      } else {
        setOutputJSON(null);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid JSON');
      setShowError(true);
    }
  };

  return (
    <Layout title="JSON Viewer" description="Make JSON Easy to Read.">
      <Head>
        <title>JSON Viewer - View & Explore JSON Online Free | ILoveJSON</title>
        <meta name="description" content="View and explore JSON data with an interactive tree viewer. Expand, collapse, and navigate complex JSON structures online for free." />
      </Head>
      <div className="app mt-5 w-full h-full p-8 font-sans">
        <div className="row sm:flex">
          <div className="col sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white box-height">
              <div className="box__title bg-grey-lighter px-3 py-2 border-b">
                <h3 className="text-sm text-grey-darker font-medium">Input</h3>
              </div>
              <textarea
                className="resize-none border-0 rounded text-grey-darkest flex-1 p-2 m-1 bg-transparent"
                name="source"
                value={sourceJSON}
                onChange={handleChange}
                placeholder="Paste your JSON here..."
              />
            </div>
          </div>

          <div className="col mt-8 sm:ml-8 sm:mt-0 sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white box-height">
              <div className="box__title bg-grey-lighter px-3 py-2 border-b">
                <h3 className="text-sm text-grey-darker font-medium inline-flex">Output</h3>
              </div>
              <div style={{ overflowY: 'scroll', height: '50vh', padding: '0.5rem' }}>
                {outputJSON !== null ? (
                  <JsonView
                    value={outputJSON}
                    collapsed={false}
                    style={{ fontSize: '0.875rem' }}
                  />
                ) : (
                  <p className="text-muted-foreground p-4 text-sm">Parsed JSON will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <AlertError message={errorMessage} showError={showError} onDismiss={() => setShowError(false)} />
      </div>
    </Layout>
  );
};

export default Viewer;
