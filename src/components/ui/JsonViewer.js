import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronRight, FiCopy } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

const JsonViewer = ({ 
  data, 
  collapsed = false, 
  name = null, 
  level = 0,
  copyable = true 
}) => {
  const { isDarkMode } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Handle undefined or null data
  if (data === undefined) {
    data = { message: 'No data available (undefined)' };
  } else if (data === null) {
    data = { message: 'No data available (null)' };
  }

  const handleCopy = (value) => {
    const textToCopy = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard');
  };

  const getValueType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValueColor = (type) => {
    const colors = {
      string: isDarkMode ? '#a7f3d0' : '#059669',
      number: isDarkMode ? '#93c5fd' : '#2563eb',
      boolean: isDarkMode ? '#fbbf24' : '#d97706',
      null: isDarkMode ? '#9ca3af' : '#6b7280',
      undefined: isDarkMode ? '#9ca3af' : '#6b7280'
    };
    return colors[type] || (isDarkMode ? '#e5e7eb' : '#374151');
  };

  const renderValue = (value, key = null, currentLevel = 0) => {
    const type = getValueType(value);
    const indent = currentLevel * 20;

    if (type === 'object' && value !== null) {
      const keys = Object.keys(value);
      const hasChildren = keys.length > 0;

      return (
        <div style={{ marginLeft: `${indent}px` }} className="my-1">
          {key && (
            <div className="flex items-center space-x-2 py-1">
              {hasChildren && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {isCollapsed ? 
                    <FiChevronRight className="w-4 h-4" /> : 
                    <FiChevronDown className="w-4 h-4" />
                  }
                </button>
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {key}:
              </span>
              {copyable && (
                <button
                  onClick={() => handleCopy(value)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiCopy className="w-3 h-3" />
                </button>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {`{${keys.length}}`}
              </span>
            </div>
          )}
          
          <AnimatePresence>
            {!isCollapsed && hasChildren && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-l border-gray-200 dark:border-gray-700 ml-2 pl-4"
              >
                {keys.map((objKey) => (
                  <div key={objKey}>
                    {renderValue(value[objKey], objKey, currentLevel + 1)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (type === 'array') {
      const hasItems = value.length > 0;

      return (
        <div style={{ marginLeft: `${indent}px` }} className="my-1">
          {key && (
            <div className="flex items-center space-x-2 py-1">
              {hasItems && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {isCollapsed ? 
                    <FiChevronRight className="w-4 h-4" /> : 
                    <FiChevronDown className="w-4 h-4" />
                  }
                </button>
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {key}:
              </span>
              {copyable && (
                <button
                  onClick={() => handleCopy(value)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiCopy className="w-3 h-3" />
                </button>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {`[${value.length}]`}
              </span>
            </div>
          )}
          
          <AnimatePresence>
            {!isCollapsed && hasItems && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-l border-gray-200 dark:border-gray-700 ml-2 pl-4"
              >
                {value.map((item, index) => (
                  <div key={index}>
                    {renderValue(item, `[${index}]`, currentLevel + 1)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Primitive values
    return (
      <div style={{ marginLeft: `${indent}px` }} className="flex items-center space-x-2 py-1">
        {key && (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {key}:
          </span>
        )}
        <span 
          className="text-sm font-mono"
          style={{ color: getValueColor(type) }}
        >
          {type === 'string' ? `"${value}"` : String(value)}
        </span>
        {copyable && (
          <button
            onClick={() => handleCopy(value)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiCopy className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="font-mono text-sm">
      {name ? (
        <div className="mb-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {name}
          </span>
        </div>
      ) : null}
      {renderValue(data, null, level)}
    </div>
  );
};

export default JsonViewer;
