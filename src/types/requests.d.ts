declare module '@utils/requests' {
  interface ProgressEvent {
    stage: 'upload' | 'processing' | 'complete'
    progress: number
    loaded?: number
    total?: number
    message?: string
  }

  interface ApiResponse {
    success?: boolean
    message?: string
    error?: string
    data?: string
    [key: string]: any
  }

  export function getData(url: string): Promise<any>
  export function postFile(url: string, data: FormData): Promise<ApiResponse>
  export function postData(url: string, data: FormData): Promise<ApiResponse>
  export function postFileWithProgress(
    url: string,
    formData: FormData,
    onProgress?: ((event: ProgressEvent) => void) | null | undefined
  ): Promise<ApiResponse>
}
