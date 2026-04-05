import Link from "next/link"
import { Heart } from "lucide-react"

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const footerLinks = [
  {
    title: "Utilities",
    links: [
      { label: "Compress", href: "/compress" },
      { label: "Beautify", href: "/beautify" },
      { label: "Validate", href: "/validate" },
      { label: "Viewer", href: "/viewer" },
      { label: "Editor", href: "/editor" },
      { label: "Repair", href: "/repair" },
      { label: "Generate Schema", href: "/generateschema" },
      { label: "Diff", href: "/diff" },
      { label: "Merge", href: "/merge" },
      { label: "Query", href: "/query" },
      { label: "Faker", href: "/faker" },
      { label: "Minify", href: "/minify" },
    ],
  },
  {
    title: "Converters",
    links: [
      { label: "JSON to CSV", href: "/json-to-csv" },
      { label: "CSV to JSON", href: "/csv-to-json" },
      { label: "JSON to YAML", href: "/json-to-yaml" },
      { label: "YAML to JSON", href: "/yaml-to-json" },
      { label: "JSON to XML", href: "/json-to-xml" },
      { label: "XML to JSON", href: "/xml-to-json" },
      { label: "JSON to PHP", href: "/json-to-php" },
      { label: "PHP to JSON", href: "/php-to-json" },
    ],
  },
  {
    title: "More Converters",
    links: [
      { label: "JSON to TypeScript", href: "/json-to-typescript" },
      { label: "TypeScript to JSON", href: "/typescript-to-json" },
      { label: "JSON to Markdown", href: "/json-to-markdown" },
      { label: "Markdown to JSON", href: "/markdown-to-json" },
      { label: "JSON to HTML", href: "/json-to-html" },
      { label: "HTML to JSON", href: "/html-to-json" },
      { label: "JSON to TOML", href: "/json-to-toml" },
      { label: "TOML to JSON", href: "/toml-to-json" },
    ],
  },
  {
    title: "Data Tools",
    links: [
      { label: "JSON to SQL", href: "/json-to-sql" },
      { label: "SQL to JSON", href: "/sql-to-json" },
      { label: "JSON to Excel", href: "/json-to-excel" },
      { label: "Excel to JSON", href: "/excel-to-json" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "CLI", href: "/cli" },
      { label: "API", href: "/api-docs" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

const socialLinks = [
  { icon: GithubIcon, href: "https://github.com/ilovejson/ilovejson", label: "GitHub" },
]

export function Footer() {
  return (
    <footer className="w-full bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-16">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-1 mb-5 group">
              <span className="text-2xl font-black text-foreground">I</span>
              <span className="flex items-center text-2xl font-black text-muted-foreground">
                {"{"}
                <Heart className="w-5 h-5 text-red-500 fill-red-500 group-hover:scale-110 transition-transform mx-0.5" />
                {"}"}
              </span>
              <span className="text-2xl font-black text-foreground">JSON</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs">
              Free online tools to convert, transform, and work with JSON files. Built with love by developers.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-secondary hover:-translate-y-0.5 transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} I Love JSON. Made with{" "}
            <Heart className="w-3.5 h-3.5 inline text-red-500 fill-red-500 mx-0.5" />
            by developers.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
