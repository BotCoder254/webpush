import React from 'react';
import { motion } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-primary-600 hover:bg-primary-700 text-white
      focus:ring-primary-500 shadow-sm hover:shadow-md
      dark:bg-primary-500 dark:hover:bg-primary-600
    `,
    secondary: `
      bg-secondary-600 hover:bg-secondary-700 text-white
      focus:ring-secondary-500 shadow-sm hover:shadow-md
      dark:bg-secondary-500 dark:hover:bg-secondary-600
    `,
    outline: `
      border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
      hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500
    `,
    ghost: `
      text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
      focus:ring-gray-500
    `,
    danger: `
      bg-red-600 hover:bg-red-700 text-white
      focus:ring-red-500 shadow-sm hover:shadow-md
    `,
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={combinedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <FiLoader className="animate-spin mr-2" size={16} />
      ) : (
        leftIcon && <span className="mr-2">{leftIcon}</span>
      )}
      
      {children}
      
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;
