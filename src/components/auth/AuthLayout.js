import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

const AuthLayout = ({ children, title = "WebHook Platform" }) => {
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    // Subtle floating animation for the image
    gsap.to(".auth-image", {
      y: -10,
      duration: 4,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    });
  }, []);



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
        {/* Background Image */}
        <motion.img
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Webhook Platform"
          className="auth-image w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        
        {/* Subtle overlay for better contrast */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <FiSun className="w-5 h-5 text-yellow-500" />
          ) : (
            <FiMoon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-10"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
