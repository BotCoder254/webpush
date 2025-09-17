import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FiX, FiPlay, FiCode, FiCheck } from 'react-icons/fi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import webhooksService from '../../services/webhooks';
import toast from 'react-hot-toast';

const TestWebhookModal = ({ isOpen, onClose, webhook }) => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      event_type: 'test',
      payload: JSON.stringify({
        "event": "test",
        "timestamp": new Date().toISOString(),
        "data": {
          "message": "This is a test webhook",
          "user_id": "123",
          "action": "webhook.test"
        }
      }, null, 2),
    },
  });

  const payload = watch('payload');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Parse JSON payload
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(data.payload);
      } catch (error) {
        toast.error('Invalid JSON payload');
        setLoading(false);
        return;
      }

      const result = await webhooksService.testEndpoint(webhook.id, {
        event_type: data.event_type,
        payload: parsedPayload,
      });

      setTestResult(result);
      toast.success('Test webhook sent successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to send test webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
    setTestResult(null);
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(payload);
      setValue('payload', JSON.stringify(parsed, null, 2));
    } catch (error) {
      toast.error('Invalid JSON payload');
    }
  };

  const handleUseTemplate = (template) => {
    setValue('payload', JSON.stringify(template, null, 2));
  };

  const templates = {
    user_created: {
      event: 'user.created',
      timestamp: new Date().toISOString(),
      data: {
        user_id: '12345',
        email: 'user@example.com',
        name: 'John Doe',
        created_at: new Date().toISOString(),
      },
    },
    order_completed: {
      event: 'order.completed',
      timestamp: new Date().toISOString(),
      data: {
        order_id: 'ord_67890',
        customer_id: '12345',
        amount: 99.99,
        currency: 'USD',
        status: 'completed',
      },
    },
    payment_failed: {
      event: 'payment.failed',
      timestamp: new Date().toISOString(),
      data: {
        payment_id: 'pay_13579',
        order_id: 'ord_67890',
        amount: 99.99,
        currency: 'USD',
        error: 'insufficient_funds',
      },
    },
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

  if (testResult) {
    return (
      <AnimatePresence>
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </motion.div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Test Successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your webhook test was sent successfully to {webhook.name}
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Event ID:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">
                  {testResult.event_id}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Delivery ID:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">
                  {testResult.delivery_id}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleClose}
              className="w-full"
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FiPlay className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Test Webhook
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Send a test event to {webhook?.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="p-2"
                >
                  <FiX className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Type
                  </label>
                  <Input
                    type="text"
                    placeholder="test"
                    error={errors.event_type?.message}
                    {...register('event_type', {
                      required: 'Event type is required',
                    })}
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Templates
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(templates).map(([key, template]) => (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="text-xs"
                      >
                        {key.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      JSON Payload
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatJSON}
                      leftIcon={<FiCode />}
                    >
                      Format
                    </Button>
                  </div>
                  <textarea
                    rows={12}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 font-mono text-sm"
                    placeholder="Enter JSON payload..."
                    {...register('payload', {
                      required: 'Payload is required',
                      validate: (value) => {
                        try {
                          JSON.parse(value);
                          return true;
                        } catch {
                          return 'Invalid JSON payload';
                        }
                      },
                    })}
                  />
                  {errors.payload && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.payload.message}
                    </p>
                  )}
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Test Information
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• This will send a real webhook to your endpoint</li>
                    <li>• The test event will be logged in your activity feed</li>
                    <li>• Use this to verify your webhook handling code</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={!isValid || loading}
                    leftIcon={<FiPlay />}
                  >
                    Send Test
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TestWebhookModal;
