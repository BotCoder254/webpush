import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  return (
    <AuthLayout title="Join WebHook Platform">
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
