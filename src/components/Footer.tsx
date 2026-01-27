import Link from "next/link"
import { Github, Twitter, Heart, Linkedin, Youtube } from "lucide-react"

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
      { label: "Sign In", href: "/auth/signin" },
      { label: "API Docs", href: "/api-docs" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

const socialLinks = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="w-full bg-muted/30 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
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
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
