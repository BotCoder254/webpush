import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiGlobe, 
  FiCopy, 
  FiRotateCcw, 
  FiPlay, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiEyeOff,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiExternalLink
} from 'react-icons/fi';
import Button from '../ui/Button';
import WebhookUrlsModal from './WebhookUrlsModal';
import toast from 'react-hot-toast';
import webhooksService from '../../services/webhooks';

const WebhookCard = ({ webhook, onEdit, onDelete, onTest }) => {
  const [showSecret, setShowSecret] = useState(false);
  const [showUrlsModal, setShowUrlsModal] = useState(false);
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  // Early return if webhook is invalid
  if (!webhook || !webhook.id) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-gray-500 dark:text-gray-400">Invalid webhook data</div>
      </div>
    );
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleRotateSecret = async () => {
    if (!window.confirm('Are you sure you want to rotate the secret? This will invalidate the current secret.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await webhooksService.rotateSecret(webhook.id);
      toast.success('Secret rotated successfully!');
      setSecret(result.new_secret);
      setShowSecret(true);
    } catch (error) {
      toast.error(error.message || 'Failed to rotate secret');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSecret = async () => {
    if (showSecret && secret) {
      setShowSecret(false);
      return;
    }

    setLoading(true);
    try {
      const result = await webhooksService.getSecret(webhook.id);
      setSecret(result.secret);
      setShowSecret(true);
    } catch (error) {
      toast.error(error.message || 'Failed to get secret');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'disabled':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return FiCheckCircle;
      case 'paused':
        return FiClock;
      case 'disabled':
        return FiXCircle;
      default:
        return FiActivity;
    }
  };

  const StatusIcon = getStatusIcon(webhook.status || 'unknown');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <FiGlobe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {webhook.name || 'Unnamed Webhook'}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(webhook.status || 'unknown')}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {webhook.status || 'unknown'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created {webhook.created_at ? new Date(webhook.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(webhook)}
            className="p-2"
          >
            <FiEdit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(webhook)}
            className="p-2 text-red-600 hover:text-red-700"
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {webhook.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {webhook.description}
        </p>
      )}

      {/* URL Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Webhook URL
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlsModal(true)}
            className="text-xs p-1"
            leftIcon={<FiExternalLink className="w-3 h-3" />}
          >
            All URLs
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
              {webhook.subdomain_webhook_url || webhook.webhook_url || 'URL not available'}
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(webhook.subdomain_webhook_url || webhook.webhook_url || '', 'URL')}
            className="p-2"
            disabled={!webhook.webhook_url}
          >
            <FiCopy className="w-4 h-4" />
          </Button>
        </div>
        {webhook.subdomain_webhook_url && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✓ Production-ready URL (works with external services)
          </p>
        )}
      </div>

      {/* Secret Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Signing Secret
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <code className="text-sm text-gray-900 dark:text-gray-100">
              {showSecret ? secret : (webhook.masked_secret || 'Secret not available')}
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewSecret}
            loading={loading}
            className="p-2"
          >
            {showSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </Button>
          {showSecret && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(secret, 'Secret')}
              className="p-2"
            >
              <FiCopy className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {webhook.deliveries_count || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Deliveries</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {webhook.events_count || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Events</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {webhook.last_used_at ? new Date(webhook.last_used_at).toLocaleDateString() : 'Never'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Last Used</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTest(webhook)}
            leftIcon={<FiPlay />}
          >
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateSecret}
            loading={loading}
            leftIcon={<FiRotateCcw />}
          >
            Rotate Secret
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = `/webhooks/${webhook.id}`}
        >
          View Details
        </Button>
      </div>

      {/* Webhook URLs Modal */}
      <WebhookUrlsModal
        isOpen={showUrlsModal}
        onClose={() => setShowUrlsModal(false)}
        webhook={webhook}
      />
    </motion.div>
  );
};

export default WebhookCard;
