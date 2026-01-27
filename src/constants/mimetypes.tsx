export const mimeTypes: Record<string, Record<string, string[]>> = {
  json: {
    'application/json': ['.json'],
    'text/json': ['.json'],
    'application/json;charset=utf-8': ['.json']
  },
  xml: {
    'application/xml': ['.xml'],
    'text/xml': ['.xml']
  },
  csv: {
    'text/csv': ['.csv'],
    'text/plain': ['.csv'],
    'application/vnd.ms-excel': ['.csv'],
    'application/csv': ['.csv']
  },
  yaml: {
    'text/yaml': ['.yaml', '.yml'],
    'text/x-yaml': ['.yaml', '.yml'],
    'application/x-yaml': ['.yaml', '.yml'],
    'application/yaml': ['.yaml', '.yml']
  },
  toml: {
    'application/toml': ['.toml'],
    'text/toml': ['.toml'],
    'text/x-toml': ['.toml']
  },
  excel: {
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls', '.xlsx']
  },
  sql: {
    'application/sql': ['.sql'],
    'text/sql': ['.sql'],
    'text/x-sql': ['.sql'],
    'text/plain': ['.sql']
  },
  typescript: {
    'text/typescript': ['.ts'],
    'application/typescript': ['.ts'],
    'text/plain': ['.ts']
  },
  php: {
    'text/x-php': ['.php'],
    'application/x-php': ['.php'],
    'text/plain': ['.php']
  },
  markdown: {
    'text/markdown': ['.md', '.markdown'],
    'text/x-markdown': ['.md', '.markdown'],
    'text/plain': ['.md', '.markdown']
  },
  html: {
    'text/html': ['.html', '.htm'],
    'application/xhtml+xml': ['.html', '.htm']
  }
}

// Format colors for visual representation
export const formatColors: Record<string, string> = {
  json: '#ef4444',      // red
  csv: '#22c55e',       // green
  yaml: '#f97316',      // orange
  xml: '#eab308',       // yellow
  php: '#777bb4',       // purple
  markdown: '#083fa1',  // blue
  html: '#e44d26',      // html orange
  toml: '#9c4221',      // brown
  sql: '#336791',       // postgres blue
  typescript: '#3178c6', // ts blue
  excel: '#217346',     // excel green
}

// Short format labels
export const formatLabels: Record<string, string> = {
  json: '{ }',
  csv: 'CSV',
  yaml: 'YML',
  xml: 'XML',
  php: 'PHP',
  markdown: 'MD',
  html: 'HTM',
  toml: 'TML',
  sql: 'SQL',
  typescript: 'TS',
  excel: 'XLS',
}
