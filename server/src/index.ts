import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
// import path from 'path';
import fs from 'fs'
import { readPDF, splitText, embedTexts, storeEmbeddings } from './documentProcessor'
import pool, { initDB } from './database'

const app = express();
const port = 3001;

//中间件
app.use(cors());
app.use(express.json());

//文件上传配置
const upload = multer({ dest: 'uploads/' });

//初始化数据库
initDB().catch(console.error);

//健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: `🚀 后端服务已启动: http://localhost:${port}` });
});

//文件上传接口
// app.post('/api/upload', upload.single('file'), (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: '请上传文件' });
//     }

//     res.json({
//         message: '文件上传成功',
//         filename: req.file.filename,
//         originalname: req.file.originalname,
//         size: req.file.size,
//     });
// });

//上传pdf并处理
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
    }

    try {
        console.log(`📄 开始处理文件: ${req.file.originalname}`);

        // 1. 读取 PDF
        const text = await readPDF(req.file.path)
        console.log(`📖 提取文本长度: ${text.length} 字符`)

        // 2. 切片
        const chunks = await splitText(text)
        console.log(`✂️ 切分成 ${chunks.length} 块`)

        // 3. 向量化
        console.log('🔄 正在向量化...')
        const embeddings = await embedTexts(chunks)
        console.log(`🔢 向量维度: ${embeddings[0]?.length ?? 0}`)

        // 4. 入库
        const client = await pool.connect()
        try {
            await storeEmbeddings(client, chunks, embeddings, req.file.originalname)
        } finally {
            client.release()
        }

        // 清理临时文件
        fs.unlinkSync(req.file.path)

        res.json({
            success: true,
            message: '文档处理完成',
            chunksCount: chunks.length,
            fileName: req.file.originalname
        })
    } catch (error) {
        console.error('❌ 文档处理出错:', error)
        res.status(500).json({
            error: '文档处理失败',
            detail: error instanceof Error ? error.message : '未知错误'
        })
    }
})

// 检索相似文档
app.post('/api/search', async (req, res) => {
    const { query, limit = 5 } = req.body as { query?: string; limit?: number }

    if (!query) {
        return res.status(400).json({ error: '请输入查询内容' })
    }

    try {
        // 将查询向量化
        const [queryEmbedding] = await embedTexts([query])

        // 格式化为 pgvector 可接受的字符串格式
        const vectorStr = '[' + queryEmbedding.join(',') + ']'

        // 在数据库中检索最相似的文档
        const client = await pool.connect()
        try {
            const result = await client.query<SearchResult>(
                `SELECT content, source, page, 
         1 - (embedding <=> $1::vector) AS similarity
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
                [vectorStr, limit]  // 传入字符串格式
            )

            res.json({
                success: true,
                results: result.rows.map(row => ({
                    content: row.content,
                    source: row.source,
                    page: row.page,
                    similarity: Math.round(row.similarity * 10000) / 10000
                }))
            })
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('❌ 检索出错:', error)
        res.status(500).json({
            error: '检索失败',
            detail: error instanceof Error ? error.message : '未知错误'
        })
    }
})

app.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`);
});

interface SearchResult {
    content: string
    source: string
    page: number
    similarity: number
}