import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { 
  FiArrowLeft, 
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
  FiSettings,
  FiBarChart,
  FiList,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiCode
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import JsonViewer from '../components/ui/JsonViewer';
import EditWebhookModal from '../components/webhooks/EditWebhookModal';
import toast from 'react-hot-toast';
import webhooksService from '../services/webhooks';

const WebhookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [webhook, setWebhook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState('');
  const [secretLoading, setSecretLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWebhookDetails();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'events' && webhook) {
      fetchEvents();
    } else if (activeTab === 'deliveries' && webhook) {
      fetchDeliveries();
    } else if (activeTab === 'analytics' && webhook) {
      fetchAnalytics();
    }
  }, [activeTab, webhook]);

  const fetchWebhookDetails = async () => {
    setLoading(true);
    try {
      const data = await webhooksService.getEndpoint(id);
      setWebhook(data);
    } catch (error) {
      toast.error('Failed to fetch webhook details');
      console.error('Error fetching webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await webhooksService.getEvents(id);
      setEvents(data.results || data || []);
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    setEventsLoading(true);
    try {
      const data = await webhooksService.getDeliveries(id);
      setDeliveries(data.results || data || []);
    } catch (error) {
      toast.error('Failed to fetch deliveries');
      console.error('Error fetching deliveries:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchAnalytics = async (days = 7) => {
    setAnalyticsLoading(true);
    try {
      const data = await webhooksService.getWebhookAnalytics(id, { days });
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleEditSuccess = (updatedWebhook) => {
    setWebhook(updatedWebhook);
    toast.success('Webhook updated successfully!');
  };

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

    setSecretLoading(true);
    try {
      const result = await webhooksService.rotateSecret(webhook.id);
      toast.success('Secret rotated successfully!');
      setSecret(result.new_secret);
      setShowSecret(true);
      // Refresh webhook details to get updated masked secret
      fetchWebhookDetails();
    } catch (error) {
      toast.error(error.message || 'Failed to rotate secret');
    } finally {
      setSecretLoading(false);
    }
  };

  const handleViewSecret = async () => {
    if (showSecret && secret) {
      setShowSecret(false);
      return;
    }

    setSecretLoading(true);
    try {
      const result = await webhooksService.getSecret(webhook.id);
      setSecret(result.secret);
      setShowSecret(true);
    } catch (error) {
      toast.error(error.message || 'Failed to get secret');
    } finally {
      setSecretLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${webhook?.name}"?`)) {
      return;
    }

    try {
      await webhooksService.deleteEndpoint(webhook.id);
      toast.success('Webhook deleted successfully');
      navigate('/webhooks');
    } catch (error) {
      toast.error('Failed to delete webhook');
      console.error('Error deleting webhook:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading webhook details...</p>
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FiXCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Webhook not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The webhook you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate('/webhooks')}>
            Back to Webhooks
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(webhook.status || 'unknown');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiGlobe },
    { id: 'events', label: 'Recent Events', icon: FiList },
    { id: 'deliveries', label: 'Deliveries', icon: FiActivity },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/webhooks')}
            leftIcon={<FiArrowLeft />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {webhook.name || 'Unnamed Webhook'}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(webhook.status || 'unknown')}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {webhook.status || 'unknown'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                <FiCalendar className="w-4 h-4 inline mr-1" />
                Created {webhook.created_at ? new Date(webhook.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FiPlay />}
          >
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            leftIcon={<FiEdit />}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
            leftIcon={<FiTrash2 />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{webhook.name || 'Unnamed Webhook'}</p>
                </div>

                {webhook.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{webhook.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(webhook.status || 'unknown')}`}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {webhook.status || 'unknown'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Webhook ID
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {webhook.id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(webhook.id, 'Webhook ID')}
                      className="p-1"
                    >
                      <FiCopy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* URL & Secret Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration
              </h3>

              <div className="space-y-4">
                {/* Webhook URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
                        {webhook.webhook_url || 'URL not available'}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhook.webhook_url || '', 'URL')}
                      className="p-2"
                      disabled={!webhook.webhook_url}
                    >
                      <FiCopy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Signing Secret */}
                <div>
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
                      loading={secretLoading}
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
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotateSecret}
                      loading={secretLoading}
                      leftIcon={<FiRotateCcw />}
                    >
                      Rotate Secret
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Statistics
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {webhook.deliveries_count || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Deliveries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {webhook.events_count || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {webhook.successful_deliveries || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                      {webhook.failed_deliveries || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Last Used:</span>
                    <span className="text-gray-900 dark:text-white">
                      {webhook.last_used_at ? new Date(webhook.last_used_at).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Events
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvents}
                  loading={eventsLoading}
                  leftIcon={<FiRefreshCw />}
                >
                  Refresh
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              {eventsLoading ? (
                <div className="text-center py-8">
                  <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading events...</p>
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  {events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {event.event_type || 'Unknown Event'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {event.created_at ? new Date(event.created_at).toLocaleString() : 'Unknown time'}
                        </span>
                      </div>
                      {event.data && (
                        <div className="mt-2">
                          <JsonViewer data={event.data} collapsed={true} />
                        </div>
                      )}
                    </div>
                  ))}
                  {events.length > 10 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/events?endpoint=${webhook.id}`)}
                      >
                        View All Events
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No events yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Events will appear here when webhooks are received.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delivery Attempts
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDeliveries}
                  loading={eventsLoading}
                  leftIcon={<FiRefreshCw />}
                >
                  Refresh
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              {eventsLoading ? (
                <div className="text-center py-8">
                  <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading deliveries...</p>
                </div>
              ) : deliveries.length > 0 ? (
                <div className="space-y-4">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            delivery.status === 'success' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : delivery.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {delivery.status === 'success' ? <FiCheckCircle className="w-3 h-3 mr-1" /> : 
                             delivery.status === 'failed' ? <FiXCircle className="w-3 h-3 mr-1" /> : 
                             <FiClock className="w-3 h-3 mr-1" />}
                            {delivery.status}
                          </span>
                          {delivery.response_status_code && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              HTTP {delivery.response_status_code}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : 
                           delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'Unknown time'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-4">
                          <span>
                            Attempts: {delivery.delivery_attempts || 1}
                          </span>
                          {delivery.delivered_at && (
                            <span>
                              Delivered: {new Date(delivery.delivered_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {deliveries.length > 10 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={fetchDeliveries}
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiActivity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No deliveries yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Delivery attempts will appear here when webhooks are sent.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analytics Overview
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={analytics?.date_range?.days || 7}
                    onChange={(e) => fetchAnalytics(parseInt(e.target.value))}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAnalytics(analytics?.date_range?.days || 7)}
                    loading={analyticsLoading}
                    leftIcon={<FiRefreshCw />}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {analyticsLoading ? (
                <div className="text-center py-8">
                  <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {analytics.total_events || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {analytics.total_deliveries || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Deliveries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {analytics.success_rate ? analytics.success_rate.toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {analytics.avg_response_time || 0}ms
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiBarChart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No analytics data available
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Analytics will appear when there are webhook events and deliveries.
                  </p>
                </div>
              )}
            </div>

            {/* Charts */}
            {analytics && analytics.events_by_day && analytics.events_by_day.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Events Over Time */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Events Over Time
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.events_by_day}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="day_name" 
                          className="text-gray-600 dark:text-gray-400"
                        />
                        <YAxis className="text-gray-600 dark:text-gray-400" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgb(31 41 55)', 
                            border: 'none', 
                            borderRadius: '0.5rem',
                            color: 'white'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="events" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                          name="Events"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="successful" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Successful"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="failed" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="Failed"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Status Distribution
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.status_distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, count }) => `${status}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics.status_distribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.status === 'Success' ? '#22c55e' : '#ef4444'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgb(31 41 55)', 
                            border: 'none', 
                            borderRadius: '0.5rem',
                            color: 'white'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Settings
              </h3>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8">
                <FiSettings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Settings coming soon
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Advanced webhook configuration options will be available here.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <EditWebhookModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        webhook={webhook}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default WebhookDetail;
