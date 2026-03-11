
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { LoginFormData, loginSchema } from '../../../utils/validators';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { cn } from '../../../utils/cn';
import { GOOGLE_CLIENT_ID } from '../../../utils/api';
import { isOnMainDomain } from '../../../utils/subdomain';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    google?: any;
  }
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export const LoginForm: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await login(data);
      // Only navigate if not on main domain (subdomain login stays on same subdomain)
      // Main domain login will redirect to subdomain in AuthContext
      if (!isOnMainDomain()) {
        navigate('/workspaces');
      }
      // If on main domain, the redirect to subdomain happens in AuthContext
    } catch (error: any) {
      if (error.message === 'VERIFICATION_REQUIRED') {
        navigate('/verify-otp');
      } else {
        setFormError(error.message || 'Invalid email or password. Please try again.');
      }
    }
  };
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleError('Google client ID is not configured.');
      return;
    }
    if (!window.google?.accounts?.id || !googleButtonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          const resp = await googleLogin(response.credential);
          navigate(resp.needsProfileCompletion ? '/complete-profile' : '/workspaces');
        } catch (error: any) {
          setGoogleError(error.message || 'Google sign-in failed.');
        }
      }
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 360
    });
  }, [googleLogin, navigate]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {formError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm text-start font-semibold border border-red-100 shadow-sm"
          >
            {formError}
          </motion.div>
        )}

        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <Input
            label={t('email')}
            type="text"
            placeholder={t('email_placeholder')}
            error={errors.email?.message}
            {...register('email')}
            className="bg-white border-slate-200 focus:ring-indigo-400 focus:border-indigo-300 rounded-xl shadow-sm transition-shadow hover:shadow-md"
          />
        </motion.div>

        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium leading-none text-slate-700">{t('password')}</label>
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
            >
              {t('forgot_password_link')}
            </Link>
          </div>
          <PasswordInput
            placeholder={t('password')}
            error={errors.password?.message}
            {...register('password')}
            className="bg-white border-slate-200 focus:ring-indigo-400 focus:border-indigo-300 rounded-xl shadow-sm transition-shadow hover:shadow-md"
          />
        </motion.div>

        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="remember"
            className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 cursor-pointer bg-transparent accent-indigo-500"
          />
          <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer font-medium select-none">
            {t('remember_me')}
          </label>
        </motion.div>

        <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              className="w-full text-white py-2.5 h-11 rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
              isLoading={isSubmitting}
            >
              {t('log_in')}
            </Button>
          </motion.div>
        </motion.div>
      </form>

      <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-semibold tracking-widest">{t('or')}</span>
        </div>
      </motion.div>

      {googleError && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm text-start font-semibold border border-red-100">
          {googleError}
        </div>
      )}

      <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="flex justify-center">
        <div ref={googleButtonRef} className="w-full flex justify-center" />
      </motion.div>

      <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="text-center text-sm text-slate-600">
        {t('no_account')}{' '}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
          {t('register')}
        </Link>
      </motion.div>
    </div>
  );
};
