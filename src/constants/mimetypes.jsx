export const mimeTypes = {
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
  }
};
