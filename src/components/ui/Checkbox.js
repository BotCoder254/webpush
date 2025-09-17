import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

const Checkbox = ({
  checked = false,
  onChange = () => {},
  label = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        
        <motion.div
          animate={{
            backgroundColor: checked ? '#22c55e' : 'transparent',
            borderColor: checked ? '#22c55e' : '#d1d5db',
          }}
          transition={{ duration: 0.2 }}
          className={`
            w-5 h-5 border-2 rounded flex items-center justify-center
            ${checked ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'}
            focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2
            transition-all duration-200
          `}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </div>
      
      {label && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
