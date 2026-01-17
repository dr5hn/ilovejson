# iLoveJSON Phase 1 Implementation Plan

## Overview

Implementing **Phase 1: Foundation** with three priority features:
1. **API Middleware** - Clean up duplicate code, add rate limiting
2. **Dark Mode & UX** - Theme toggle, keyboard shortcuts, better loading states
3. **Large File Handling** - Support 100MB files with streaming

## Current State

- **Framework**: Next.js 16 + React 19 + Tailwind CSS 4
- **API Routes**: 12 conversion endpoints in `/pages/api/*.jsx` with ~80% duplicate code
- **File Limit**: 1MB hardcoded client-side limit
- **No middleware, no rate limiting, no dark mode**

---

## FEATURE 1: API Middleware & Rate Limiting

### Objective
Reduce API route boilerplate from ~80 lines to ~30 lines per route by extracting common patterns into reusable middleware.

### Implementation Steps

#### 1. Create Middleware Infrastructure

**New Files to Create:**

```
src/middleware/
├── apiMiddleware.js      # Middleware composition system
├── methodValidation.js   # POST/GET validation
├── rateLimit.js          # 20 req/min per IP (in-memory Map)
├── fileParser.js         # Formidable file parsing
└── errorHandler.js       # Global error handling
```

#### 2. Middleware Components

**a) Method Validation** (`src/middleware/methodValidation.js`)
- Validate HTTP method (POST only for conversions)
- Return 405 error for invalid methods

**b) Rate Limiting** (`src/middleware/rateLimit.js`)
- In-memory Map for tracking requests per IP
- Sliding window: 20 requests per 60 seconds (free tier)
- Return 429 error when limit exceeded
- Set X-RateLimit-* headers

**c) File Parser** (`src/middleware/fileParser.js`)
- Centralize Formidable file parsing
- Handle array/object file path variations
- Server-side file size validation (100MB max)
- Attach `req.uploadedFile` for next middleware

**d) Error Handler** (`src/middleware/errorHandler.js`)
- Wrap handlers in try-catch
- Log errors in production (Sentry integration ready)
- Return consistent error format with ReE helper

#### 3. Refactor API Routes

**Template Pattern** (apply to all 12 routes):

```javascript
// Before: ~80 lines with boilerplate
// After: ~30 lines focused on conversion logic

import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }),
  ]);

  // Conversion logic only
  const content = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const converted = convertFunction(content);
  fs.writeFileSync(outputPath, converted, 'utf8');

  return ReS(res, { message: '...', data: '/path' });
}

export default errorHandler(handler);
```

**Files to Modify:**
- `/pages/api/jsontocsv.jsx` (proof of concept first)
- Then all 12 API routes: csvtojson, xmltojson, yamltojson, phptojson, markdowntojson, htmltojson, jsontotable, ilovejson

#### 4. Testing Strategy
- Unit test each middleware function
- Integration test refactored routes
- Load test rate limiting (simulate 30 req/min)
- Verify backward compatibility (existing responses unchanged)

---

## FEATURE 2: Dark Mode & UX Improvements

### Objective
Add dark mode with system preference detection, keyboard shortcuts, better loading states, and improved mobile experience.

### Implementation Steps

#### 1. Configure Tailwind Dark Mode

**File: `/tailwind.config.js`**
- Enable `darkMode: 'class'` strategy
- Add custom dark color palette:
  - `dark-bg`: #1a1a1a
  - `dark-surface`: #2d2d2d
  - `dark-border`: #404040
  - `dark-text`: #e0e0e0
  - `dark-muted`: #a0a0a0

#### 2. Create Theme System

**New Files:**
- `/src/contexts/ThemeContext.jsx` - Theme state with Context API
  - Load from localStorage + system preference
  - Persist theme choice
  - Prevent FOUC (Flash of Unstyled Content)

- `/src/components/ThemeToggle.jsx` - Moon/Sun icon toggle button
  - Show in header navigation
  - Accessible with aria-label

- `/src/hooks/useKeyboardShortcuts.js` - Global keyboard shortcuts
  - Cmd/Ctrl + Enter: Convert file
  - Escape: Reset form
  - Works across all tool pages

#### 3. Update Core Components

**File: `/pages/_app.js`**
- Wrap app with `<ThemeProvider>`
- Add inline script to prevent FOUC:
  ```javascript
  <script>
    const theme = localStorage.getItem('theme');
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (!theme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  </script>
  ```

**File: `/src/components/layout.jsx`**
- Add `<ThemeToggle />` to header
- Update all classes with dark mode variants:
  - `bg-white dark:bg-dark-surface`
  - `text-gray-900 dark:text-dark-text`
  - `border-gray-200 dark:border-dark-border`

**File: `/pages/[slug].jsx`**
- Add keyboard shortcuts with `useKeyboardShortcuts` hook
- Update dropzone with dark mode classes
- Enhanced drag feedback (active/accept/reject states)
- Add visual indicators for drag state

#### 4. Improve Loading States

**New File: `/src/components/LoadingState.jsx`**
- `<SkeletonLoader />` - Animated placeholder
- `<ProgressIndicator progress={n} />` - Progress bar
- `<ConversionLoader message="..." />` - Spinner with message

**Usage in `/pages/[slug].jsx`:**
- Show skeleton during initial load
- Show progress bar for large uploads
- Show conversion loader during processing

#### 5. Mobile Improvements

**Update `/styles/globals.css`:**
- Reduce font sizes on mobile (h1: 2rem instead of 4rem)
- Full-width buttons on mobile
- Better touch targets (min 44x44px)
- Dropzone min-height: 40vh on mobile

#### 6. Keyboard Shortcut Help

**New File: `/src/components/KeyboardShortcutHelp.jsx`**
- Floating "?" button (bottom-right)
- Modal showing all shortcuts
- Detects Mac vs Windows (⌘ vs Ctrl)

#### 7. Testing Strategy
- Test theme toggle in all browsers
- Verify localStorage persistence
- Test system preference detection
- Verify no FOUC on page load
- Test keyboard shortcuts on Mac/Windows
- Mobile testing on real devices
- Accessibility audit (color contrast)

---

## FEATURE 3: Large File Handling (100MB)

### Objective
Support 100MB files (vs current 1MB) with streaming for efficient memory usage and progress tracking.

### Implementation Steps

#### 1. Update Client-Side Limits

**File: `/pages/[slug].jsx`**
- Change `maxSize` from 1048576 (1MB) to 104857600 (100MB)
- Add file size detection to show "Large file..." message for 10MB+
- Add state for upload progress and processing stage

#### 2. Add Upload Progress Tracking

**File: `/src/utils/requests.jsx`**
- Create `postFileWithProgress(url, formData, onProgress)`
- Use XMLHttpRequest for upload progress events
- Track percentage: `(loaded / total) * 100`
- Callback: `onProgress({ stage: 'upload', progress: percent })`

#### 3. Create Streaming Processor

**New File: `/src/utils/streamProcessor.js`**
- `processLargeFile(inputPath, outputPath, transformFn, options)`
- Check file size threshold (10MB)
- **Small files (<10MB)**: Synchronous read/write (faster)
- **Large files (>10MB)**: Streaming read, chunked write
- Use Node.js streams with 1MB chunks

**Key Functions:**
- `processSync()` - Standard fs.readFileSync/writeFileSync
- `processWithStreaming()` - Stream-based processing
- `readFileAsync()` - Read in chunks
- `writeFileInChunks()` - Write with backpressure handling

#### 4. Update Server Configuration

**File: `/next.config.js`**
- Add `serverRuntimeConfig.bodySizeLimit: '100mb'`
- Enable `compress: true` for large responses

**File: `/src/middleware/fileParser.js`**
- Update `maxFileSize: 104857600` (100MB)
- Add file size error handling with clear messages

**File: `/src/constants/globals.jsx`**
- Add constants:
  ```javascript
  maxFileSize: { free: 104857600, pro: 1073741824 }
  streamingThreshold: 10485760  // 10MB
  chunkSize: 1048576            // 1MB
  ```

#### 5. Update API Routes for Streaming

**File: `/pages/api/jsontocsv.jsx` (and all others)**
- Import `processLargeFile` from streamProcessor
- Replace direct fs.readFileSync/writeFileSync with:
  ```javascript
  const transformFn = (content) => {
    const json = JSON.parse(content);
    return json2csv(json, options);
  };

  await processLargeFile(inputPath, outputPath, transformFn, {
    threshold: 10485760
  });
  ```

#### 6. Add Progress UI

**File: `/pages/[slug].jsx`**
- Add states: `uploadProgress`, `processingStage`
- Render `<ProgressIndicator progress={uploadProgress} />` during upload
- Show stage-specific messages:
  - "Uploading file..." (0-100%)
  - "Converting your file..." (processing)
  - "Complete!" (done)

#### 7. Memory Management

**New File: `/src/utils/memoryManager.js`** (Optional)
- Monitor heap usage with `process.memoryUsage()`
- Force garbage collection for large files
- Throw error if memory exceeds 80% of heap

#### 8. Testing Strategy
- Test files: 1MB, 10MB, 50MB, 100MB, 101MB (should fail)
- Monitor memory usage (Node.js with `--inspect`)
- Test concurrent uploads (2-3 simultaneous)
- Verify progress bar accuracy
- Test cleanup of temp files
- Load test sustained large uploads

---

## Critical Files Summary

### New Files to Create (17)
```
src/middleware/
  apiMiddleware.js
  methodValidation.js
  rateLimit.js
  fileParser.js
  errorHandler.js

src/contexts/
  ThemeContext.jsx

src/components/
  ThemeToggle.jsx
  LoadingState.jsx
  KeyboardShortcutHelp.jsx

src/hooks/
  useKeyboardShortcuts.js

src/utils/
  streamProcessor.js
  memoryManager.js (optional)
```

### Files to Modify (8)
```
tailwind.config.js          # Dark mode config
next.config.js              # Body size limit
pages/_app.js               # Theme provider
src/components/layout.jsx   # Theme toggle + dark styles
pages/[slug].jsx            # Progress UI + keyboard shortcuts + dark mode
src/utils/requests.jsx      # Add postFileWithProgress
src/constants/globals.jsx   # Add file size constants

pages/api/*.jsx (12 routes) # Refactor with middleware
```

---

## Implementation Order

### Week 1: API Middleware
1. Create all 5 middleware files
2. Refactor jsontocsv.jsx as proof of concept
3. Test thoroughly
4. Refactor remaining 11 API routes
5. Integration testing

### Week 2: Dark Mode & UX
1. Configure Tailwind + create ThemeContext
2. Update _app.js and layout.jsx
3. Create ThemeToggle component
4. Add keyboard shortcuts hook
5. Update all components with dark mode classes
6. Create loading state components
7. Mobile improvements

### Week 3: Large Files
1. Create streamProcessor utility
2. Update client-side file limits
3. Add postFileWithProgress
4. Update server config (Next.js)
5. Refactor API routes for streaming
6. Add progress UI
7. Testing with various file sizes

### Week 4: Polish & Testing
- Cross-browser testing
- Mobile device testing
- Performance benchmarks
- Load testing
- Bug fixes
- Documentation

---

## Dependencies

**Good News**: All features can be implemented with existing dependencies! No new packages required.

**Optional Additions:**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2"
  }
}
```

---

## Success Metrics

**API Middleware:**
- 60% code reduction in API routes (80 lines → 30 lines)
- 100% routes protected with rate limiting
- Zero response time degradation

**Dark Mode:**
- <100ms theme switch time
- Zero FOUC instances
- 100% keyboard shortcuts functional

**Large Files:**
- 100MB files process successfully
- <80% memory utilization
- Progress accuracy ±5%
- 95%+ success rate under 100MB

---

## Risk Mitigation

**High Risk:**
1. **Memory exhaustion** - Mitigate with streaming + memory manager
2. **Rate limit state loss** - Plan Redis migration for production
3. **FOUC** - Inline script in _app.js prevents flash

**Medium Risk:**
1. **Backward compatibility** - Extensive testing of all 12 API routes
2. **Performance regression** - Benchmark before/after
3. **Large file timeouts** - Monitor serverless limits

---

## Next Steps After Implementation

1. Add Google Analytics 4 (track usage patterns)
2. Add Sentry error tracking (production monitoring)
3. SEO optimization (meta tags, sitemap)
4. Add 2-3 AI-proof tools (Batch Processor, JSON Diff, JSON Merge)
5. User authentication (NextAuth.js)
6. DoDoPayments integration (Pro tier)

---

**Estimated Effort**: 3-4 weeks for solo developer
**Risk Level**: Medium (well-understood patterns, minimal new dependencies)
**Impact**: High (foundation for future monetization + AI-proof features)
