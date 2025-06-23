/* src/contexts/chat-context.tsx */
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { api } from "@/lib/api";
import { ChatContextType, Conversation, Message } from "@/types";

// Interface para dados de arquivo enviados
interface FileData {
  fileIds: string[];
  originalFiles: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
  }>;
}

/* — util — */
const normalize = (c: Conversation): Conversation => ({
  ...c,
  createdAt: new Date(c.createdAt),
  updatedAt: new Date(c.updatedAt),
  messages: (c.messages ?? []).map((m) => ({
    ...m,
    timestamp:
      typeof m.timestamp === "string" ? new Date(m.timestamp) : m.timestamp,
  })),
});

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const [displayedTypingContent, setDisplayedTypingContent] = useState("");
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);

  /* ---------- bootstrap OTIMIZADO ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { conversations: list } = await api<{
          conversations: Conversation[];
        }>("/chat/conversations");

        // OTIMIZAÇÃO: Apenas normaliza, sem carregar mensagens individuais
        let convs = list.map(normalize);
        setConversations(convs);

        // MUDANÇA PRINCIPAL: Sempre inicia sem conversa selecionada (nova conversa virtual)
        setCurrentConversation(null);
        setIsInitialized(true);
      } catch (error) {
        console.error("Erro ao carregar conversas:", error);
        setIsInitialized(true);
      }
    })();
  }, []);

  /* ---------- efeito de digitação global com setInterval ---------- */
  useEffect(() => {
    if (!typingMessage || !isCurrentlyTyping) return;

    let currentIndex = 0;
    let currentContent = "";
    
    const typingInterval = setInterval(() => {
      if (currentIndex < typingMessage.length) {
        currentContent += typingMessage[currentIndex];
        setDisplayedTypingContent(currentContent);
        currentIndex++;
      } else {
        // Digitação completa
        clearInterval(typingInterval);
        setTimeout(() => {
          onTypingComplete();
        }, 150);
      }
    }, 8); // 8ms entre caracteres

    return () => {
      clearInterval(typingInterval);
    };
  }, [typingMessage, isCurrentlyTyping]); // Só depende do início da digitação

  /* ---------- helpers locais ---------- */
  const normalizeMsg = (m: Message): Message => ({
    ...m,
    timestamp:
      typeof m.timestamp === "string" ? new Date(m.timestamp) : m.timestamp,
  });

  // Função chamada quando a digitação termina
  const onTypingComplete = () => {
    if (!typingMessage || !currentConversation) return;
    
    const assistantMsg: Message = {
      id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: typingMessage,
      role: "assistant",
      timestamp: new Date(),
    };

    // Adiciona a mensagem final à conversa
    setCurrentConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, assistantMsg],
        updatedAt: new Date(),
      };
    });

    setConversations(prev => 
      prev.map(c => 
        c.id === currentConversation.id 
          ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: new Date() }
          : c
      )
    );

    // Limpa o estado de digitação
    setTypingMessage(null);
    setDisplayedTypingContent("");
    setIsCurrentlyTyping(false);
  };

  // Função para iniciar a digitação
  const startTyping = (content: string) => {
    setTypingMessage(content);
    setDisplayedTypingContent("");
    setIsCurrentlyTyping(true);
  };

  const replaceLocal = (tmpId: string, real: Message) => {
    if (!currentConversation) return;
    
    const updatedMessages = currentConversation.messages.map((m) =>
      m.id === tmpId ? real : m
    );
    
    const updatedConv = {
      ...currentConversation,
      messages: updatedMessages,
      updatedAt: new Date(),
    };
    
    // Atualiza a conversa atual
    setCurrentConversation(updatedConv);
    
    // Atualiza na lista de conversas
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversation.id ? updatedConv : c
      )
    );
  };

  /* ---------- CRUD ---------- */
  const createConversation = async () => {
    // Não cria conversa no backend imediatamente, apenas limpa a conversa atual
    // A conversa será criada quando a primeira mensagem for enviada
    setCurrentConversation(null);
  };

  const selectConversation = async (id: number | string) => {
    try {
      // Se já é a conversa atual, não faz nada
      if (currentConversation?.id === id) return;

      const { conversation } = await api<{ conversation: Conversation }>(
        `/chat/conversations/${id}`
      );
      
      const normalizedConv = normalize(conversation);
      setCurrentConversation(normalizedConv);
      
      // Atualiza também a conversa na lista local para manter sincronia
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? normalizedConv : c))
      );
    } catch (error) {
      console.error("Erro ao selecionar conversa:", error);
    }
  };

  const deleteConversation = async (id: number | string) => {
    try {
      await api(`/chat/conversations/${id}`, { method: "DELETE" });
      
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== id);
        
        // Se deletou a conversa atual, seleciona a próxima disponível
        if (currentConversation?.id === id) {
          const nextConv = rest[0] ?? null;
          setCurrentConversation(nextConv);
          
          // Se não há mais conversas, limpa a conversa atual
          if (!nextConv) {
            setCurrentConversation(null);
          }
        }
        
        return rest;
      });
    } catch (error) {
      console.error("Erro ao deletar conversa:", error);
    }
  };

  const renameConversation = async (
    id: number | string,
    title: string
  ) => {
    try {
      await api(`/chat/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      
      // Atualiza na lista
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
      
      // Atualiza a conversa atual se for a mesma
      if (currentConversation?.id === id) {
        setCurrentConversation((prev) => (prev ? { ...prev, title } : prev));
      }
    } catch (error) {
      console.error("Erro ao renomear conversa:", error);
    }
  };

  const clearAllConversations = async () => {
    try {
      await api("/chat/conversations", { method: "DELETE" });
      setConversations([]);
      setCurrentConversation(null);
    } catch (error) {
      console.error("Erro ao limpar conversas:", error);
    }
  };

  /* ---------- enviar mensagem ---------- */
  const sendMessage = async (content: string, fileData?: FileData) => {
    let conversationId: string | number;
    let isNewConversation = false;

    // Se não há conversa atual, cria uma nova
    if (!currentConversation) {
      try {
        const { conversation } = await api<{ conversation: Conversation }>(
          "/chat/conversations",
          { method: "POST", body: JSON.stringify({ title: "Nova Conversa" }) }
        );
        
        const newConv = normalize(conversation);
        conversationId = newConv.id;
        isNewConversation = true;
        
        // Adiciona a nova conversa à lista
        setConversations(prev => [newConv, ...prev]);
        
        // Define como conversa atual
        setCurrentConversation(newConv);
        
      } catch (error) {
        console.error("Erro ao criar nova conversa:", error);
        return;
      }
    } else {
      conversationId = currentConversation.id;
    }

    // 1. Cria mensagem do usuário com metadados dos arquivos preservados
    const userMsg: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      role: "user",
      timestamp: new Date(),
      // Preserva os metadados dos arquivos originais
      files: fileData?.originalFiles?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })) || undefined,
    };

    // 2. Se é nova conversa, a mensagem será a primeira
    if (isNewConversation) {
      setCurrentConversation(prev => 
        prev ? { ...prev, messages: [userMsg], updatedAt: new Date() } : prev
      );
      setConversations(prev => 
        prev.map(c => 
          c.id === conversationId 
            ? { ...c, messages: [userMsg], updatedAt: new Date() }
            : c
        )
      );
    } else {
      // 3. Se é conversa existente, adiciona à lista de mensagens
      const newMessages = [...currentConversation!.messages, userMsg];
      const updatedConversation = {
        ...currentConversation!,
        messages: newMessages,
        updatedAt: new Date(),
      };
      
      setCurrentConversation(updatedConversation);
      setConversations(prev => 
        prev.map(c => 
          c.id === conversationId 
            ? { ...c, messages: newMessages, updatedAt: new Date() }
            : c
        )
      );
    }

    // 4. Inicia indicador de digitando (não a digitação ainda)
    setIsTyping(true);
    setTypingMessage(null);

    try {
      // Prepara o corpo da requisição
      const requestBody: any = { content };

      // Se há arquivos, adiciona os IDs ao corpo da requisição
      if (fileData?.fileIds && fileData.fileIds.length > 0) {
        requestBody.file_ids = fileData.fileIds;
        console.log('Enviando file_ids:', fileData.fileIds); // Debug
      }

      // ADICIONADO: Envia dados dos arquivos originais para o backend
      if (fileData?.originalFiles && fileData.originalFiles.length > 0) {
        requestBody.original_files = fileData.originalFiles.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        }));
        console.log('Enviando original_files:', requestBody.original_files); // Debug
      }

      console.log('Request body completo:', requestBody); // Debug

      const response = await api<{
        user_message: Message | null;
        assistant_message: Message | null;
      }>(
        `/chat/conversations/${conversationId}/messages`,
        { 
          method: "POST", 
          body: JSON.stringify(requestBody)
        }
      );
      
      // 5. Para o indicador e inicia a digitação da resposta
      setIsTyping(false);
      
      if (response.assistant_message) {
        const assistantContent = response.assistant_message.content;
        startTyping(assistantContent);
      }
      
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      setIsTyping(false);
      
      // Em caso de erro, adiciona mensagem de erro diretamente
      const errorMsg: Message = {
        id: `error_${Date.now()}`,
        content: "⚠️ Erro ao enviar mensagem. Tente novamente.",
        role: "assistant",
        timestamp: new Date(),
      };
      
      setCurrentConversation(prev => {
        if (!prev || prev.id !== conversationId) return prev;
        return {
          ...prev,
          messages: [...prev.messages, errorMsg],
          updatedAt: new Date(),
        };
      });
    }
  };

  /* ---------- context ---------- */
  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        createConversation,
        selectConversation,
        deleteConversation,
        renameConversation,
        clearAllConversations,
        sendMessage,
        isTyping,
        isInitialized,
        typingMessage,
        displayedTypingContent,
        isCurrentlyTyping,
        onTypingComplete,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}