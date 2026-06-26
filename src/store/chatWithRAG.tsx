import { useState, useRef, useEffect } from "react";
import { uploadPDF, askWithRAG } from "../api/rag";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function ChatWithRAG() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`正在上传 ${file.name}...`);
    try {
      const result = await uploadPDF(file);
      setUploadStatus(`✅ 已处理 ${result.chunksCount} 段文档片段`);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `📄 已上传《${result.fileName}》，共 ${result.chunksCount} 段知识片段，可以开始提问了！`,
        },
      ]);
    } catch (error) {
      setUploadStatus("❌ 上传失败");
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const reply = await askWithRAG(userMsg);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "😅 抱歉，回答问题时出现了错误，请稍后再试。",
        },
      ]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>📚 AI 知识库问答</h1>

      {/* 上传区域 */}
      <div
        style={{
          border: "2px dashed #ccc",
          borderRadius: 8,
          padding: 20,
          textAlign: "center",
          marginBottom: 16,
          background: "#fafafa",
        }}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleUpload}
          style={{ display: "none" }}
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          style={{ cursor: "pointer", color: "#007bff" }}
        >
          📤 点击上传 PDF 文档
        </label>
        {uploadStatus && (
          <p style={{ marginTop: 8, color: "#666" }}>{uploadStatus}</p>
        )}
      </div>

      {/* 聊天区域 */}
      <div
        style={{
          height: "50vh",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          background: "#fafafa",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 12,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: 12,
                background:
                  msg.role === "user"
                    ? "#007bff"
                    : msg.role === "system"
                      ? "#fff3cd"
                      : "#e9ecef",
                color: msg.role === "user" ? "white" : "black",
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ textAlign: "center", color: "#999" }}>
            🤔 正在思考...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入你的问题..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            background: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}

export default ChatWithRAG;
