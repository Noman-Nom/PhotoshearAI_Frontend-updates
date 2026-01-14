
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { LoginFormData, loginSchema } from '../../../utils/validators';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';
import { GOOGLE_CLIENT_ID } from '../../../utils/api';
import { isOnMainDomain } from '../../../utils/subdomain';

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
          <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm text-start font-bold border border-red-100">
            {formError}
          </div>
        )}
        
        <Input
          label={t('email')}
          type="text"
          placeholder={t('email_placeholder')}
          error={errors.email?.message}
          {...register('email')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />
        
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium leading-none text-slate-700">{t('password')}</label>
            <Link 
              to="/forgot-password" 
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              {t('forgot_password_link')}
            </Link>
          </div>
          <Input
            type="password"
            placeholder={t('password')}
            error={errors.password?.message}
            {...register('password')}
            className="bg-white border-slate-200 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                id="remember" 
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer bg-transparent"
            />
            <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer font-medium select-none">
                {t('remember_me')}
            </label>
        </div>

        <Button 
            type="submit" 
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-2.5 h-11" 
            isLoading={isSubmitting}
        >
          {t('log_in')}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">{t('or')}</span>
        </div>
      </div>

      {googleError && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm text-start font-bold border border-red-100">
          {googleError}
        </div>
      )}
      <div className="flex justify-center">
        <div ref={googleButtonRef} className="w-full flex justify-center" />
      </div>

      <div className="text-center text-sm text-slate-600">
        {t('no_account')}{' '}
        <Link to="/signup" className="font-semibold text-slate-900 hover:underline">
          {t('register')}
        </Link>
      </div>
    </div>
  );
};
