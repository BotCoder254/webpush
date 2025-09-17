import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';

// Mobile overlay component to fix React hooks issue
const MobileOverlay = () => {
  const { toggleSidebar } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
      onClick={toggleSidebar}
    />
  );
};

const DashboardLayout = () => {
  const { sidebarCollapsed } = useTheme();

  const mainContentVariants = {
    expanded: {
      marginLeft: '280px',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    collapsed: {
      marginLeft: '80px',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Main content area */}
      <motion.div
        variants={mainContentVariants}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && <MobileOverlay />}
    </div>
  );
};

export default DashboardLayout;
