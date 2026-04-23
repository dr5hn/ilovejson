"use client"

import { useState } from "react"
import { ToolCard } from "@components/ToolCard"
import { Sparkles, FileJson, Code, FileText, Table } from "lucide-react"

const categories = [
  { id: "all", label: "All Tools", icon: Sparkles },
  { id: "data", label: "Data Formats", icon: FileJson },
  { id: "code", label: "Code", icon: Code },
  { id: "docs", label: "Documents", icon: FileText },
  { id: "sheets", label: "Spreadsheets", icon: Table },
]

const tools = [
  // Data format converters
  { title: "JSON to CSV", description: "Transform JSON arrays into clean CSV spreadsheet format", icon1: "{ }", icon2: "CSV", color1: "#ef4444", color2: "#22c55e", href: "/json-to-csv", category: "data" },
  { title: "CSV to JSON", description: "Convert CSV data into structured JSON arrays", icon1: "CSV", icon2: "{ }", color1: "#22c55e", color2: "#ef4444", href: "/csv-to-json", category: "data" },
  { title: "JSON to YAML", description: "Transform JSON into human-readable YAML format", icon1: "{ }", icon2: "YML", color1: "#ef4444", color2: "#f97316", href: "/json-to-yaml", category: "data" },
  { title: "YAML to JSON", description: "Parse YAML configuration into JSON", icon1: "YML", icon2: "{ }", color1: "#f97316", color2: "#ef4444", href: "/yaml-to-json", category: "data" },
  { title: "JSON to XML", description: "Convert JSON objects to XML markup", icon1: "{ }", icon2: "XML", color1: "#ef4444", color2: "#eab308", href: "/json-to-xml", category: "data" },
  { title: "XML to JSON", description: "Parse XML documents into JSON structure", icon1: "XML", icon2: "{ }", color1: "#eab308", color2: "#ef4444", href: "/xml-to-json", category: "data" },
  // Code converters
  { title: "JSON to TypeScript", description: "Generate TypeScript interfaces from JSON", icon1: "{ }", icon2: "TS", color1: "#ef4444", color2: "#3178c6", href: "/json-to-typescript", category: "code", highlighted: true, isNew: true },
  { title: "TypeScript to JSON", description: "Extract JSON schema from TypeScript types", icon1: "TS", icon2: "{ }", color1: "#3178c6", color2: "#ef4444", href: "/typescript-to-json", category: "code" },
  { title: "JSON to PHP", description: "Convert JSON to PHP array syntax", icon1: "{ }", icon2: "PHP", color1: "#ef4444", color2: "#777bb4", href: "/json-to-php", category: "code" },
  { title: "PHP to JSON", description: "Transform PHP arrays into JSON", icon1: "PHP", icon2: "{ }", color1: "#777bb4", color2: "#ef4444", href: "/php-to-json", category: "code" },
  { title: "JSON to SQL", description: "Generate SQL INSERT statements from JSON", icon1: "{ }", icon2: "SQL", color1: "#ef4444", color2: "#336791", href: "/json-to-sql", category: "code" },
  { title: "SQL to JSON", description: "Parse SQL statements into JSON objects", icon1: "SQL", icon2: "{ }", color1: "#336791", color2: "#ef4444", href: "/sql-to-json", category: "code" },
  // Document converters
  { title: "JSON to Markdown", description: "Create Markdown tables and content from JSON", icon1: "{ }", icon2: "MD", color1: "#ef4444", color2: "#083fa1", href: "/json-to-markdown", category: "docs" },
  { title: "Markdown to JSON", description: "Parse Markdown into structured JSON", icon1: "MD", icon2: "{ }", color1: "#083fa1", color2: "#ef4444", href: "/markdown-to-json", category: "docs" },
  { title: "JSON to HTML", description: "Generate HTML markup from JSON data", icon1: "{ }", icon2: "HTM", color1: "#ef4444", color2: "#e44d26", href: "/json-to-html", category: "docs" },
  { title: "HTML to JSON", description: "Extract JSON structure from HTML", icon1: "HTM", icon2: "{ }", color1: "#e44d26", color2: "#ef4444", href: "/html-to-json", category: "docs" },
  { title: "JSON to TOML", description: "Convert JSON to TOML config format", icon1: "{ }", icon2: "TML", color1: "#ef4444", color2: "#9b4dca", href: "/json-to-toml", category: "docs" },
  { title: "TOML to JSON", description: "Parse TOML configuration files to JSON", icon1: "TML", icon2: "{ }", color1: "#9b4dca", color2: "#ef4444", href: "/toml-to-json", category: "docs" },
  // Spreadsheet converters
  { title: "JSON to Excel", description: "Export JSON arrays to Excel spreadsheets", icon1: "{ }", icon2: "XLS", color1: "#ef4444", color2: "#217346", href: "/json-to-excel", category: "sheets" },
  { title: "Excel to JSON", description: "Import Excel data as JSON arrays", icon1: "XLS", icon2: "{ }", color1: "#217346", color2: "#ef4444", href: "/excel-to-json", category: "sheets" },
]

const utilityTools = [
  { title: "Beautify JSON", description: "Format JSON with perfect indentation", icon1: "{ }", icon2: "{ }", color1: "#ef4444", color2: "#f59e0b", href: "/beautify" },
  { title: "Compress JSON", description: "Compress JSON by removing whitespace", icon1: "{ }", icon2: "{ }", color1: "#ef4444", color2: "#8b5cf6", href: "/compress" },
  { title: "Validate JSON", description: "Check syntax and find errors instantly", icon1: "{ }", icon2: "OK", color1: "#ef4444", color2: "#22c55e", href: "/validate" },
  { title: "JSON Viewer", description: "Explore JSON in an interactive tree view", icon1: "{ }", icon2: "{ }", color1: "#ef4444", color2: "#0ea5e9", href: "/viewer" },
  { title: "JSON Diff", description: "Compare two JSON files side by side", icon1: "{ }", icon2: "{ }", color1: "#ef4444", color2: "#06b6d4", href: "/diff" },
  { title: "JSON Merge", description: "Merge multiple JSON files into one", icon1: "{ }", icon2: "{ }", color1: "#ef4444", color2: "#6366f1", href: "/merge" },
  { title: "JSON Query", description: "Query JSON with JMESPath expressions", icon1: "{ }", icon2: "{ }", color1: "#ef4444", color2: "#eab308", href: "/query" },
  { title: "JSON Faker", description: "Generate fake data from JSON schema", icon1: "{ }", icon2: "{ }", color1: "#ef4444", color2: "#ec4899", href: "/faker" },
]

export function ToolsGrid() {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredTools = activeCategory === "all" ? tools : tools.filter((tool) => tool.category === activeCategory)

  return (
    <section id="tools" className="w-full py-20 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="max-w-[90rem] mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-xs font-semibold text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            20+ TOOLS
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">Conversion Tools</h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Transform JSON to and from any format with one click
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-foreground text-background shadow-xl shadow-foreground/10 scale-105"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary border border-border hover:border-foreground/10"
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
          {filteredTools.map((tool, idx) => (
            <div key={tool.href} className="animate-scale-in" style={{ animationDelay: `${idx * 30}ms` }}>
              <ToolCard {...tool} />
            </div>
          ))}
        </div>

        <div className="mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-xs font-semibold text-muted-foreground mb-4">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              UTILITIES
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">Utility Tools</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Format, validate, and explore your JSON data
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto auto-rows-fr">
            {utilityTools.map((tool, idx) => (
              <div key={tool.href} className="animate-scale-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <ToolCard {...tool} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ToolsGrid
