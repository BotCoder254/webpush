import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiGlobe, 
  FiActivity, 
  FiUser, 
  FiLogOut,
  FiChevronLeft,
  FiZap,
  FiBarChart2,
  FiShield,
  FiList
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: FiHome,
      description: 'Overview and stats'
    },
    {
      name: 'Webhooks',
      href: '/webhooks',
      icon: FiGlobe,
      description: 'Manage endpoints'
    },
    {
      name: 'Activity',
      href: '/activity',
      icon: FiActivity,
      description: 'Recent events'
    },
    {
      name: 'Event Logs',
      href: '/events',
      icon: FiList,
      description: 'Webhook event logs'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: FiBarChart2,
      description: 'Performance metrics'
    },
    {
      name: 'Security',
      href: '/security',
      icon: FiShield,
      description: 'Security settings'
    },
  ];

  const bottomItems = [
  
    {
      name: 'Profile',
      href: '/profile',
      icon: FiUser,
      description: 'Account settings'
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const sidebarVariants = {
    expanded: {
      width: '280px',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    collapsed: {
      width: '80px',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  const itemVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        delay: 0.1
      }
    },
    collapsed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      variants={sidebarVariants}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full relative"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    WebHook
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2"
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronLeft className="w-4 h-4" />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon 
              className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} 
            />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="ml-3 flex-1"
                >
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {item.description}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4 space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon 
              className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} 
            />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="ml-3 flex-1"
                >
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {item.description}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* User Profile & Logout */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && user && (
            <motion.div
              variants={itemVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="px-3 py-2 mb-2"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.first_name?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.first_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <FiLogOut className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="ml-3"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
