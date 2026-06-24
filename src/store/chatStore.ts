import { create } from 'zustand';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    addMessage: (message: Message) => void;
    setLoading: (isLoading: boolean) => void;
    clearMessages: () => void;
}

/**
 * 聊天状态管理
 */
export const useChatStore = create<ChatState>(set => ({
    messages: [],
    isLoading: false,
    addMessage: (message: Message) => set(state => ({
        messages: [...state.messages, message],
    })),
    setLoading: (isLoading: boolean) => set({ isLoading }),
    clearMessages: () => set({ messages: [] }),
}));