import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import authService from '../../services/auth';
import toast from 'react-hot-toast';

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm({
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(data.email);
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      const email = getValues('email');
      await authService.resetPassword(email);
      toast.success('Email sent again!');
    } catch (error) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Check your email
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-600 dark:text-gray-400 mb-8"
        >
          We've sent a password reset link to your email address. 
          Click the link in the email to reset your password.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleResendEmail}
            loading={isLoading}
          >
            Resend email
          </Button>

          <Link to="/login">
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              leftIcon={<FiArrowLeft />}
            >
              Back to login
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Forgot Password
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Enter your email address and we'll send you a link to reset your password
        </motion.p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div>
          <Input
            type="email"
            placeholder="Enter your email address"
            icon={FiMail}
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
          disabled={!isValid || isLoading}
          rightIcon={<FiArrowRight />}
        >
          Send Reset Link
        </Button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <Link
          to="/login"
          className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to login
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPasswordForm;
