# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

I ❤️ JSON is a Next.js web application that provides JSON conversion tools. It converts JSON to/from various formats: CSV, YAML, XML, PHP arrays, Markdown, HTML, and tables. The app uses a file upload interface with drag-and-drop support.

## Development Commands

```bash
# Install dependencies (uses yarn)
yarn

# Start development server (runs on port 3002)
yarn dev

# Build for production
yarn build

# Start production server (runs on port 3000)
yarn start

# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

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

The `@constants/tools` array defines all available conversion tools. Each tool has:
- `from`: Source format
- `to`: Target format
- `description`: Tool description for meta tags
- `slug`: URL-friendly identifier (kebab-case)

When adding new conversion tools:
1. Add entry to `@constants/tools`
2. Create API route in `pages/api/{from}to{to}.jsx`
3. Add MIME type mapping in `@constants/mimetypes` if needed
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

## Requirements

- Node.js v22.x or higher (enforced via package.json engines)
- Yarn package manager
- Uses Next.js 16 with React 19
- Tailwind CSS 4.x for styling
