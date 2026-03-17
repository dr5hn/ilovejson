"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Copy, Download, Trash2, Wand2, CheckCircle, Code, FileJson } from "lucide-react"

export default function EditorPage() {
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const formatJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed, null, 2))
      setError(null)
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message)
    }
  }, [input])

  const minifyJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed))
      setError(null)
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message)
    }
  }, [input])

  const validateJSON = useCallback(() => {
    try {
      JSON.parse(input)
      setError(null)
      alert("Valid JSON!")
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message)
    }
  }, [input])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(input)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [input])

  const downloadJSON = useCallback(() => {
    const blob = new Blob([input], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "edited.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [input])

  const clearEditor = useCallback(() => {
    setInput("")
    setError(null)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="bg-gradient-to-b from-muted/50 to-background py-6 border-b">
          <div className="max-w-[95vw] mx-auto px-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                <Code className="w-7 h-7" />
              </div>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <FileJson className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">JSON Editor</h1>
            <p className="text-muted-foreground text-center">
              Edit, format, validate, and manipulate JSON data with a full-screen editor
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 max-w-[95vw] mx-auto w-full">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={formatJSON} variant="outline" size="sm">
              <Wand2 className="w-4 h-4 mr-2" />
              Format
            </Button>
            <Button onClick={minifyJSON} variant="outline" size="sm">
              Minify
            </Button>
            <Button onClick={validateJSON} variant="outline" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Validate
            </Button>
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button onClick={downloadJSON} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={clearEditor} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 min-h-[70vh]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type your JSON here..."
              className="w-full h-full min-h-[70vh] p-4 font-mono text-sm bg-card border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              spellCheck={false}
            />
          </div>

          <div className="mt-4 text-sm text-muted-foreground text-center">
            Characters: {input.length} | Lines: {input.split("\n").length}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
