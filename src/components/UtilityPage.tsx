"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import Head from "next/head"
import Layout from "@components/layout"
import { Copy, Check, Download, Sparkles, Keyboard, RotateCcw } from "lucide-react"

interface UtilityPageProps {
  title: string
  description: string
  processLabel: string
  processFn: (input: string) => string
  color: string
  icon: React.ReactNode
  showOutput?: boolean
  placeholder?: string
}

export function UtilityPage({
  title,
  description,
  processLabel,
  processFn,
  color,
  icon,
  showOutput = true,
  placeholder = "Paste your JSON here...",
}: UtilityPageProps) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"))
  }, [])

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setError("Please enter some content")
      return
    }
    setIsProcessing(true)
    setError("")

    setTimeout(() => {
      try {
        const result = processFn(input)
        setOutput(result)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
        setOutput("")
      }
      setIsProcessing(false)
    }, 100)
  }, [input, processFn])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleProcess()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleProcess])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output || input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Failed to copy to clipboard")
    }
  }, [output, input])

  const handleDownload = useCallback(() => {
    const content = output || input
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-output.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [output, input, title])

  const handleClear = () => {
    setInput("")
    setOutput("")
    setError("")
  }

  const pageTitle = `${title} Online - Free JSON Tool | ILoveJSON`

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={`${description} Free online tool — no signup required.`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
      </Head>
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Title Section */}
        <div className="text-center py-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {/* Full Screen Editor Area */}
        <div className={`w-full flex-1 grid ${showOutput ? "lg:grid-cols-2" : "grid-cols-1"} min-h-0 px-4 md:px-8 py-4 gap-6`}>
          {/* Input Panel */}
          <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Source</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{input.length.toLocaleString()} chars</span>
                {!input && (
                  <button
                    onClick={() => setInput(JSON.stringify({ name: "John Doe", email: "john@example.com", age: 30, address: { street: "123 Main St", city: "Springfield", state: "IL" }, hobbies: ["reading", "coding", "hiking"] }, null, 2))}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
                  >
                    Load example
                  </button>
                )}
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
              placeholder={placeholder}
              className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-card text-foreground placeholder:text-muted-foreground min-h-[300px]"
              spellCheck={false}
            />
          </div>

          {/* Output Panel */}
          {showOutput && (
            <div className="flex flex-col border border-border rounded-lg overflow-hidden min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Output</span>
                  {showSuccess && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Done!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{output.length.toLocaleString()} chars</span>
                  {output && (
                    <>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white rounded-md transition"
                        style={{ backgroundColor: color }}
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
                  <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">{output}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">Output will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-border bg-muted/20">
          <button
            onClick={handleProcess}
            disabled={isProcessing || !input.trim()}
            className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              backgroundColor: color,
              boxShadow: `0 8px 30px -8px ${color}66`,
            }}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              processLabel
            )}
          </button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Keyboard className="w-3.5 h-3.5" />
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{isMac ? "⌘" : "Ctrl"}+Enter</kbd>
          </span>
        </div>
      </div>
    </Layout>
  )
}

export default UtilityPage
