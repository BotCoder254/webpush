import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  error = '',
  icon: Icon = null,
  rightIcon = null,
  className = '',
  ...props
}, ref) => {
  const hasError = Boolean(error);

  return (
    <div className="w-full">
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`
            block w-full rounded-lg border
            ${Icon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            py-3 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-all duration-200
            ${hasError
              ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-primary-500'
            }
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      
      {hasError && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
