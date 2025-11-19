import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCopy, FiGlobe, FiHome, FiExternalLink, FiInfo } from 'react-icons/fi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const WebhookUrlsModal = ({ isOpen, onClose, webhook }) => {
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
      },
    },
  };

  const overlayVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
    },
  };

  if (!isOpen || !webhook) return null;

  const urls = webhook.webhook_urls || {
    localhost: webhook.webhook_url,
    subdomain: webhook.subdomain_webhook_url,
    ngrok_example: `https://your-ngrok-id.ngrok.io/webhook/${webhook.path_token}/`
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FiGlobe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Webhook URLs
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Multiple URL options for {webhook.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <FiX className="w-5 h-5" />
            </Button>
          </div>

          {/* URL Options */}
          <div className="space-y-4">
            {/* Localhost URL */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <FiHome className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Development URL (Localhost)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    For local development and testing
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
                    {urls.localhost}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(urls.localhost, 'Development URL')}
                  className="p-2"
                >
                  <FiCopy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Subdomain URL */}
            <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center space-x-3 mb-3">
                <FiGlobe className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Production URL (Subdomain)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recommended for external services and production
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-600">
                  <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
                    {urls.subdomain}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(urls.subdomain, 'Production URL')}
                  className="p-2"
                >
                  <FiCopy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Ngrok URL */}
            <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
              <div className="flex items-center space-x-3 mb-3">
                <FiExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Ngrok Tunnel URL (Auth Token Integrated)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ready to use - just start ngrok with the command below
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600">
                  <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
                    {urls.ngrok_url || urls.ngrok_example}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(urls.ngrok_url || urls.ngrok_example, 'Ngrok URL')}
                  className="p-2"
                >
                  <FiCopy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  URL Usage Guidelines
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <strong>Development URL:</strong> Use for local testing and development</li>
                  <li>• <strong>Production URL:</strong> Use for external services that don't accept localhost</li>
                  <li>• <strong>Ngrok URL:</strong> Use for temporary testing with external services</li>
                  <li>• All URLs use the same webhook token and signature verification</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ngrok Setup Instructions */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
              🚀 Quick Ngrok Setup (Auth Token Integrated)
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <div>
                <strong>1. Install Ngrok:</strong> Download from{' '}
                <a href="https://ngrok.com/download" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:text-blue-800 dark:hover:text-blue-200">
                  ngrok.com/download
                </a>
              </div>
              <div>
                <strong>2. Start Tunnel:</strong>
                <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-800 rounded font-mono text-xs break-all">
                  {urls.ngrok_command || `ngrok http 8000 --authtoken=35h4M0GqHII5aiFicj1vNLS4YeJ_73SEq56HR8xFMzdR4RXWT`}
                </div>
              </div>
              <div>
                <strong>3. Use Public URL:</strong> Copy the https URL from ngrok output
              </div>
              <div className="text-xs mt-2 p-2 bg-green-100 dark:bg-green-800 rounded text-green-800 dark:text-green-200">
                ✅ Your auth token is pre-configured - just run the command above
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => window.open('/WEBHOOK_SETUP_GUIDE.md', '_blank')}
              leftIcon={<FiExternalLink />}
            >
              Setup Guide
            </Button>
            <Button
              variant="primary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WebhookUrlsModal;