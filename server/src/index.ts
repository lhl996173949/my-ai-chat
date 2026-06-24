import express from 'express';
import cors from 'cors';
import multer from 'multer';
// import path from 'path';

const app = express();
const port = 3001;

//中间件
app.use(cors());
app.use(express.json());

//文件上传配置
const upload = multer({ dest: 'uploads/' });

//健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: `🚀 后端服务已启动: http://localhost:${port}` });
});

//文件上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
    }

    res.json({
        message: '文件上传成功',
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
    });
});

app.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`);
});