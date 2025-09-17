import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiBell, FiSearch, FiMenu } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

const Header = () => {
  const { isDark, toggleTheme, sidebarCollapsed, toggleSidebar } = useTheme();
  const { user } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden p-2"
          >
            <FiMenu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="hidden sm:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search webhooks..."
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDark ? 360 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? (
                <FiSun className="w-5 h-5 text-yellow-500" />
              ) : (
                <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </motion.div>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <FiBell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </Button>
          </div>

          {/* User avatar */}
          {user && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer"
            >
              <span className="text-sm font-medium text-white">
                {user.first_name?.[0] || user.email[0].toUpperCase()}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
