# 🚀 AI 知识库问答系统 (RAG)

一个基于 React + TypeScript + Vite + Node.js + pgvector 的智能问答应用，支持上传 PDF、自动切片、向量化检索、结合大模型生成答案。

## 🛠 技术栈

- **前端**：React 18 + TypeScript + Vite + Zustand + Markdown 渲染
- **后端**：Node.js + Express + PostgreSQL (pgvector)
- **AI 服务**：DeepSeek / OpenAI API + RAG 全链路
- **部署**：Vercel (前端) + Docker (后端可选)

## 📦 安装与运行

bash
前端
cd frontend
npm install
npm run dev
后端
cd backend
npm install
npm run start

## 🧩 项目结构

/frontend
├── src/
│ ├── api/
│ ├── components/
│ ├── pages/
│ └── stores/
/backend
├── routes/
├── services/
└── vector/

## ⚙️ 配置说明

- **环境变量**：复制 `.env.example` 为 `.env`，填写 `DEEPSEEK_API_KEY`、`DB_URL` 等。
- **数据库**：需提前创建 PostgreSQL 数据库并启用 `pgvector` 扩展。
- **Vite 插件**：默认使用 `@vitejs/plugin-react`（Oxc），如需 SWC 可切换。

## 🚀 部署

- 前端：直接推送到 Vercel，设置环境变量。
- 后端：可部署到 Railway / Render / Docker。

## 📌 注意事项

- PDF 上传目前支持本地测试，线上部署需配合对象存储（如 Vercel Blob / S3）。
- RAG 检索精度可通过调整切片大小、重叠长度、相似度阈值优化。

## 📚 学习参考

- [Vite React 模板](https://github.com/vitejs/vite-react)
- [pgvector 文档](https://github.com/pgvector/pgvector)
- [React Compiler 安装指南](https://react.dev/learn/react-compiler/installation)

# React + TypeScript + Vite

本项目使用 @vitejs/plugin-react（基于 Oxc）作为默认 React 插件，如需更高性能可切换至 @vitejs/plugin-react-swc。

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

⚠️ 本模板默认未启用 React Compiler，如需开启请参考官方文档。
The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
