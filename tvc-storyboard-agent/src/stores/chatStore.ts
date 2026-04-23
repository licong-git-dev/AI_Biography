import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage } from '../features/chat/chatService';

interface ChatStore {
  messages: ChatMessage[];
  streaming: boolean;

  append: (msg: ChatMessage) => void;
  updateLast: (patch: Partial<ChatMessage>) => void;
  appendToLast: (text: string) => void;
  clear: () => void;
  setStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      streaming: false,

      append: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

      updateLast: (patch) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = [...state.messages];
          const last = messages[messages.length - 1]!;
          messages[messages.length - 1] = { ...last, ...patch };
          return { messages };
        }),

      appendToLast: (text) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = [...state.messages];
          const last = messages[messages.length - 1]!;
          messages[messages.length - 1] = {
            ...last,
            content: last.content + text,
          };
          return { messages };
        }),

      clear: () => set({ messages: [] }),

      setStreaming: (streaming) => set({ streaming }),
    }),
    {
      name: 'licong-chat',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
