export const globals = {
  uploadDir: 'public/uploads',
  downloadDir: 'public/downloads',

  // File size limits (in bytes)
  maxFileSize: {
    free: 104857600,      // 100MB for free tier
    pro: 1073741824       // 1GB for pro tier (future)
  },

  // Streaming threshold - files larger than this use chunked processing
  streamingThreshold: 10485760,  // 10MB

  // Chunk size for reading/writing large files
  chunkSize: 1048576,            // 1MB

  // Large file indicator threshold (show warning above this)
  largeFileWarningThreshold: 10485760  // 10MB
}
