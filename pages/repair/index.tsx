"use client";
import Layout from "@components/layout"
import Head from "next/head"
import { useState, useCallback, useEffect } from "react"
import { Copy, Check, Download, Wrench, RotateCcw, Keyboard, Sparkles } from "lucide-react"

export default function RepairPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fixes, setFixes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const repairJSON = useCallback(() => {
    if (!input.trim()) {
      setError("Please enter some content")
      return
    }

    let json = input
    const appliedFixes: string[] = []

    try {
      JSON.parse(json)
      setOutput(JSON.stringify(JSON.parse(json), null, 2))
      setFixes(["JSON is already valid!"])
      setError(null)
      return
    } catch {
      // Continue with repairs
    }

    if (json.includes("'")) {
      json = json.replace(/'/g, '"')
      appliedFixes.push("Replaced single quotes with double quotes")
    }

    const beforeKeys = json
    json = json.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    if (json !== beforeKeys) {
      appliedFixes.push("Added quotes around unquoted keys")
    }

    const beforeTrailing = json
    json = json.replace(/,\s*([\]}])/g, "$1")
    if (json !== beforeTrailing) {
      appliedFixes.push("Removed trailing commas")
    }

    json = json.replace(/}\s*{/g, "},{")
    json = json.replace(/]\s*\[/g, "],[")
    json = json.replace(/"\s*"/g, '","')

    json = json.replace(/:\s*undefined/g, ": null")
    json = json.replace(/:\s*NaN/g, ": null")

    try {
      const parsed = JSON.parse(json)
      setOutput(JSON.stringify(parsed, null, 2))
      setFixes(appliedFixes.length > 0 ? appliedFixes : ["Minor formatting fixes applied"])
      setError(null)
    } catch (e) {
      setError("Could not repair JSON: " + (e as Error).message)
      setOutput("")
      setFixes([])
    }
  }, [input])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        repairJSON()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [repairJSON])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const downloadJSON = useCallback(() => {
    const blob = new Blob([output], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "repaired.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const handleClear = () => {
    setInput("")
    setOutput("")
    setError(null)
    setFixes([])
  }

  return (
    <Layout>
      <Head>
        <title>Repair JSON - Fix Broken JSON Online Free | ILoveJSON</title>
        <meta name="description" content="Automatically repair and fix broken JSON. Handles missing quotes, trailing commas, and common syntax errors — free online tool." />
      </Head>
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Title Section */}
        <div className="text-center py-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: "#f97316" }}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Repair JSON</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Automatically fix common JSON syntax errors and formatting issues
          </p>
        </div>

        {/* Full Screen Editor Area */}
        <div className="w-full flex-1 grid lg:grid-cols-2 min-h-0 px-4 md:px-8 py-4 gap-6">
          {/* Input Panel */}
          <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Broken JSON</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{input.length.toLocaleString()} chars</span>
                {input && (
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your broken JSON here..."
              className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-card text-foreground placeholder:text-muted-foreground min-h-[300px]"
              spellCheck={false}
            />
          </div>

          {/* Output Panel */}
          <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Repaired JSON</span>
                {fixes.length > 0 && !error && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {fixes.length} fix{fixes.length !== 1 ? "es" : ""} applied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{output.length.toLocaleString()} chars</span>
                {output && (
                  <>
                    <button
                      onClick={downloadJSON}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white rounded-md transition"
                      style={{ backgroundColor: "#f97316" }}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto bg-card min-h-[300px]">
              {error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center mb-2">
                    <span className="text-red-500 text-lg">!</span>
                  </div>
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                </div>
              ) : output ? (
                <div>
                  {fixes.length > 0 && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5">Fixes Applied:</h4>
                      <ul className="text-xs text-emerald-600 dark:text-emerald-400 space-y-0.5">
                        {fixes.map((fix, i) => (
                          <li key={i}>{"\u2022"} {fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">{output}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">Repaired JSON will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-border bg-muted/20">
          <button
            onClick={repairJSON}
            disabled={!input.trim()}
            className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              backgroundColor: "#f97316",
              boxShadow: "0 8px 30px -8px #f9731666",
            }}
          >
            <Wrench className="w-4 h-4" />
            Repair JSON
          </button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Keyboard className="w-3.5 h-3.5" />
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+Enter</kbd>
          </span>
        </div>
      </div>
    </Layout>
  )
}
