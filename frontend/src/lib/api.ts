import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface para tipagem das conversas
export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

// Interface para tipagem das mensagens
export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Interface para tipagem da conversa com mensagens
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// Funções de API para autenticação
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/register', { username, email, password });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },
  
  resetPassword: async (email: string) => {
    const response = await api.post('/reset-password', { email });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },
};

// Funções de API para conversas
export const chatAPI = {
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data as Conversation[];
  },
  
  getConversation: async (id: number) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data as ConversationWithMessages;
  },
  
  createConversation: async (title: string = 'Nova Conversa') => {
    const response = await api.post('/conversations', { title });
    return response.data as Conversation;
  },
  
  updateConversation: async (id: number, title: string) => {
    const response = await api.patch(`/conversations/${id}`, { title });
    return response.data as Conversation;
  },
  
  deleteConversation: async (id: number) => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },
  
  sendMessage: async (conversationId: number, content: string) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, { content });
    return response.data as Message;
  },
};

export default api;
