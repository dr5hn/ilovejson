# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

I ❤️ JSON is a Next.js web application that provides JSON conversion and utility tools. It converts JSON to/from various formats (CSV, YAML, XML, PHP arrays, Markdown, HTML, TOML, SQL, TypeScript, Excel) and offers utilities (diff, merge, query, faker, validate, beautify, compress, viewer, generate schema). The app uses a file upload interface with drag-and-drop support and optional user authentication.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 3002)
npm run dev

# Build for production
npm run build

# Start production server (runs on port 3000)
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Database commands (requires DATABASE_URL in .env)
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open database GUI

# Run with Docker
docker-compose up
```

**Note:** Development server runs on port 3002, production runs on port 3000.

## Architecture

### Path Aliases (jsconfig.json)

The project uses path aliases configured in `jsconfig.json`:
- `@components/*` → `src/components/*`
- `@constants/*` → `src/constants/*`
- `@utils/*` → `src/utils/*`
- `@middleware/*` → `src/middleware/*`
- `@contexts/*` → `src/contexts/*`
- `@hooks/*` → `src/hooks/*`
- `@lib/*` → `src/lib/*`
- `@generated/*` → `src/generated/*` (Prisma client)

Always use these aliases instead of relative imports.

### API Route Pattern

All conversion APIs in `pages/api/` follow a consistent middleware-based architecture:

```javascript
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

// Disable Next.js built-in body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  // Run middleware chain
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // Core conversion logic here
  // Use ReS() for success responses
  return ReS(res, { message: '...', data: '/path/to/file' });
}

// Wrap handler with error handling
export default errorHandler(handler);
```

**Key points:**
- All API routes must disable Next.js bodyParser (`bodyParser: false`)
- Use `runMiddleware()` to compose middleware in sequence
- Middleware order matters: validateMethod → rateLimit → parseFile
- Always wrap handler with `errorHandler()` for consistent error handling
- Use `ReS(res, data, code)` for success responses and `ReE(res, error, code)` for errors
- File parsing middleware attaches uploaded file to `req.uploadedFile`

### Dynamic Conversion Pages ([slug].jsx)

The `pages/[slug].jsx` file handles all conversion tool pages using Next.js dynamic routing:

1. **Slug to API mapping:** Converts kebab-case slugs to API route names
   - `json-to-csv` → API endpoint `/api/jsontocsv`
   - `csv-to-json` → API endpoint `/api/csvtojson`

2. **Static generation:** Uses `getStaticPaths()` to pre-render pages for all tools defined in `@constants/tools`

3. **File type detection:** Extracts source and target formats from slug
   - First part determines MIME type for file upload validation
   - Last part determines output file extension

4. **State management:**
   - Handles file upload, conversion, loading, and error states
   - Resets state when new file is selected after conversion
   - Shows Convert button → Loader → Download button progression

### Middleware System

The middleware system in `src/middleware/` provides composable request processing:

- **apiMiddleware.js:** Core middleware runner that chains middleware functions
- **methodValidation.js:** Validates HTTP methods (typically POST only)
- **rateLimit.js:** Prevents API abuse (default: 20 requests per minute)
- **fileParser.js:** Parses multipart/form-data uploads using formidable
- **errorHandler.js:** Wraps handlers with try-catch and provides consistent error responses

### File Organization

- **Upload/Download directories:** Files are stored in `public/uploads/{conversion-type}/` and `public/downloads/{conversion-type}/`
- **Directory initialization:** `@utils/initdir` creates required directories on startup
- **File naming:** Downloaded files use format `{originalName}_{timestamp}.{extension}`

### Tools Configuration

**Conversion Tools** (`@constants/tools.jsx`): JSON to/from CSV, YAML, XML, PHP, Markdown, HTML, TOML, SQL, TypeScript, Excel. Each tool has:
- `from`: Source format
- `to`: Target format
- `description`: Tool description for meta tags
- `slug`: URL-friendly identifier (kebab-case)

**Utility Tools** (`@constants/utils.jsx`): Compress, Beautify, Validate, Viewer, Editor, Repair, Generate Schema, Diff, Merge, Query, Faker. These have dedicated pages in `pages/` rather than using dynamic routing.

When adding new conversion tools:
1. Add entry to `@constants/tools.jsx`
2. Create API route in `pages/api/{from}to{to}.jsx`
3. Add MIME type mapping in `@constants/mimetypes.jsx` if needed
4. Follow the established middleware pattern

### Response Format

All API responses follow a consistent structure:

**Success:**
```json
{
  "success": true,
  "message": "I ❤️ JSON. Conversion Successful.",
  "data": "/downloads/conversion-type/timestamp.ext"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Authentication (Optional)

The app includes optional NextAuth.js authentication with OAuth providers (Google, GitHub, Microsoft). When configured:
- User sessions track conversion history (`Conversion` model)
- Users can save files (`SavedFile` model)
- Prisma client is generated to `src/generated/prisma/`

Setup requires: PostgreSQL database, `DATABASE_URL`, `NEXTAUTH_SECRET`, and at least one OAuth provider configured in `.env` (see `.env.example`).

## Build & Deploy

- `next.config.js` skips TypeScript and ESLint checks during build (`ignoreBuildErrors`, `ignoreDuringBuilds`) to prevent OOM
- CI runs on Node 25 with `NODE_OPTIONS="--max-old-space-size=4096"` as safety net
- Deploy workflow uses `appleboy/ssh-action@v1` to SSH into server, pull, build, and PM2 reload
- File cleanup: `crontab.conf` purges uploads/downloads older than 30 minutes (install with `crontab crontab.conf` on server)
- Sitemap: dynamically generated at `/sitemap.xml`

## UI Components

Only `src/components/ui/button.tsx` remains from the original shadcn/ui install. All other UI primitives were removed as unused. The Button depends on `@radix-ui/react-slot` and `@lib/utils` (cn helper).

## Dark Mode

Dark mode has been removed. The `.dark` CSS variables block was deleted from `tailwind.css`. Remaining `dark:` prefixed classes in some components are inert (no `.dark` class is ever applied to the root). ThemeProvider and ThemeToggle have been deleted.

## Authentication

Auth UI (sign-in buttons, UserMenu) is hidden but all auth code is retained for future use:
- NextAuth.js config in `src/lib/auth.js`
- Auth API route at `pages/api/auth/[...nextauth].js`
- Dashboard pages at `pages/dashboard/`
- Prisma schema with User, Conversion, SavedFile models

## Requirements

- Node.js v25.x or higher (enforced via package.json engines)
- npm package manager
- Uses Next.js 16 with React 19
- Tailwind CSS 4.x for styling
- PostgreSQL (optional, for authentication features)
