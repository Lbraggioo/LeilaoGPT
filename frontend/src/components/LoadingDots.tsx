import { FC } from 'react';
import { motion } from 'framer-motion';

const LoadingDots: FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <motion.div
        className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
    </div>
  );
};

export default LoadingDots;
