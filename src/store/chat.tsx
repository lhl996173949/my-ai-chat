import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "./chatStore";
import { chatWithDeepSeek } from "../api/deepseek";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Chat() {
  const { messages, isLoading, addMessage, setLoading, clearMessages } =
    useChatStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    addMessage({ role: "user", content: userMsg });
    setLoading(true);

    try {
      const reader = await chatWithDeepSeek([
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg },
      ]);

      let assistantContent = "";
      addMessage({ role: "assistant", content: "" });

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader!.read(); //?
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              //更新最后一条消息（打字机效果）
              const msgs = useChatStore.getState().messages;
              msgs[msgs.length - 1].content = assistantContent;
              useChatStore.setState({ messages: [...msgs] });
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error("对话出错", error);
      addMessage({
        role: "assistant",
        content: "抱歉，遇到了一些问题，请稍后再试。",
      });
    } finally {
      setLoading(false); // 清除加载状态
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>🤖 AI 聊天室</h1>

      <div
        style={{
          height: "60vh",
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
                background: msg.role === "user" ? "#007bff" : "#e9ecef",
                color: msg.role === "user" ? "white" : "black",
                maxWidth: "80%",
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content || "..."}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ textAlign: "center", color: "#999" }}>正在思考...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

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

export default Chat;
