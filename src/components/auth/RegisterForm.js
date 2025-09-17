import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import toast from 'react-hot-toast';

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    try {
      const userData = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        password: data.password,
        password_confirm: data.confirmPassword,
      };

      await registerUser(userData);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    }
  };

  // Password strength validation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score < 2) return { score, text: 'Weak', color: 'text-red-500' };
    if (score < 4) return { score, text: 'Medium', color: 'text-yellow-500' };
    return { score, text: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

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
          Create Account
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Join us to start managing your webhooks
        </motion.p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="text"
              placeholder="First name"
              icon={FiUser}
              error={errors.firstName?.message}
              {...register('firstName', {
                required: 'First name is required',
                minLength: {
                  value: 2,
                  message: 'First name must be at least 2 characters',
                },
              })}
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Last name"
              icon={FiUser}
              error={errors.lastName?.message}
              {...register('lastName', {
                required: 'Last name is required',
                minLength: {
                  value: 2,
                  message: 'Last name must be at least 2 characters',
                },
              })}
            />
          </div>
        </div>

        <div>
          <Input
            type="email"
            placeholder="Enter your email"
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

        <div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Create password"
            icon={FiLock}
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            }
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
          />
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2"
            >
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Password strength: </span>
                <span className={passwordStrength.color}>{passwordStrength.text}</span>
              </div>
              <div className="flex space-x-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-full rounded ${
                      i < passwordStrength.score
                        ? passwordStrength.score < 2
                          ? 'bg-red-500'
                          : passwordStrength.score < 4
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div>
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            icon={FiLock}
            error={errors.confirmPassword?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            }
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
          />
        </div>

        <div>
          <Checkbox
            checked={agreeToTerms}
            onChange={setAgreeToTerms}
            label={
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  Privacy Policy
                </Link>
              </span>
            }
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
          disabled={!isValid || !agreeToTerms || isLoading}
          rightIcon={<FiArrowRight />}
        >
          Create Account
        </Button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RegisterForm;
