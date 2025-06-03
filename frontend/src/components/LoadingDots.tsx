import React from 'react';
import { motion } from 'framer-motion';

const LoadingDots: React.FC = () => {
  const dotVariants = {
    initial: { scale: 0.5, opacity: 0.3 },
    animate: { 
      scale: [0.5, 1, 0.5], 
      opacity: [0.3, 1, 0.3],
      transition: { 
        repeat: Infinity, 
        duration: 1.5, 
        ease: "easeInOut" 
      }
    }
  };

  return (
    <div className="flex items-center space-x-2 py-2">
      <motion.div
        className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-primary to-blue-dark"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0 }}
      />
      <motion.div
        className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-primary to-blue-dark"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      />
      <motion.div
        className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-primary to-blue-dark"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.4 }}
      />
    </div>
  );
};

export default LoadingDots;
