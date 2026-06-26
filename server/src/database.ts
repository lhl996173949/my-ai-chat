import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'rag_db',
    user: 'admin',
    password: 'admin123'
})

// 初始化向量表和索引
export async function initDB() {
    const client = await pool.connect()

    try {
        // 启用 pgvector 扩展
        await client.query('CREATE EXTENSION IF NOT EXISTS vector')

        // 创建文档表（如果不存在）
        await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1024),
        source TEXT,
        page INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

        // 创建 IVFFlat 索引加速检索
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_embedding 
      ON documents 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `)

        console.log('✅ 数据库表初始化完成')
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error)
        throw error
    } finally {
        client.release()
    }
}

export default pool