import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

const ForgotPassword = () => {
  return (
    <AuthLayout title="Reset Password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPassword;
