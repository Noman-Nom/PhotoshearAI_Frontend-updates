
import React from 'react';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { SignupForm } from './components/SignupForm';
import { useTranslation } from '../../contexts/LanguageContext';

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AuthLayout
      title={t('create_account')}
      subtitle={t('signup_subtitle')}
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default SignupPage;
