import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useTheme } from '../lib/context';
import { chatAPI, Message, Conversation } from '../lib/api';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import LoadingDots from '../components/LoadingDots';

const Chat = () => {
  const { conversationId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Sugestões iniciais
  const suggestions = [
    "Analisa um edital pra mim?",
    "Sou iniciante nos leilões, quais dicas você recomenda?",
    "Como saber se um leilão é seguro?",
    "Quais documentos preciso verificar antes de arrematar?"
  ];

  // Carregar conversas
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatAPI.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      }
    };

    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  // Carregar conversa atual e mensagens
  useEffect(() => {
    const loadCurrentConversation = async () => {
      if (conversationId) {
        try {
          const data = await chatAPI.getConversation(Number(conversationId));
          setCurrentConversation(data);
          setMessages(data.messages);
        } catch (error) {
          console.error('Erro ao carregar conversa:', error);
          navigate('/chat');
        }
      } else {
        setCurrentConversation(null);
        setMessages([]);
      }
    };

    if (isAuthenticated) {
      loadCurrentConversation();
    }
  }, [conversationId, isAuthenticated, navigate]);

  // Rolar para o final das mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Função para criar nova conversa
  const createNewConversation = async () => {
    try {
      const newConversation = await chatAPI.createConversation();
      setConversations([newConversation, ...conversations]);
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  // Função para enviar mensagem
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    let currentConvId = conversationId ? Number(conversationId) : null;
    
    // Se não houver conversa atual, criar uma nova
    if (!currentConvId) {
      try {
        const newConversation = await chatAPI.createConversation();
        currentConvId = newConversation.id;
        setConversations([newConversation, ...conversations]);
        navigate(`/chat/${newConversation.id}`);
      } catch (error) {
        console.error('Erro ao criar conversa:', error);
        return;
      }
    }
    
    // Adicionar mensagem do usuário localmente para feedback imediato
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Enviar mensagem para o backend
      const response = await chatAPI.sendMessage(currentConvId, content);
      
      // Adicionar resposta do assistente
      setMessages(prev => [...prev, response]);
      
      // Atualizar lista de conversas
      const updatedConversations = await chatAPI.getConversations();
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lidar com teclas especiais no input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  // Ajustar altura do textarea conforme conteúdo
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <Sidebar 
        conversations={conversations}
        currentConversationId={conversationId ? Number(conversationId) : null}
        onNewConversation={createNewConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      
      {/* Chat Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">LeilãoGPT</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm hidden md:block">{user?.username}</span>
          </div>
        </header>
        
        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <motion.h2 
                className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                LeilãoGPT
              </motion.h2>
              <motion.p 
                className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Seu assistente completo em leilões do Brasil: Analiso Editais, Respondo consultas jurídicas, tudo com muita técnica e estratégia.
              </motion.p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-left transition-colors"
                    onClick={() => sendMessage(suggestion)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((message, index) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex p-4 rounded-lg bg-blue-50 dark:bg-slate-800 max-w-3xl mx-auto"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3">
                        AI
                      </div>
                      <LoadingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-4">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              className="w-full p-3 pr-12 rounded-lg border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 resize-none"
              placeholder="Digite sua mensagem..."
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <button
              className="absolute right-3 bottom-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Enviar mensagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
