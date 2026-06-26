// 数据库查询结果的行类型
export interface DocumentRow {
  content: string
  source: string
  page: number
  similarity: number
}

// 上传接口的响应
export interface UploadResponse {
  success: boolean
  message: string
  chunksCount: number
  fileName: string
}

// 搜索接口的响应
export interface SearchResponse {
  success: boolean
  results: DocumentRow[]
}