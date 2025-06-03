import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Conversation } from '../lib/api';
import { chatAPI } from '../lib/api';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

const Sidebar: FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onNewConversation,
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  setConversations,
}) => {
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      try {
        await chatAPI.deleteConversation(id);
        const updated = await chatAPI.getConversations();
        setConversations(updated);
        navigate('/chat');
      } catch (error) {
        console.error('Erro ao deletar conversa:', error);
      }
    }
  };

  const handleRename = async (id: number, currentTitle: string) => {
    const newTitle = prompt('Digite o novo título:', currentTitle);
    if (newTitle && newTitle.trim() !== '') {
      try {
        const updated = await chatAPI.updateConversation(id, newTitle);
        const updatedList = conversations.map(conv =>
          conv.id === id ? { ...conv, title: updated.title, updated_at: updated.updated_at } : conv
        );
        setConversations(updatedList);
      } catch (err) {
        console.error("Erro ao renomear conversa:", err);
      }
    }
  };

  const formatTitle = (title: string) => {
    return title.length > 25 ? title.substring(0, 25) + '...' : title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: -280,
      opacity: 0,
      transition: {
        ease: 'easeInOut',
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  const handleNavigate = (id: number) => {
    if (id !== currentConversationId) {
      navigate(`/chat/${id}`);
    }
  };

  return (
    <>
      {isOpen && (
        <motion.div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <AnimatePresence>
        {(isOpen || window.innerWidth >= 768) && (
          <motion.aside
            className="fixed md:relative top-0 left-0 z-30 h-full w-72 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg md:shadow-none"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-primary to-blue-dark flex items-center justify-center text-white shadow-md mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-primary to-blue-dark bg-clip-text text-transparent">LeilãoGPT</h2>
                </div>
              </div>
            </div>

            <div className="p-4">
              <motion.button
                onClick={onNewConversation}
                className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-primary to-blue-dark hover:from-blue-dark hover:to-blue-primary text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nova Conversa
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                  <p>Nenhuma conversa encontrada</p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {conversations.map((conversation, i) => (
                    <motion.li
                      key={conversation.id}
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="relative group"
                    >
                      <div
                        onClick={() => handleNavigate(conversation.id)}
                        className={`cursor-pointer block p-3 rounded-lg transition-all duration-200 ${
                          currentConversationId === conversation.id
                            ? 'bg-blue-light dark:bg-blue-900/30 text-blue-dark dark:text-blue-300 shadow-sm'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="font-medium flex justify-between items-center">
                          {formatTitle(conversation.title)}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleRename(conversation.id, conversation.title); }} className="text-xs px-1">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(conversation.id); }} className="text-xs px-1 text-red-500">🗑</button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(conversation.updated_at)}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                onClick={onToggleTheme}
                className="w-full flex items-center justify-center p-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {theme === 'light' ? '🌙 Tema Escuro' : '☀️ Tema Claro'}
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
