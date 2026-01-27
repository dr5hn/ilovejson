declare module 'generate-schema' {
  interface Schema {
    $schema?: string
    title?: string
    type?: string
    properties?: Record<string, any>
    items?: any
    required?: string[]
  }

  function json(title: string, data: any): Schema
  function mongoose(data: any): Schema
  function bigquery(data: any): Schema
  function mysql(data: any): string
  function generic(data: any): Schema

  export = {
    json,
    mongoose,
    bigquery,
    mysql,
    generic
  }
}
