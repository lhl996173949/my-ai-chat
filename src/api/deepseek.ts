const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export async function chatWithDeepSeek(messages: { role: string; content: string }[]) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            messages: messages,
            model: 'deepseek-chat',
            stream: true    //开启流式输出，实现打字机效果
        })
    });

    if (!response.ok) { throw new Error(`API 请求失败：${response.status}s`) }

    return response.body?.getReader();
};