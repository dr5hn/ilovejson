import { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@components/layout';
import diff from 'microdiff';
import { GitCompareArrows, Copy, Check, Keyboard, RotateCcw } from 'lucide-react';

const DIFF_COLOR = '#06b6d4';

const JSONDiff = () => {
  const [sourceJSON1, setSourceJSON1] = useState('');
  const [sourceJSON2, setSourceJSON2] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  const handleCompare = useCallback(() => {
    if (!sourceJSON1.trim() || !sourceJSON2.trim()) {
      setError('Please enter JSON in both panels');
      return;
    }
    try {
      const obj1 = JSON.parse(sourceJSON1);
      const obj2 = JSON.parse(sourceJSON2);
      const differences = diff(obj1, obj2);
      setDiffResult(differences);
      setError('');
    } catch (e) {
      setError(e.message || 'Invalid JSON in one or both inputs');
      setDiffResult(null);
    }
  }, [sourceJSON1, sourceJSON2]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompare();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCompare]);

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
            return `[${i + 1}] EDITED at "${path}": ${JSON.stringify(d.oldValue)} → ${JSON.stringify(d.value)}`;
          default:
            return `[${i + 1}] UNKNOWN at "${path}"`;
        }
      })
      .join('\n');
  };

  const copyToClipboard = async () => {
    if (diffResult) {
      await navigator.clipboard.writeText(formatDiff(diffResult));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setSourceJSON1('');
    setSourceJSON2('');
    setDiffResult(null);
    setError('');
  };

  const summary = diffResult ? {
    added: diffResult.filter((d) => d.type === 'CREATE').length,
    deleted: diffResult.filter((d) => d.type === 'REMOVE').length,
    edited: diffResult.filter((d) => d.type === 'CHANGE').length,
  } : null;

  return (
    <Layout>
      <Head>
        <title>JSON Diff - Compare JSON Files Online Free | ILoveJSON</title>
        <meta name="description" content="Compare two JSON files and find differences instantly. Free online JSON diff tool — highlight additions, deletions, and changes." />
      </Head>
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Title Section */}
        <div className="text-center py-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: DIFF_COLOR }}
            >
              <GitCompareArrows className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">JSON Diff</h1>
          </div>
          <p className="text-muted-foreground text-sm">Compare two JSON objects and find differences</p>
        </div>

        {/* Editor Area */}
        <div className="w-full flex-1 grid lg:grid-cols-2 min-h-0 px-4 md:px-8 py-4 gap-6">
          {/* Original JSON Panel */}
          <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Original</span>
              <span className="text-xs text-muted-foreground">{sourceJSON1.length.toLocaleString()} chars</span>
            </div>
            <textarea
              value={sourceJSON1}
              onChange={(e) => setSourceJSON1(e.target.value)}
              placeholder="Paste first JSON here..."
              className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-card text-foreground placeholder:text-muted-foreground min-h-[250px]"
              spellCheck={false}
            />
          </div>

          {/* Modified JSON Panel */}
          <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Modified</span>
              <span className="text-xs text-muted-foreground">{sourceJSON2.length.toLocaleString()} chars</span>
            </div>
            <textarea
              value={sourceJSON2}
              onChange={(e) => setSourceJSON2(e.target.value)}
              placeholder="Paste second JSON here..."
              className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-card text-foreground placeholder:text-muted-foreground min-h-[250px]"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Results */}
        {(diffResult || error) && (
          <div className="px-4 md:px-8 pb-4">
            {error && (
              <div className="flex items-center justify-center p-4 border border-red-200 rounded-lg bg-red-50 mb-4">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}
            {diffResult && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      Differences ({diffResult.length})
                    </span>
                    {summary && (
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                          +{summary.added} added
                        </span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          -{summary.deleted} deleted
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          ~{summary.edited} edited
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClear}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white rounded-md transition"
                      style={{ backgroundColor: DIFF_COLOR }}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <pre className="p-4 font-mono text-sm whitespace-pre-wrap text-foreground bg-card min-h-[150px] max-h-[400px] overflow-auto">
                  {formatDiff(diffResult)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-border bg-muted/20">
          <button
            onClick={handleCompare}
            disabled={!sourceJSON1.trim() || !sourceJSON2.trim()}
            className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              backgroundColor: DIFF_COLOR,
              boxShadow: `0 8px 30px -8px ${DIFF_COLOR}66`,
            }}
          >
            <GitCompareArrows className="w-4 h-4" />
            Compare JSON
          </button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Keyboard className="w-3.5 h-3.5" />
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{isMac ? "⌘" : "Ctrl"}+Enter</kbd>
          </span>
        </div>
      </div>
    </Layout>
  );
};

export default JSONDiff;
