import React from 'react';
import { motion } from 'framer-motion';
import { Message } from '../lib/api';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Animação para efeito de digitação nas mensagens do assistente
  const typingVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.015,
        ease: "easeInOut"
      }
    }
  };
  
  const letterVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  // Renderiza o texto com efeito de digitação para mensagens do assistente
  const renderTypingEffect = (text: string) => {
    return (
      <motion.div
        variants={typingVariants}
        initial="hidden"
        animate="visible"
      >
        {text.split('').map((char, index) => (
          <motion.span key={index} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className={`max-w-3xl rounded-2xl p-4 shadow-sm ${
          isUser 
            ? 'bg-gradient-to-r from-blue-primary to-blue-dark text-white ml-12' 
            : 'bg-gradient-to-r from-gray-50 to-blue-light dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white mr-12'
        }`}
      >
        <div className="flex items-start">
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-primary to-blue-dark flex items-center justify-center text-white mr-3 flex-shrink-0 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className="whitespace-pre-wrap">
            {isUser ? message.content : renderTypingEffect(message.content)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
