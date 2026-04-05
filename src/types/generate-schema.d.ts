declare module 'to-json-schema' {
  interface JsonSchema {
    type?: string
    properties?: Record<string, any>
    items?: any
    required?: string[]
    [key: string]: any
  }

  function toJsonSchema(value: any, options?: any): JsonSchema
  export = toJsonSchema
}
