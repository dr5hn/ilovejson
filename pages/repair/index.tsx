"use client"
import  Header  from '@components/Header'
import  Footer  from '@components/Footer'
import { useState, useCallback } from "react"
import { Copy, Download, Wrench, ArrowRight } from "lucide-react"

export default function RepairPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fixes, setFixes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const repairJSON = useCallback(() => {
    let json = input
    const appliedFixes: string[] = []

    try {
      // Try parsing as-is first
      JSON.parse(json)
      setOutput(JSON.stringify(JSON.parse(json), null, 2))
      setFixes(["JSON is already valid!"])
      setError(null)
      return
    } catch {
      // Continue with repairs
    }

    // Fix common issues
    // 1. Replace single quotes with double quotes
    if (json.includes("'")) {
      json = json.replace(/'/g, '"')
      appliedFixes.push("Replaced single quotes with double quotes")
    }

    // 2. Add missing quotes around keys
    json = json.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    if (json !== input) {
      appliedFixes.push("Added quotes around unquoted keys")
    }

    // 3. Remove trailing commas
    const beforeTrailing = json
    json = json.replace(/,\s*([\]}])/g, "$1")
    if (json !== beforeTrailing) {
      appliedFixes.push("Removed trailing commas")
    }

    // 4. Fix missing commas between elements
    json = json.replace(/}\s*{/g, "},{")
    json = json.replace(/]\s*\[/g, "],[")
    json = json.replace(/"\s*"/g, '","')

    // 5. Handle undefined/NaN values
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-[95vw] mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <Wrench className="w-7 h-7" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Repair JSON</h1>
            <p className="text-muted-foreground">
              Automatically fix common JSON syntax errors and formatting issues
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-sm font-medium">Broken JSON</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your broken JSON here..."
                className="w-full h-[60vh] p-4 font-mono text-sm bg-card border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                spellCheck={false}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Repaired JSON</label>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm" disabled={!output}>
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button onClick={downloadJSON} variant="outline" size="sm" disabled={!output}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Repaired JSON will appear here..."
                className="w-full h-[60vh] p-4 font-mono text-sm bg-muted/50 border rounded-xl resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {fixes.length > 0 && !error && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Fixes Applied:</h3>
              <ul className="list-disc list-inside text-green-700 dark:text-green-400 text-sm">
                {fixes.map((fix, i) => (
                  <li key={i}>{fix}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <Button onClick={repairJSON} size="lg" className="gap-2">
              <Wrench className="w-5 h-5" />
              Repair JSON
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
