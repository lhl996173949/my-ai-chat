import axios from 'axios'

const API_BASE = 'http://localhost:3001'

// 上传 PDF
export async function uploadPDF(file: File): Promise<{ chunksCount: number; fileName: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })

    return response.data
}

// 检索相似文档
export async function searchDocuments(query: string, limit = 5): Promise<Array<{
    content: string
    source: string
    page: number
    similarity: number
}>> {
    const response = await axios.post(`${API_BASE}/api/search`, { query, limit })
    return response.data.results
}

// 基于文档提问（RAG）
export async function askWithRAG(query: string): Promise<string> {
    // 1. 检索相关文档
    const relevantDocs = await searchDocuments(query)

    // 2. 构建上下文
    const context = relevantDocs
        .map(doc => `[来自 ${doc.source} 第${doc.page}页]: ${doc.content}`)
        .join('\n\n')

    // 3. 调用 DeepSeek Chat API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `你是一个基于文档的智能助手。请根据以下资料回答问题。如果资料不足以回答问题，请如实告知。\n\n相关资料：\n${context}`
                },
                {
                    role: 'user',
                    content: query
                }
            ]
        })
    })

    const data = await response.json()
    return data.choices[0].message.content
}