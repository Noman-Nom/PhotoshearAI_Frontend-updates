
import React from 'react';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { useTranslation } from '../../contexts/LanguageContext';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Follow the steps to regain access to your account."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
