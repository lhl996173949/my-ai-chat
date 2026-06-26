// import fs from 'fs'
import PDFParser from 'pdf2json'
// 使用 createRequire 来加载 CommonJS 模块
// import { createRequire } from 'module'
// const require = createRequire(import.meta.url)
// const pdfParse = require('pdf-parse')
// // @1ts-expect-error - pdf-parse 类型定义不完善，但运行时正常工作
// import pdfParse from 'pdf-parse'

// import zlib from 'zlib'

// export async function readPDF(filePath: string): Promise<string> {
//     const dataBuffer = fs.readFileSync(filePath)
//     const content = dataBuffer.toString('utf-8')

//     // 提取 PDF 中的文本内容（正则匹配）
//     const textMatches = content.match(/\((.*?)\)/g) || []
//     const extractedText = textMatches
//         .map(match => match.slice(1, -1))
//         .filter(text => text.length > 2)
//         .join(' ')

//     return extractedText || '未能提取到文本内容'
// }

// export async function readPDF(filePath: string): Promise<string> {
//     const dataBuffer = fs.readFileSync(filePath)
//     // 动态导入 pdf-parse
//     const pdfParseModule = await import('pdf-parse')
//     const pdfParse = pdfParseModule.default || pdfParseModule

//     const data = await pdfParse(dataBuffer)
//     return data.text
// }

export async function readPDF(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true)

        pdfParser.on('pdfParser_dataReady', (pdfData: { Pages: Array<{ Texts: Array<{ R: Array<{ T: string }> }> }> }) => {
            try {
                let fullText = ''

                for (const page of pdfData.Pages) {
                    for (const textItem of page.Texts) {
                        const decodedText = decodeURIComponent(textItem.R.map((r: { T: string }) => r.T).join(''))
                        fullText += decodedText + ' '
                    }
                    fullText += '\n'
                }

                resolve(fullText.trim())
            } catch (error) {
                reject(error)
            }
        })

        pdfParser.on('pdfParser_dataError', (errMsg: Error | { parserError: Error }) => {
            // 统一转为 Error 类型
            const error = errMsg instanceof Error ? errMsg : errMsg.parserError
            reject(error)
        })

        pdfParser.loadPDF(filePath)
    })
}

export async function splitText(text: string): Promise<string[]> {
    const chunks: string[] = []
    const maxChunkSize = 512
    const maxChunks = 100 // 最多处理 100 块，防止内存爆炸

    let startIndex = 0
    let chunkCount = 0

    while (startIndex < text.length && chunkCount < maxChunks) {
        // 从当前位置往后找 512 个字符
        let endIndex = startIndex + maxChunkSize

        // 如果还没到末尾，尝试在句号处断开
        if (endIndex < text.length) {
            // 从 endIndex 往前找最近的句号
            const lastPeriod = text.lastIndexOf('。', endIndex)
            const lastNewline = text.lastIndexOf('\n', endIndex)
            const breakPoint = Math.max(lastPeriod, lastNewline)

            if (breakPoint > startIndex) {
                endIndex = breakPoint + 1
            }
        } else {
            endIndex = text.length
        }

        const chunk = text.slice(startIndex, endIndex).trim()
        if (chunk) {
            chunks.push(chunk)
            chunkCount++
        }

        startIndex = endIndex
    }

    console.log(`✂️ 切分成 ${chunks.length} 块`)
    return chunks
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
    const allEmbeddings: number[][] = []
    const batchSize = 20

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize)
        console.log(`🔄 向量化第 ${i + 1}-${Math.min(i + batchSize, texts.length)} 段...`)

        // Ollama 的 /api/embeddings 一次只能处理一段文本
        // 所以我们逐段处理
        for (const text of batch) {
            const response = await fetch('http://localhost:11434/api/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: text  // 注意：Ollama 用 prompt 而不是 input
                })
            })

            if (!response.ok) {
                const err = await response.text()
                throw new Error(`Ollama Embedding 失败 (${response.status}): ${err}`)
            }

            const json = await response.json() as Record<string, unknown>

            // 打印返回结构，确认字段名
            console.log('Ollama 返回:', JSON.stringify(json).slice(0, 200))

            // Ollama 返回格式: { embedding: [0.001, 0.002, ...] }
            const embedding = json.embedding as number[] | undefined

            if (!embedding || !Array.isArray(embedding)) {
                throw new Error(`Ollama 返回格式异常: ${JSON.stringify(json)}`)
            }

            allEmbeddings.push(embedding)
        }

        await new Promise(r => setTimeout(r, 50))
    }

    return allEmbeddings
}

// export async function embedTexts(texts: string[]): Promise<number[][]> {
//     const API_KEY = process.env.DEEPSEEK_API_KEY

//     if (!API_KEY) {
//         throw new Error('DEEPSEEK_API_KEY 环境变量未设置')
//     }

//     const allEmbeddings: number[][] = []
//     const batchSize = 20

//     for (let i = 0; i < texts.length; i += batchSize) {
//         const batch = texts.slice(i, i + batchSize)

//         console.log(`🔄 正在向量化第 ${i + 1}-${Math.min(i + batchSize, texts.length)} 段...`)
//         // console.log(batch);

//         const response = await fetch('https://api.deepseek.com/v1/embeddings', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${API_KEY}`
//             },
//             body: JSON.stringify({
//                 model: 'deepseek-embedding',
//                 input: batch
//             })
//         })

//         if (!response.ok) {
//             const errorText = await response.text()
//             console.error(`❌ Embedding API 返回 ${response.status}: ${errorText}`)
//             console.log('status:', response.status)
//             console.log('body:', errorText)
//             throw new Error(`Embedding API 请求失败 (${response.status}): ${errorText}`)
//         }

//         interface EmbeddingResponse {
//             data: Array<{
//                 embedding: number[]
//                 index: number
//             }>
//         }

//         const json = (await response.json()) as EmbeddingResponse
//         allEmbeddings.push(...json.data.map(item => item.embedding))

//         await new Promise(resolve => setTimeout(resolve, 200))
//     }

//     return allEmbeddings
// }

import type { PoolClient } from 'pg'

export async function storeEmbeddings(
    client: PoolClient,
    chunks: string[],
    embeddings: number[][],
    source: string
): Promise<void> {
    // 清理文本中的非法字符
    function cleanText(text: string): string {
        let result = ''
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i)
            // 只保留：常用 ASCII、中文、常见标点
            if (
                (code >= 0x20 && code <= 0x7E) ||    // ASCII 可见字符
                (code >= 0x4E00 && code <= 0x9FFF) || // 中文
                (code >= 0x3000 && code <= 0x303F) || // 中文标点
                (code >= 0xFF00 && code <= 0xFFEF) || // 全角字符
                code === 0x0A || code === 0x0D        // 换行符
            ) {
                result += text[i]
            }
        }
        return result.replace(/\s+/g, ' ').trim()
    }

    const valueRows: string[] = []

    for (let i = 0; i < chunks.length; i++) {
        // 清理内容
        const cleanedContent = cleanText(chunks[i])
        if (!cleanedContent) continue // 跳过空内容

        // 转义单引号
        const escapedContent = cleanedContent.replace(/'/g, "''")

        // 格式化向量
        const vectorStr = embeddings[i]
            .map(v => v.toFixed(8))
            .join(',')

        const escapedSource = source.replace(/'/g, "''")

        valueRows.push(
            `('${escapedContent}', '[${vectorStr}]'::vector, '${escapedSource}', ${i + 1})`
        )
    }

    if (valueRows.length === 0) {
        throw new Error('所有切片内容均为空，无法入库')
    }

    const sql = `INSERT INTO documents (content, embedding, source, page) VALUES ${valueRows.join(',\n')}`

    try {
        await client.query(sql)
        console.log(`✅ 已存入 ${valueRows.length} 条文档片段`)
    } catch (error) {
        console.error('❌ 入库失败')
        throw error
    }
}