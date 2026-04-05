"use client"

import Link from "next/link"
import { ChevronDown, Menu, X, Sparkles, Search, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

const toolCategories = [
  {
    title: "Utilities",
    description: "Format and validate",
    tools: [
      { name: "Compress", href: "/compress", icon: "ZIP", color: "#8b5cf6" },
      { name: "Beautify", href: "/beautify", icon: "{ }", color: "#f59e0b" },
      { name: "Validate", href: "/validate", icon: "OK", color: "#22c55e" },
      { name: "Viewer", href: "/viewer", icon: "EYE", color: "#0ea5e9" },
      { name: "Editor", href: "/editor", icon: "EDT", color: "#3b82f6" },
      { name: "Repair", href: "/repair", icon: "FIX", color: "#f97316" },
      { name: "Schema", href: "/generateschema", icon: "SCH", color: "#a855f7" },
      { name: "Diff", href: "/diff", icon: "DIF", color: "#06b6d4" },
      { name: "Merge", href: "/merge", icon: "MRG", color: "#6366f1" },
      { name: "Query", href: "/query", icon: "QRY", color: "#eab308" },
      { name: "Faker", href: "/faker", icon: "FAK", color: "#ec4899" },
      { name: "Minify", href: "/minify", icon: "{}", color: "#64748b" },
    ],
  },
  {
    title: "Convert from JSON",
    description: "Export to other formats",
    tools: [
      { name: "JSON → CSV", href: "/json-to-csv", icon: "CSV", color: "#22c55e" },
      { name: "JSON → YAML", href: "/json-to-yaml", icon: "YML", color: "#f97316" },
      { name: "JSON → XML", href: "/json-to-xml", icon: "XML", color: "#eab308" },
      { name: "JSON → TOML", href: "/json-to-toml", icon: "TML", color: "#9c4221" },
      { name: "JSON → TypeScript", href: "/json-to-typescript", icon: "TS", color: "#3178c6" },
      { name: "JSON → PHP", href: "/json-to-php", icon: "PHP", color: "#777bb4" },
      { name: "JSON → SQL", href: "/json-to-sql", icon: "SQL", color: "#336791" },
      { name: "JSON → Markdown", href: "/json-to-markdown", icon: "MD", color: "#083fa1" },
      { name: "JSON → HTML", href: "/json-to-html", icon: "HTM", color: "#e44d26" },
      { name: "JSON → Excel", href: "/json-to-excel", icon: "XLS", color: "#217346" },
    ],
  },
  {
    title: "Convert to JSON",
    description: "Import from other formats",
    tools: [
      { name: "CSV → JSON", href: "/csv-to-json", icon: "CSV", color: "#22c55e" },
      { name: "YAML → JSON", href: "/yaml-to-json", icon: "YML", color: "#f97316" },
      { name: "XML → JSON", href: "/xml-to-json", icon: "XML", color: "#eab308" },
      { name: "TOML → JSON", href: "/toml-to-json", icon: "TML", color: "#9c4221" },
      { name: "TypeScript → JSON", href: "/typescript-to-json", icon: "TS", color: "#3178c6" },
      { name: "PHP → JSON", href: "/php-to-json", icon: "PHP", color: "#777bb4" },
      { name: "SQL → JSON", href: "/sql-to-json", icon: "SQL", color: "#336791" },
      { name: "Markdown → JSON", href: "/markdown-to-json", icon: "MD", color: "#083fa1" },
      { name: "HTML → JSON", href: "/html-to-json", icon: "HTM", color: "#e44d26" },
      { name: "Excel → JSON", href: "/excel-to-json", icon: "XLS", color: "#217346" },
    ],
  },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled ? "py-2 glass border-b border-border/50 shadow-lg shadow-black/[0.03]" : "py-4 bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="text-2xl font-black tracking-tight text-foreground">I</span>
          <span className="flex items-center text-2xl font-black text-muted-foreground">
            {"{"}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-red-500 mx-0.5 transition-all duration-300 group-hover:scale-110"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {"}"}
          </span>
          <span className="text-2xl font-black tracking-tight text-foreground">JSON</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <div
            className="relative"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <button
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                megaMenuOpen
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              All Tools
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${megaMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 ${
                megaMenuOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible"
              }`}
            >
              <div className="bg-card rounded-3xl shadow-2xl shadow-black/10 border border-border p-8 min-w-[800px]">
                <div className="grid grid-cols-3 gap-2">
                  {toolCategories.map((category) => (
                    <div key={category.title}>
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-foreground mb-1">{category.title}</h3>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      <ul className="space-y-1">
                        {category.tools.map((tool) => (
                          <li key={tool.href}>
                            <Link
                              href={tool.href}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary rounded-xl transition-all duration-200 group/item"
                              onClick={() => setMegaMenuOpen(false)}
                            >
                              <span
                                className="w-9 h-9 aspect-square rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-3 shrink-0"
                                style={{ backgroundColor: tool.color }}
                              >
                                {tool.icon}
                              </span>
                              <span className="font-medium group-hover/item:text-red-500 transition-colors">
                                {tool.name}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all ml-auto" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/pricing"
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all duration-200"
          >
            Pricing
          </Link>
          <Link
            href="/api-docs"
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all duration-200"
          >
            API
          </Link>
          <Link
            href="/cli"
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all duration-200"
          >
            CLI
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/#tools"
            className="hidden md:flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground bg-secondary/80 hover:bg-secondary rounded-full transition-all duration-200 group"
          >
            <Search className="w-4 h-4 group-hover:text-foreground transition-colors" />
            <span className="text-muted-foreground/70">Search tools</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 text-foreground hover:bg-secondary rounded-full transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div
        className={`lg:hidden fixed inset-x-0 top-[72px] bg-card/95 backdrop-blur-xl border-b border-border transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-4 invisible"
        }`}
      >
        <nav className="flex flex-col p-4 gap-2 max-h-[calc(100vh-80px)] overflow-y-auto">
          {toolCategories.map((category, categoryIdx) => (
            <div
              key={category.title}
              className="mb-4 animate-slide-up"
              style={{ animationDelay: `${categoryIdx * 50}ms` }}
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                {category.title}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span
                      className="w-8 h-8 aspect-square rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                      style={{ backgroundColor: tool.color }}
                    >
                      {tool.icon}
                    </span>
                    <span className="truncate">{tool.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t border-border mt-2 pt-4 flex flex-col gap-2">
            <Link
              href="/cli"
              className="block w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary rounded-xl text-center transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              CLI
            </Link>
            <Link
              href="/pricing"
              className="block w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary rounded-xl text-center transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/api-docs"
              className="block w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary rounded-xl text-center transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              API
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
