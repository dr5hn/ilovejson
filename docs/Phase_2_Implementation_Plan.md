# iLoveJSON Phase 2 Implementation Plan

## Overview

Implementing **Phase 2: Expansion** with five priority areas:
1. **New Conversion Tools** - TOML, SQL, TypeScript, Excel (4 tools)
2. **AI-Proof Utility Tools** - Diff, Merge, Query, Faker (4 tools)
3. **User Authentication** - NextAuth.js with multiple providers
4. **User Dashboard** - History, settings, saved files
5. **File History** - localStorage-based recent files

## Current State (Post Phase 1)

- **Framework**: Next.js 16 + React 19 + Tailwind CSS 4
- **Middleware**: Rate limiting, file parsing, error handling (complete)
- **Dark Mode**: Fully implemented with system preference detection
- **File Limit**: 100MB with progress tracking
- **Keyboard Shortcuts**: ⌘+Enter to convert, Escape to reset
- **API Routes**: 12 conversion tools using middleware pattern

---

## FEATURE 1: New Conversion Tools

### 1.1 JSON ↔ TOML

**Use Case**: DevOps, Rust developers, configuration files

**Dependencies**:
```bash
yarn add @iarna/toml
```

**New Files**:
- `pages/api/jsontotoml.jsx` - JSON to TOML conversion
- `pages/api/tomltojson.jsx` - TOML to JSON conversion

**Update Files**:
- `src/constants/tools.jsx` - Add TOML tools
- `src/constants/mimetypes.jsx` - Add TOML mime type

**Implementation**:
```javascript
// jsontotoml.jsx
import TOML from '@iarna/toml';
const tomlString = TOML.stringify(jsonData);

// tomltojson.jsx
import TOML from '@iarna/toml';
const jsonData = TOML.parse(tomlString);
```

---

### 1.2 JSON ↔ SQL

**Use Case**: Database migrations, data import/export

**No external dependencies** - Custom implementation

**New Files**:
- `pages/api/jsontosql.jsx` - Generate INSERT statements
- `pages/api/sqltojson.jsx` - Parse INSERT statements to JSON

**Features**:
- Generate INSERT, UPDATE, or CREATE TABLE statements
- Support for multiple SQL dialects (MySQL, PostgreSQL, SQLite)
- Handle data type inference (string, number, boolean, null)
- Escape special characters properly

**Implementation**:
```javascript
// jsontosql.jsx - Generate INSERT statements
function jsonToSQL(data, tableName = 'data', dialect = 'mysql') {
  if (!Array.isArray(data)) data = [data];

  const columns = Object.keys(data[0]);
  const values = data.map(row => {
    return columns.map(col => escapeValue(row[col], dialect)).join(', ');
  });

  return values.map(v =>
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${v});`
  ).join('\n');
}
```

---

### 1.3 JSON ↔ TypeScript

**Use Case**: TypeScript developers, API type generation

**Dependencies**:
```bash
yarn add json-to-ts
```

**New Files**:
- `pages/api/jsontotypescript.jsx` - Generate TypeScript interfaces
- `pages/api/typescripttojson.jsx` - Generate sample JSON from TS interfaces

**Features**:
- Generate interfaces or types
- Handle nested objects and arrays
- Optional properties detection
- Union types for mixed arrays

**Implementation**:
```javascript
// jsontotypescript.jsx
import JsonToTS from 'json-to-ts';
const interfaces = JsonToTS(jsonData, { rootName: 'Root' });
```

---

### 1.4 JSON ↔ Excel (XLSX)

**Use Case**: Business users, data analysts, non-technical users

**Dependencies**:
```bash
yarn add xlsx
```

**New Files**:
- `pages/api/jsontoexcel.jsx` - JSON to XLSX file
- `pages/api/exceltojson.jsx` - XLSX to JSON

**Features**:
- Support for multiple sheets
- Auto-column width
- Header row styling
- Handle nested objects (flatten or multiple sheets)

**Implementation**:
```javascript
// jsontoexcel.jsx
import XLSX from 'xlsx';

const worksheet = XLSX.utils.json_to_sheet(jsonData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
XLSX.writeFile(workbook, outputPath);

// exceltojson.jsx
const workbook = XLSX.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
```

---

## FEATURE 2: AI-Proof Utility Tools

### 2.1 JSON Diff (Priority: High)

**Why AI Can't Do This**: Large file comparisons, token limits

**Dependencies**:
```bash
yarn add deep-diff
```

**New Files**:
- `pages/diff.jsx` - Diff tool page (different from conversion pages)
- `pages/api/jsondiff.jsx` - Compare two JSON files
- `src/components/DiffViewer.jsx` - Visual diff display

**Features**:
- Side-by-side comparison
- Highlight additions (green), deletions (red), modifications (yellow)
- Collapsible nested diffs
- Path-based navigation
- Export diff report

**UI Design**:
```
┌─────────────────────────────────────────────────────────┐
│  JSON Diff - Compare Two JSON Files                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐   ┌─────────────────┐              │
│  │  Drop File 1    │   │  Drop File 2    │              │
│  │  (Original)     │   │  (Modified)     │              │
│  └─────────────────┘   └─────────────────┘              │
│                                                         │
│  [Compare Files]                                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Diff Results:                                   │   │
│  │  + added: 5 fields                               │   │
│  │  - removed: 2 fields                             │   │
│  │  ~ modified: 8 fields                            │   │
│  │                                                   │   │
│  │  [Expandable tree view of changes]               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Implementation**:
```javascript
// pages/api/jsondiff.jsx
import { diff } from 'deep-diff';

function handler(req, res) {
  const { original, modified } = req.body;
  const differences = diff(original, modified);

  return ReS(res, {
    summary: {
      added: differences.filter(d => d.kind === 'N').length,
      removed: differences.filter(d => d.kind === 'D').length,
      modified: differences.filter(d => d.kind === 'E').length,
      arrayChanged: differences.filter(d => d.kind === 'A').length,
    },
    differences
  });
}
```

---

### 2.2 JSON Merge (Priority: High)

**Why AI Can't Do This**: Complex multi-file operations, conflict resolution

**New Files**:
- `pages/merge.jsx` - Merge tool page
- `pages/api/jsonmerge.jsx` - Merge multiple JSON files
- `src/components/MergeConflictResolver.jsx` - Conflict resolution UI

**Features**:
- Merge 2-10 files at once
- Conflict detection and resolution
- Merge strategies: shallow, deep, concat arrays, replace
- Preview before download

**Merge Strategies**:
| Strategy | Description |
|----------|-------------|
| `shallow` | Top-level properties only, last wins |
| `deep` | Recursive merge, last wins |
| `concat` | Arrays are concatenated |
| `unique` | Arrays are merged with unique values |
| `manual` | Show conflicts for user resolution |

**Implementation**:
```javascript
// pages/api/jsonmerge.jsx
function deepMerge(target, ...sources) {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key]) && isObject(target[key])) {
        target[key] = deepMerge({}, target[key], source[key]);
      } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
        target[key] = [...target[key], ...source[key]]; // concat strategy
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}
```

---

### 2.3 JSON Query (JQ Playground)

**Why AI Can't Do This**: Interactive exploration of large files

**Dependencies**:
```bash
yarn add jmespath
# Note: jq itself requires WebAssembly or server-side execution
```

**New Files**:
- `pages/query.jsx` - Query tool page
- `pages/api/jsonquery.jsx` - Execute JMESPath/JSONPath queries
- `src/components/QueryEditor.jsx` - Query input with syntax highlighting
- `src/components/QueryResults.jsx` - Results display

**Features**:
- JMESPath query support
- JSONPath query support
- Query history (localStorage)
- Common query templates
- Real-time preview as you type

**UI Design**:
```
┌─────────────────────────────────────────────────────────┐
│  JSON Query - JMESPath Playground                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  Drop JSON file or paste content                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Query: [people[*].name________________________________]│
│                                                         │
│  Templates: [Select All] [Filter] [Map] [Sort] [First] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Results:                                        │   │
│  │  ["John", "Jane", "Bob"]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Copy Results] [Download Results]                      │
└─────────────────────────────────────────────────────────┘
```

---

### 2.4 JSON Faker (Data Generator)

**Why AI Can't Do This**: Generating large datasets consistently

**Dependencies**:
```bash
yarn add @faker-js/faker
```

**New Files**:
- `pages/faker.jsx` - Faker tool page
- `pages/api/jsonfaker.jsx` - Generate fake data from schema
- `src/components/SchemaBuilder.jsx` - Visual schema builder

**Features**:
- Generate from JSON Schema
- Visual schema builder (no code needed)
- Configurable record count (1-10,000)
- Locale support (names in different languages)
- Seed support for reproducible data

**Supported Field Types**:
| Type | Examples |
|------|----------|
| `name` | Full name, first name, last name |
| `email` | Email address |
| `phone` | Phone number |
| `address` | Street, city, country, zip |
| `date` | Past, future, recent, birthdate |
| `number` | Int, float, between range |
| `uuid` | UUID v4 |
| `lorem` | Words, sentences, paragraphs |
| `image` | Avatar, placeholder URL |
| `company` | Company name, catch phrase |

**Implementation**:
```javascript
// pages/api/jsonfaker.jsx
import { faker } from '@faker-js/faker';

function generateFromSchema(schema, count = 10) {
  return Array.from({ length: count }, () => {
    const record = {};
    for (const [key, config] of Object.entries(schema)) {
      record[key] = generateField(config);
    }
    return record;
  });
}

function generateField(config) {
  switch (config.type) {
    case 'name': return faker.person.fullName();
    case 'email': return faker.internet.email();
    case 'uuid': return faker.string.uuid();
    case 'number': return faker.number.int({ min: config.min, max: config.max });
    // ... more types
  }
}
```

---

## FEATURE 3: User Authentication

### 3.1 NextAuth.js Setup

**Dependencies**:
```bash
yarn add next-auth @auth/prisma-adapter
yarn add prisma @prisma/client  # For database
```

**New Files**:
```
src/
├── lib/
│   ├── prisma.js           # Prisma client singleton
│   └── auth.js             # Auth configuration
├── components/
│   ├── AuthButton.jsx      # Sign in/out button
│   ├── UserMenu.jsx        # User dropdown menu
│   └── ProtectedRoute.jsx  # Route protection wrapper
pages/
├── api/
│   └── auth/
│       └── [...nextauth].js  # NextAuth API route
├── auth/
│   ├── signin.jsx          # Custom sign-in page
│   ├── signout.jsx         # Custom sign-out page
│   └── error.jsx           # Auth error page
prisma/
└── schema.prisma           # Database schema
```

**Supported Providers**:
1. **Google** - OAuth 2.0
2. **GitHub** - OAuth
3. **Email** - Magic link (passwordless)

**Environment Variables** (`.env.local`):
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth
GITHUB_ID=
GITHUB_SECRET=

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ilovejson"

# Email (for magic links)
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@ilovejson.com
```

**Prisma Schema**:
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  conversions   Conversion[]
  savedFiles    SavedFile[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Conversion {
  id         String   @id @default(cuid())
  userId     String
  tool       String   // e.g., "jsontocsv"
  inputSize  Int      // bytes
  outputSize Int      // bytes
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SavedFile {
  id        String   @id @default(cuid())
  userId    String
  name      String
  path      String
  size      Int
  type      String   // e.g., "json", "csv"
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## FEATURE 4: User Dashboard

### 4.1 Dashboard Pages

**New Files**:
```
pages/
├── dashboard/
│   ├── index.jsx           # Dashboard home
│   ├── history.jsx         # Conversion history
│   ├── files.jsx           # Saved files (Pro)
│   └── settings.jsx        # User settings
src/components/
├── dashboard/
│   ├── DashboardLayout.jsx # Dashboard wrapper
│   ├── StatsCards.jsx      # Usage statistics
│   ├── ConversionChart.jsx # Usage chart
│   ├── RecentConversions.jsx
│   └── SavedFilesList.jsx
```

**Dashboard Features**:
| Feature | Free | Pro |
|---------|------|-----|
| Conversion history | Last 10 | Unlimited |
| Saved files | None | 50 files, 7 days |
| Usage statistics | Basic | Detailed |
| Export history | No | CSV/JSON |

**UI Design**:
```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                          [User Menu ▼]       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 127      │ │ 45 MB    │ │ JSON→CSV │ │ Free     │   │
│  │ Total    │ │ Data     │ │ Top Tool │ │ Plan     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  Recent Conversions                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ File          Tool        Size     Date         │   │
│  │ data.json     JSON→CSV    2.3MB    2 min ago    │   │
│  │ config.yaml   YAML→JSON   156KB    1 hour ago   │   │
│  │ users.xml     XML→JSON    890KB    Yesterday    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [View All History]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## FEATURE 5: File History (localStorage)

### 5.1 Local History System

**New Files**:
- `src/hooks/useFileHistory.js` - History management hook
- `src/components/FileHistory.jsx` - History dropdown/panel
- `src/utils/localStorage.js` - Safe localStorage wrapper

**Features**:
- Store last 20 conversions locally
- Show recent files on tool pages
- Quick re-download (if file still exists)
- Clear history option
- No server storage (privacy-first)

**Data Structure**:
```javascript
// localStorage key: 'ilovejson_history'
{
  version: 1,
  items: [
    {
      id: 'abc123',
      fileName: 'data.json',
      tool: 'json-to-csv',
      inputSize: 2048,
      outputPath: '/downloads/jsontocsv/1234567890.csv',
      timestamp: 1704067200000,
    },
    // ... more items
  ]
}
```

**Implementation**:
```javascript
// src/hooks/useFileHistory.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ilovejson_history';
const MAX_ITEMS = 20;

export function useFileHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setHistory(data.items || []);
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const addToHistory = useCallback((item) => {
    setHistory(prev => {
      const newHistory = [
        { ...item, id: Date.now().toString(), timestamp: Date.now() },
        ...prev
      ].slice(0, MAX_ITEMS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        items: newHistory
      }));

      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}
```

---

## Critical Files Summary

### New Files to Create (30+)

```
# Conversion Tools (8 files)
pages/api/jsontotoml.jsx
pages/api/tomltojson.jsx
pages/api/jsontosql.jsx
pages/api/sqltojson.jsx
pages/api/jsontotypescript.jsx
pages/api/typescripttojson.jsx
pages/api/jsontoexcel.jsx
pages/api/exceltojson.jsx

# Utility Tools (8 files)
pages/diff.jsx
pages/api/jsondiff.jsx
src/components/DiffViewer.jsx
pages/merge.jsx
pages/api/jsonmerge.jsx
src/components/MergeConflictResolver.jsx
pages/query.jsx
pages/api/jsonquery.jsx
src/components/QueryEditor.jsx
pages/faker.jsx
pages/api/jsonfaker.jsx
src/components/SchemaBuilder.jsx

# Authentication (8 files)
pages/api/auth/[...nextauth].js
pages/auth/signin.jsx
pages/auth/signout.jsx
pages/auth/error.jsx
src/lib/prisma.js
src/lib/auth.js
src/components/AuthButton.jsx
src/components/UserMenu.jsx

# Dashboard (8 files)
pages/dashboard/index.jsx
pages/dashboard/history.jsx
pages/dashboard/files.jsx
pages/dashboard/settings.jsx
src/components/dashboard/DashboardLayout.jsx
src/components/dashboard/StatsCards.jsx
src/components/dashboard/RecentConversions.jsx
src/components/dashboard/SavedFilesList.jsx

# File History (3 files)
src/hooks/useFileHistory.js
src/components/FileHistory.jsx
src/utils/localStorage.js

# Database
prisma/schema.prisma
```

### Files to Modify

```
src/constants/tools.jsx      # Add new conversion tools
src/constants/utils.jsx      # Add new utility tools
src/constants/mimetypes.jsx  # Add TOML, XLSX mime types
src/components/layout.jsx    # Add AuthButton, UserMenu
pages/_app.js                # Add SessionProvider
pages/[slug].jsx             # Add file history integration
package.json                 # Add new dependencies
```

---

## Dependencies to Install

```bash
# Conversion tools
yarn add @iarna/toml          # TOML parsing
yarn add json-to-ts           # TypeScript generation
yarn add xlsx                 # Excel support

# Utility tools
yarn add deep-diff            # JSON diff
yarn add jmespath             # JSON query
yarn add @faker-js/faker      # Fake data generation

# Authentication
yarn add next-auth            # Authentication
yarn add @auth/prisma-adapter # Prisma adapter
yarn add prisma               # Database ORM
yarn add @prisma/client       # Prisma client
```

---

## Implementation Order

### Week 1: New Conversion Tools
1. Install dependencies (TOML, TypeScript, XLSX)
2. Implement JSON ↔ TOML
3. Implement JSON ↔ SQL
4. Implement JSON ↔ TypeScript
5. Implement JSON ↔ Excel
6. Update tools.jsx and mimetypes.jsx
7. Test all new conversions

### Week 2: AI-Proof Utility Tools
1. Create JSON Diff page and API
2. Create DiffViewer component
3. Create JSON Merge page and API
4. Create JSON Query page and API
5. Create JSON Faker page and API
6. Test all utility tools

### Week 3: User Authentication
1. Set up PostgreSQL database
2. Create Prisma schema and migrate
3. Configure NextAuth.js
4. Create auth API routes
5. Create custom sign-in/sign-out pages
6. Add AuthButton and UserMenu to layout
7. Test authentication flow

### Week 4: Dashboard & File History
1. Create dashboard layout and pages
2. Implement conversion tracking
3. Create stats components
4. Implement file history hook
5. Add history UI to tool pages
6. Integration testing
7. Polish and bug fixes

---

## Success Metrics

**Conversion Tools**:
- All 8 new tools functional
- Support same 100MB file limit
- Follow existing middleware pattern

**Utility Tools**:
- Diff: Compare files up to 50MB
- Merge: Handle 10 files at once
- Query: Sub-100ms response for 10MB files
- Faker: Generate 10,000 records in <2s

**Authentication**:
- <3s sign-in flow
- Session persistence across tabs
- Graceful error handling

**Dashboard**:
- <1s page load
- Real-time stats updates
- Mobile-responsive design

---

## Risk Mitigation

**High Risk**:
1. **Database setup complexity** - Provide SQLite fallback for development
2. **OAuth configuration** - Document step-by-step setup guide
3. **Large file diff performance** - Stream-based comparison for 50MB+ files

**Medium Risk**:
1. **XLSX file corruption** - Extensive testing with various Excel versions
2. **TypeScript edge cases** - Handle circular refs, unknown types
3. **JQ query errors** - Sandbox execution, timeout protection

---

## Summary

Phase 2 transforms iLoveJSON from a simple converter to a comprehensive JSON toolkit:

| Category | Before | After |
|----------|--------|-------|
| Conversion Tools | 12 | 20 (+8) |
| Utility Tools | 6 | 10 (+4 AI-proof) |
| User Accounts | None | Full auth system |
| History | None | Local + cloud storage |
| Dashboard | None | Full analytics |

**Priority Order**:
1. AI-proof tools (Diff, Merge, Query, Faker) - Highest value
2. Conversion tools (TOML, SQL, TS, Excel) - User demand
3. File history (localStorage) - Quick win
4. Authentication - Foundation for monetization
5. Dashboard - Requires auth first

---

## Next Steps

1. **Immediate**: Install dependencies for conversion tools
2. **Day 1-2**: Implement TOML and SQL converters
3. **Day 3-4**: Implement TypeScript and Excel converters
4. **Day 5-7**: Build JSON Diff and Merge tools
5. **Week 2**: Complete remaining utility tools
6. **Week 3-4**: Authentication and dashboard
