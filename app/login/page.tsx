
import React from 'react';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { LoginForm } from './components/LoginForm';
import { useTranslation } from '../../contexts/LanguageContext';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AuthLayout
      title={t('welcome_back')}
      subtitle={t('sign_in_subtitle')}
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
