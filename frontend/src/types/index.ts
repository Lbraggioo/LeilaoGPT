// Interface para dados de arquivo enviados (chat-input)
export interface FileData {
  fileIds: string[];
  originalFiles: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
  }>;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  files?: {
    name: string;
    size: number;
    type: string;
  }[];
}

export interface Conversation {
  id: string | number;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  email: string;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createConversation: () => Promise<void>;
  selectConversation: (id: string | number) => Promise<void>;
  deleteConversation: (id: string | number) => Promise<void>;
  renameConversation: (id: string | number, title: string) => Promise<void>;
  sendMessage: (content: string, fileData?: FileData) => Promise<void>; // ← Mudança principal
  clearAllConversations: () => Promise<void>;
  isTyping: boolean;
  isInitialized: boolean;
  typingMessage: string | null;
  displayedTypingContent: string;
  isCurrentlyTyping: boolean;
  onTypingComplete: () => void;
}

export type ChatAvatarType = 'user' | 'bot' | 'thinking';