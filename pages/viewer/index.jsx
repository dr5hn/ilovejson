import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@components/layout';
import { Eye, RotateCcw, Sparkles } from 'lucide-react';

const JsonView = dynamic(() => import('@uiw/react-json-view').then(mod => mod.default || mod), { ssr: false });

const VIEWER_COLOR = '#0ea5e9';

const EXAMPLE_JSON = JSON.stringify({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  address: { street: "123 Main St", city: "Springfield", state: "IL" },
  hobbies: ["reading", "coding", "hiking"],
}, null, 2);

const Viewer = () => {
  const [sourceJSON, setSourceJSON] = useState('');
  const [outputJSON, setOutputJSON] = useState(null);
  const [error, setError] = useState('');
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setSourceJSON(value);
    try {
      if (value.trim()) {
        setOutputJSON(JSON.parse(value));
        setError('');
      } else {
        setOutputJSON(null);
        setError('');
      }
    } catch (err) {
      setError(err.message || 'Invalid JSON');
      setOutputJSON(null);
    }
  };

  const handleClear = () => {
    setSourceJSON('');
    setOutputJSON(null);
    setError('');
  };

  return (
    <Layout>
      <Head>
        <title>JSON Viewer - View & Explore JSON Online Free | ILoveJSON</title>
        <meta name="description" content="View and explore JSON data with an interactive tree viewer. Expand, collapse, and navigate complex JSON structures online for free." />
      </Head>
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Title Section */}
        <div className="text-center py-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: VIEWER_COLOR }}
            >
              <Eye className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">JSON Viewer</h1>
          </div>
          <p className="text-muted-foreground text-sm">Paste JSON and explore it as an interactive tree</p>
        </div>

        {/* Editor Area */}
        <div className="w-full flex-1 grid lg:grid-cols-2 min-h-0 px-4 md:px-8 py-4 gap-6">
          {/* Input Panel */}
          <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Input</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{sourceJSON.length.toLocaleString()} chars</span>
                {!sourceJSON && (
                  <button
                    onClick={() => { setSourceJSON(EXAMPLE_JSON); handleChange({ target: { value: EXAMPLE_JSON } }); }}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
                  >
                    Load example
                  </button>
                )}
                {sourceJSON && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={sourceJSON}
              onChange={handleChange}
              placeholder="Paste your JSON here..."
              className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-card text-foreground placeholder:text-muted-foreground min-h-[300px]"
              spellCheck={false}
            />
          </div>

          {/* Output Panel */}
          <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Tree View</span>
              {outputJSON && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Parsed
                </span>
              )}
            </div>
            <div className="flex-1 p-4 overflow-auto bg-card min-h-[300px]">
              {error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-2">
                    <span className="text-red-500 text-lg">!</span>
                  </div>
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                </div>
              ) : outputJSON !== null ? (
                <JsonView
                  value={outputJSON}
                  collapsed={false}
                  style={{ fontSize: '0.875rem' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">Parsed JSON will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Viewer;
