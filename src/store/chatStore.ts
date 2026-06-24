import { create } from 'zustand';

// ─── 消息类型 ────────────────────────────────────────────────────────────────
/**
 * 单条聊天消息的结构
 *
 * @property role    - 消息发送者：'user' 表示用户，'assistant' 表示 AI 助手
 * @property content - 消息的文本内容
 */
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// ─── Store 状态与操作类型 ─────────────────────────────────────────────────────
/**
 * 聊天 store 的完整类型定义，包含状态字段和操作方法。
 *
 * @property messages    - 当前会话的全部聊天记录数组
 * @property isLoading   - 是否正在等待 AI 响应（用于控制 UI 加载态）
 * @property addMessage  - 向聊天记录追加一条消息
 * @property setLoading  - 切换加载状态
 * @property clearMessages - 清空当前会话的所有聊天记录
 */
interface ChatState {
    messages: Message[];
    isLoading: boolean;
    addMessage: (message: Message) => void;
    setLoading: (isLoading: boolean) => void;
    clearMessages: () => void;
}

// ─── Store 实例 ──────────────────────────────────────────────────────────────
/**
 * 聊天状态管理 —— 基于 Zustand 的轻量级全局状态。
 *
 * 使用方式（React 组件中）：
 *   const { messages, addMessage } = useChatStore();
 *
 * Zustand 的 create 接收一个回调函数，回调参数 set 用于触发状态更新。
 * 整个 store 的初始状态和方法都在这个回调中定义。
 */
export const useChatStore = create<ChatState>(set => ({
    // ── 状态字段 ────────────────────────────────────────────────────────────
    /** 当前会话的所有聊天消息，初始为空数组 */
    messages: [],

    /** 是否正在等待 AI 返回结果，初始为 false */
    isLoading: false,

    // ── 操作方法 ────────────────────────────────────────────────────────────
    /**
     * 向聊天记录中追加一条新消息。
     * 使用函数式更新（state => ...）以确保基于最新的 state 进行扩展，
     * 避免在异步场景下出现竞态问题。
     *
     * @param message - 要添加的消息对象（需包含 role 和 content）
     */
    addMessage: (message: Message) => set(state => ({
        messages: [...state.messages, message],
    })),

    /**
     * 设置加载状态，用于在发送消息后等待 AI 回复期间显示加载指示器。
     *
     * @param isLoading - true 表示正在加载，false 表示加载完成
     */
    setLoading: (isLoading: boolean) => set({ isLoading }),

    /**
     * 清空当前会话的全部聊天记录，回到初始状态。
     * 通常在用户点击「新建对话」或「清空聊天」时调用。
     */
    clearMessages: () => set({ messages: [] }),
}));
