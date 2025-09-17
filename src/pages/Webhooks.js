import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import Button from '../components/ui/Button';
import WebhookCard from '../components/webhooks/WebhookCard';
import CreateWebhookModal from '../components/webhooks/CreateWebhookModal';
import EditWebhookModal from '../components/webhooks/EditWebhookModal';
import TestWebhookModal from '../components/webhooks/TestWebhookModal';
import webhooksService from '../services/webhooks';
import toast from 'react-hot-toast';

const Webhooks = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await webhooksService.getEndpoints();
      setWebhooks(response.results || []);
    } catch (error) {
      toast.error('Failed to fetch webhooks');
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newWebhook) => {
    if (newWebhook && newWebhook.id) {
      setWebhooks((prevWebhooks) => [newWebhook, ...(prevWebhooks || [])]);
    }
  };

  const handleEdit = (webhook) => {
    setSelectedWebhook(webhook);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedWebhook) => {
    setWebhooks((prevWebhooks) => 
      (prevWebhooks || []).map(w => w.id === updatedWebhook.id ? updatedWebhook : w)
    );
  };

  const handleDelete = async (webhook) => {
    if (!webhook || !webhook.id || !webhook.name) {
      toast.error('Invalid webhook data');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${webhook.name}"?`)) {
      return;
    }

    try {
      await webhooksService.deleteEndpoint(webhook.id);
      setWebhooks((prevWebhooks) => (prevWebhooks || []).filter(w => w && w.id !== webhook.id));
      toast.success('Webhook deleted successfully');
    } catch (error) {
      toast.error('Failed to delete webhook');
      console.error('Error deleting webhook:', error);
    }
  };

  const handleTest = (webhook) => {
    setSelectedWebhook(webhook);
    setShowTestModal(true);
  };

  const filteredWebhooks = (webhooks || []).filter(webhook => {
    if (!webhook || !webhook.id) return false;
    const matchesSearch = (webhook.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (webhook.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || webhook.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Webhook Endpoints
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your webhook endpoints and monitor their activity
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<FiRefreshCw />}
            onClick={fetchWebhooks}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            leftIcon={<FiPlus />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Webhook
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search webhooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <FiFilter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </motion.div>

      {/* Webhooks Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
          />
        </div>
      ) : filteredWebhooks.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredWebhooks.map((webhook) => (
            <motion.div key={webhook.id} variants={itemVariants}>
              <WebhookCard
                webhook={webhook}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTest}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPlus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No webhooks found' : 'No webhook endpoints yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first webhook endpoint to start receiving events'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="primary"
              leftIcon={<FiPlus />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Webhook
            </Button>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <CreateWebhookModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditWebhookModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        webhook={selectedWebhook}
        onSuccess={handleEditSuccess}
      />
      
      <TestWebhookModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        webhook={selectedWebhook}
      />
    </motion.div>
  );
};

export default Webhooks;
