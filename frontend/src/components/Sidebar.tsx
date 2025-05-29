import { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Conversation } from '../lib/api';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Sidebar: FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onNewConversation,
  isOpen,
  onClose,
  theme,
  onToggleTheme
}) => {
  const navigate = useNavigate();
  
  // Função para formatar título da conversa
  const formatTitle = (title: string) => {
    return title.length > 25 ? title.substring(0, 25) + '...' : title;
  };
  
  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  return (
    <>
      {/* Overlay para dispositivos móveis */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || window.innerWidth >= 768) && (
          <motion.aside
            className={`fixed md:relative top-0 left-0 z-30 h-full w-64 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col ${isOpen ? 'block' : 'hidden md:block'}`}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">LeilãoGPT</h2>
              <button 
                onClick={onClose}
                className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700"
                aria-label="Fechar menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Nova Conversa */}
            <div className="p-4">
              <button
                onClick={onNewConversation}
                className="w-full flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                aria-label="Nova conversa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nova Conversa
              </button>
            </div>
            
            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                  Nenhuma conversa encontrada
                </div>
              ) : (
                <ul className="space-y-1">
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <Link
                        to={`/chat/${conversation.id}`}
                        className={`block p-2 rounded-lg transition-colors ${
                          currentConversationId === conversation.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="font-medium">{formatTitle(conversation.title)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(conversation.updated_at)}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={onToggleTheme}
                className="w-full flex items-center justify-center p-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                aria-label={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
              >
                {theme === 'light' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                    Tema Escuro
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                    Tema Claro
                  </>
                )}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
