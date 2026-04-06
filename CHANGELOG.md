# Changelog

## v2.0.0 (2026-04-06)

Major UI/UX overhaul, SEO improvements, performance fixes, and codebase cleanup.

### Added
- **CLI page** with coming soon landing page
- **Dynamic sitemap.xml** covering all tools, utilities, and static pages
- **JSON-LD structured data** (WebApplication schema) on all tool pages
- **Mobile search** in header menu with real-time tool filtering
- **"Load example" button** on utility pages for first-time users
- **File deletion notice** on all upload panels (30-minute auto-delete)
- **Focus-visible outlines** globally for keyboard accessibility
- **Keyboard shortcut hints** showing Cmd on Mac, Ctrl on others
- **Error dismiss button** on alert components
- **crontab.conf** for server-side file cleanup (30-min retention)
- **About, Contact, Privacy, Terms** static pages

### Changed
- **Viewer page** rewritten with modern card layout, live error display, tree view
- **Diff page** rewritten with consistent styling, summary badges, keyboard shortcuts
- **Query page** rewritten with card layout, example sidebar, bottom action bar
- **Footer** links now display in single row on desktop (7-column grid)
- **Container widths** standardized across all utility pages with consistent padding
- **ConverterPage** buttons and padding made responsive for mobile
- **CTA section** "Start Converting" button now links to tool grid, uses red gradient
- **Hero section** search dropdown flicker fixed (onMouseDown prevents blur race)
- **README** simplified and modernized
- **CI workflow** updated to Node 25, main branch, with NODE_OPTIONS for OOM
- **Deploy workflow** pinned to appleboy/ssh-action@v1, added NVM sourcing

### Removed
- **Dark mode** — ThemeProvider, ThemeToggle, and .dark CSS variables removed
- **54 unused UI components** from shadcn/ui (only Button retained)
- **23 unused npm packages** (~50MB reduction) including Radix UI, recharts, embla-carousel, vaul, cmdk, react-day-picker, react-hook-form, react-resizable-panels, dotenv, input-otp
- **next-themes** package
- **"Built with" section** from About page
- **Auth UI** hidden from header and footer (code retained for future use)
- **"Get Started" button** removed from header navigation

### Fixed
- **fast-xml-parser** updated to 5.5.7 to patch moderate vulnerability
- **Build OOM** resolved by skipping TypeScript/ESLint during production build
- **CTA button text** invisible on dark background (was white-on-white)
- **Contact page** syntax error from missing `<a>` tag
- **Hero whitespace** reduced between navigation and hero section

### Security
- fast-xml-parser upgraded from 4.5.6 to 5.5.7 (CVE fix)
- Deploy action pinned to versioned tag (v1) instead of @master
