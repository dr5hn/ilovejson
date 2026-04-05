"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import { Zap, Shield, ArrowRight, Sparkles, Lock, Globe } from "lucide-react"
import Link from "next/link"
import { tools } from "@constants/tools"

const features = [
  { icon: Zap, label: "Instant conversion" },
  { icon: Shield, label: "100% private" },
  { icon: Globe, label: "20+ formats" },
]

const popularTools = [
  { name: "JSON to CSV", href: "/json-to-csv" },
  { name: "Beautify", href: "/beautify" },
  { name: "Validate", href: "/validate" },
]

const allSearchableTools = [
  ...tools.map(t => ({ name: `${t.from} to ${t.to}`, href: `/${t.slug}` })),
  { name: "Compress JSON", href: "/compress" },
  { name: "Beautify JSON", href: "/beautify" },
  { name: "Validate JSON", href: "/validate" },
  { name: "JSON Viewer", href: "/viewer" },
  { name: "JSON Editor", href: "/editor" },
  { name: "Repair JSON", href: "/repair" },
  { name: "Generate Schema", href: "/generateschema" },
  { name: "JSON Diff", href: "/diff" },
  { name: "JSON Merge", href: "/merge" },
  { name: "JSON Query", href: "/query" },
  { name: "JSON Faker", href: "/faker" },
  { name: "Minify JSON", href: "/minify" },
]

export function HeroSection() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof allSearchableTools>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    const lower = query.toLowerCase()
    const matches = allSearchableTools.filter(t =>
      t.name.toLowerCase().includes(lower)
    ).slice(0, 6)
    setSearchResults(matches)
    setShowResults(matches.length > 0)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    if (searchResults.length > 0) {
      router.push(searchResults[0].href)
      setShowResults(false)
    }
  }, [searchResults, router])

  return (
    <section className="relative w-full pt-4 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-red-200/40 via-rose-200/30 to-transparent rounded-full blur-3xl -translate-y-1/2 animate-blob"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-br from-amber-200/30 via-orange-200/20 to-transparent rounded-full blur-3xl translate-x-1/3 animate-blob"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/20 via-indigo-200/10 to-transparent rounded-full blur-3xl translate-y-1/2 animate-blob"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div
        className={`relative max-w-6xl mx-auto px-4 text-center transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 text-red-600 dark:text-red-400 rounded-full text-sm font-medium mb-8 border border-red-100 dark:border-red-900/50 shadow-lg shadow-red-500/5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          100% Free &bull; No Signup Required
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-[1.1] tracking-tight">
          Every JSON tool
          <br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent animate-gradient-x">
              you need
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8C30 3 60 3 100 8C140 13 170 6 198 8"
                stroke="url(#underline-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                  <stop stopColor="#ef4444" />
                  <stop offset="0.5" stopColor="#f43f5e" />
                  <stop offset="1" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Convert, beautify, validate, and transform JSON to any format.
          <span className="text-foreground"> Fast, secure, and completely free.</span>
        </p>

        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/5 border border-border p-2 transition-all duration-300 hover:shadow-3xl hover:shadow-black/10">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-muted-foreground ml-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit() }}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true) }}
                onBlur={() => setTimeout(() => setShowResults(false), 300)}
                placeholder="What do you want to convert? Try 'JSON to CSV'..."
                className="flex-1 px-4 py-4 text-foreground placeholder:text-muted-foreground bg-transparent outline-none text-base md:text-lg"
              />
              <button
                onClick={handleSearchSubmit}
                className="px-6 md:px-8 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] flex items-center gap-2 group"
              >
                <span className="hidden sm:inline">Go</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-50">
              {searchResults.map((result) => (
                <Link
                  key={result.href}
                  href={result.href}
                  className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowResults(false)}
                >
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  {result.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <span className="text-sm text-muted-foreground mr-1">Popular:</span>
          {popularTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card hover:bg-secondary rounded-full border border-border hover:border-red-200 dark:hover:border-red-900 transition-all duration-200 hover:-translate-y-0.5"
            >
              {tool.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {features.map((feature, idx) => (
            <div
              key={feature.label}
              className="flex items-center gap-2.5 px-5 py-2.5 bg-card/60 backdrop-blur rounded-full border border-border text-sm font-medium text-muted-foreground shadow-sm animate-slide-up"
              style={{ animationDelay: `${idx * 100 + 300}ms` }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/20">
                <feature.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
