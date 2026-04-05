# I ❤️ JSON

Free, open-source online tools to convert, transform, and work with JSON files.

**Live:** [ilovejson.com](https://www.ilovejson.com)

## Features

- **20+ Conversion Tools** — JSON to/from CSV, YAML, XML, PHP, Markdown, HTML, TOML, SQL, TypeScript, Excel
- **Utility Tools** — Beautify, Minify, Compress, Validate, Viewer, Editor, Repair, Diff, Merge, Query, Faker, Generate Schema
- **File Upload** — Drag-and-drop with up to 100MB file support
- **Keyboard Shortcuts** — Cmd/Ctrl+Enter to process, Escape to reset
- **Privacy First** — Files are automatically deleted after 30 minutes

## Prerequisites

- [Node.js v25.x](https://nodejs.org/en/download/) or higher
- npm package manager

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (runs on port 3002)
npm run dev
```

### Using Docker

```bash
docker-compose up
```

## Development Commands

```bash
npm run dev          # Start dev server (port 3002)
npm run build        # Build for production
npm start            # Start production server (port 3000)
npm run lint         # Run linting
npm run lint:fix     # Fix lint issues
```

## Project Structure

```
pages/
  [slug].tsx         # Dynamic conversion tool pages
  api/               # API routes for all conversions
  viewer/            # JSON viewer
  diff/              # JSON diff tool
  repair/            # JSON repair tool
  faker.jsx          # Fake data generator
  merge.jsx          # JSON merge tool
  query.jsx          # JSON query tool
src/
  components/        # React components
  constants/         # Tool definitions, MIME types
  middleware/         # API middleware (rate limit, file parser)
  utils/             # Shared utilities
  hooks/             # Custom React hooks
styles/              # Tailwind CSS
```

## Contributing

Contributions, bug reports, and feature requests are welcome on [GitHub](https://github.com/ilovejson/ilovejson).

### Contributors

<a href="https://github.com/ilovejson/ilovejson/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ilovejson/ilovejson&anon=1" />
</a>

### Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/dr5hn/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/dr5hn/static/sponsors.svg'/>
  </a>
</p>

## License

Open source. See repository for details.
