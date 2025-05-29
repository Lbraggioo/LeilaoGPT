import { FC } from 'react';
import { motion } from 'framer-motion';
import { Message } from '../lib/api';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className={`max-w-3xl rounded-lg p-4 ${
          isUser 
            ? 'bg-blue-600 text-white ml-12' 
            : 'bg-gray-100 dark:bg-slate-800 mr-12'
        }`}
      >
        <div className="flex items-start">
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3 flex-shrink-0">
              AI
            </div>
          )}
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
