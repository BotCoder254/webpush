import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiCopy, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiAlertCircle,
  FiCode,
  FiGlobe,
  FiUser,
  FiCalendar,
  FiHash,
  FiActivity
} from 'react-icons/fi';
import Button from '../ui/Button';
import JsonViewer from '../ui/JsonViewer';
import webhooksService from '../../services/webhooks';
import toast from 'react-hot-toast';

const EventDetailModal = ({ isOpen, onClose, eventId }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventDetails();
    }
  }, [isOpen, eventId]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const data = await webhooksService.getEventDetail(eventId);
      setEvent(data);
    } catch (error) {
      toast.error('Failed to fetch event details');
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'processing':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'new':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return FiCheckCircle;
      case 'failed':
        return FiXCircle;
      case 'processing':
        return FiActivity;
      case 'new':
        return FiClock;
      default:
        return FiAlertCircle;
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      x: '100%',
      transition: {
        duration: 0.3,
      },
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
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

  if (!isOpen) return null;

  const StatusIcon = event ? getStatusIcon(event.status) : FiAlertCircle;

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex"
        onClick={onClose}
      >
        {/* Slider Modal */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="ml-auto bg-white dark:bg-gray-800 w-full max-w-2xl h-full overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FiCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Event Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {event?.event_type || 'Loading...'}
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
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading event details...</p>
              </div>
            ) : event ? (
              <>
                {/* Event Overview */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Event Overview
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Event Type
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {event.event_type}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {event.status}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Event ID
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono">
                          {event.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(event.id, 'Event ID')}
                          className="p-1"
                        >
                          <FiCopy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Created At
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>

                    {event.processed_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Processed At
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(event.processed_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Body Size
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {event.body_size ? `${event.body_size} bytes` : 'N/A'}
                      </p>
                    </div>

                    {event.is_duplicate && (
                      <div className="md:col-span-2">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <div className="flex items-center">
                            <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              Duplicate Event
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            This event was identified as a duplicate based on its content or request ID.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Request Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Source IP
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-mono">
                        {event.source_ip || 'Unknown'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Content Type
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {event.content_type || 'Not specified'}
                      </p>
                    </div>

                    {event.request_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Request ID
                        </label>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono">
                            {event.request_id}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(event.request_id, 'Request ID')}
                            className="p-1"
                          >
                            <FiCopy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {event.signature && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Signature
                        </label>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono truncate flex-1">
                            {event.signature}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(event.signature, 'Signature')}
                            className="p-1"
                          >
                            <FiCopy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {event.user_agent && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          User Agent
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white break-all">
                          {event.user_agent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Information */}
                {event.error_message && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                      Error Information
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {event.error_message}
                    </p>
                  </div>
                )}

                {/* Event Data */}
                {event.data && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Event Data
                    </h3>
                    <JsonViewer data={event.data} collapsed={false} />
                  </div>
                )}

                {/* Raw Headers */}
                {event.raw_headers && Object.keys(event.raw_headers).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Request Headers
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(event.raw_headers).map(([key, value]) => (
                        <div key={key} className="flex items-start space-x-3">
                          <code className="text-xs text-gray-600 dark:text-gray-400 font-medium min-w-0 flex-shrink-0">
                            {key}:
                          </code>
                          <code className="text-xs text-gray-900 dark:text-white break-all">
                            {value}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Body */}
                {event.raw_body && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Raw Body
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(event.raw_body, 'Raw Body')}
                        leftIcon={<FiCopy />}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-600 rounded p-3 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap">
                        {event.raw_body}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Replays and Forwards */}
                {(event.replays?.length > 0 || event.forwards?.length > 0) && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Actions History
                    </h3>
                    
                    {event.replays?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                          Replays ({event.replays.length})
                        </h4>
                        <div className="space-y-2">
                          {event.replays.map((replay) => (
                            <div key={replay.id} className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-900 dark:text-white">
                                  {replay.target_url}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  replay.status === 'sent' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {replay.status}
                                </span>
                              </div>
                              {replay.replayed_at && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(replay.replayed_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {event.forwards?.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                          Forwards ({event.forwards.length})
                        </h4>
                        <div className="space-y-2">
                          {event.forwards.map((forward) => (
                            <div key={forward.id} className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-900 dark:text-white">
                                  {forward.target_url}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  forward.status === 'sent' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {forward.status}
                                </span>
                              </div>
                              {forward.forwarded_at && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(forward.forwarded_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FiXCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Event not found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  The event you're looking for doesn't exist or couldn't be loaded.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventDetailModal;