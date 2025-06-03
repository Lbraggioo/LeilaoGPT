import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  icon,
  className = '',
}) => {
  // Base classes
  const baseClasses = 'flex items-center justify-center font-medium transition-all rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-2.5 px-5 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-primary to-blue-dark text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-blue-primary',
    secondary: 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 focus:ring-gray-500',
    outline: 'bg-transparent border border-blue-primary text-blue-primary hover:bg-blue-light focus:ring-blue-primary',
    ghost: 'bg-transparent text-blue-primary hover:bg-blue-light focus:ring-blue-primary',
  };
  
  // Disabled classes
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${widthClasses} ${className}`}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;
