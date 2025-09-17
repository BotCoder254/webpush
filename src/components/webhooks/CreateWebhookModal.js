import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FiX, FiGlobe, FiType, FiFileText } from 'react-icons/fi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import webhooksService from '../../services/webhooks';
import toast from 'react-hot-toast';

const CreateWebhookModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const webhook = await webhooksService.createEndpoint(data);
      toast.success('Webhook endpoint created successfully!');
      onSuccess(webhook);
      onClose();
      reset();
    } catch (error) {
      toast.error(error.message || 'Failed to create webhook endpoint');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <FiGlobe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Create Webhook Endpoint
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create a new webhook endpoint to receive events
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endpoint Name
                  </label>
                  <Input
                    type="text"
                    placeholder="My API Webhook"
                    icon={FiType}
                    error={errors.name?.message}
                    {...register('name', {
                      required: 'Endpoint name is required',
                      minLength: {
                        value: 3,
                        message: 'Name must be at least 3 characters',
                      },
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Describe what this webhook is for..."
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    {...register('status')}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    What happens next?
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• A unique webhook URL will be generated</li>
                    <li>• A secure signing secret will be created</li>
                    <li>• You can start receiving webhook events immediately</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
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
                  >
                    Create Endpoint
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

export default CreateWebhookModal;
