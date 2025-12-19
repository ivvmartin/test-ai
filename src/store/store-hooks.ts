import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// APP STORE (for global app state)
// ============================================================================

interface AppState {
  aiAvailable: boolean;
  quotaLimit: number;
  quotaUsed: number;
  setAiAvailable: (available: boolean) => void;
  setQuota: (used: number, limit: number) => void;
  incrementQuotaUsed: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  aiAvailable: true,
  quotaLimit: 100,
  quotaUsed: 45,
  setAiAvailable: (available) => set({ aiAvailable: available }),
  setQuota: (used, limit) => set({ quotaUsed: used, quotaLimit: limit }),
  incrementQuotaUsed: () =>
    set((state) => ({
      quotaUsed: Math.min(state.quotaUsed + 1, state.quotaLimit),
    })),
}));

// ============================================================================
// CONVERSATIONS STORE (DEPRECATED - Use React Query hooks instead)
// ============================================================================
// NOTE: This store is now deprecated in favor of backend persistence.
// Use the following hooks from @/utils/chat-queries and @/utils/chat-mutations:
// - useConversationsQuery() - fetch conversations from backend
// - useMessagesQuery(conversationId) - fetch messages from backend
// - useCreateConversationMutation() - create new conversation
// - useAddMessageMutation() - add message to conversation
//
// This store is kept for backward compatibility and as a reference.
// ============================================================================

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  messages: Message[];
}

interface ConversationsState {
  conversations: Conversation[];
  createConversation: (title?: string) => Conversation;
  deleteConversation: (id: string) => void;
  addMessage: (
    conversationId: string,
    message: Omit<Message, "id" | "createdAt">
  ) => void;
  getConversation: (id: string) => Conversation | undefined;
  updateConversationTitle: (id: string, title: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const MAX_CONVERSATIONS = 10;

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const keepLastN = (
  conversations: Conversation[],
  n: number
): Conversation[] => {
  if (conversations.length <= n) return conversations;
  return conversations
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, n);
};

// Seed data - only 2 example conversations
const seedConversations: Conversation[] = [
  {
    id: "seed-conv-1",
    title: "Getting Started with AI",
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "What are the best practices for prompt engineering?",
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "Here are key best practices for prompt engineering:\n\n1. Be specific and clear\n2. Provide context\n3. Use examples when possible\n4. Iterate and refine",
        createdAt: new Date(Date.now() - 1000 * 60 * 29),
      },
    ],
  },
  {
    id: "seed-conv-2",
    title: "Project Planning",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    messages: [
      {
        id: "msg-3",
        role: "user",
        content: "Help me plan a web application architecture",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ],
  },
];

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useConversationsStore = create<ConversationsState>()(
  persist(
    (set, get) => ({
      conversations: seedConversations,

      createConversation: (title = "New Conversation") => {
        const newConversation: Conversation = {
          id: generateId(),
          title,
          updatedAt: new Date(),
          messages: [],
        };

        set((state) => ({
          conversations: keepLastN(
            [newConversation, ...state.conversations],
            MAX_CONVERSATIONS
          ),
        }));

        return newConversation;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        }));
      },

      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          ...message,
          id: generateId(),
          createdAt: new Date(),
        };

        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [...conv.messages, newMessage],
                updatedAt: new Date(),
              };
            }
            return conv;
          });

          return { conversations: keepLastN(conversations, MAX_CONVERSATIONS) };
        });
      },

      getConversation: (id) => {
        return get().conversations.find((c) => c.id === id);
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
          ),
        }));
      },
    }),
    {
      name: "evta-conversations-storage",
    }
  )
);
