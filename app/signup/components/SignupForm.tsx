
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { SignupFormData, signupSchema } from '../../../utils/validators';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { COUNTRIES } from '../../../constants';
import { cn } from '../../../utils/cn';

export const SignupForm: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRIES[0].code);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      country: COUNTRIES[0].code,
      url: '',
    }
  });

  const country = watch('country');
  const companyName = watch('companyName');

  useEffect(() => {
    if (country) {
      setSelectedCountryCode(country);
    }
  }, [country]);

  // Auto-populate URL based on Company Name
  useEffect(() => {
    if (companyName && !isSubmitting) {
       const slug = companyName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
       setValue('url', slug, { shouldValidate: true });
    }
  }, [companyName, setValue, isSubmitting]);

  const selectedCountryDialCode = COUNTRIES.find(c => c.code === selectedCountryCode)?.dialCode || '';

  const onSubmit = async (data: SignupFormData) => {
    setFormError(null);
    try {
      await registerAuth(data);
      // After registration, we need to verify OTP
      navigate('/verify-otp');
    } catch (error: any) {
      setFormError(error.message || 'Registration failed');
    }
  };

  const countryOptions = COUNTRIES.map(c => ({ label: c.name, value: c.code }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {formError && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm text-start font-bold border border-red-100">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('first_name')}
          placeholder={t('first_name')}
          error={errors.firstName?.message}
          {...register('firstName')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />
        <Input
          label={t('last_name')}
          placeholder={t('last_name')}
          error={errors.lastName?.message}
          {...register('lastName')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />
      </div>

      <Input
        label={t('company_name')}
        placeholder={t('company_name')}
        error={errors.companyName?.message}
        {...register('companyName')}
        className="bg-white border-slate-200 focus:ring-slate-900"
      />

      <div className="space-y-1.5 text-start">
        <label className="text-sm font-medium leading-none text-slate-700">{t('studio_url')}</label>
        <div className={cn("relative flex", isRTL && "flex-row-reverse")}>
          <input
            type="text"
            dir="ltr"
            className={cn(
              "flex h-11 w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200",
              isRTL ? "rounded-r-md text-right border-l-0" : "rounded-l-md text-left border-r-0",
              errors.url && "border-red-500 focus:ring-red-500"
            )}
            placeholder={t('studio_url_placeholder')}
            {...register('url')}
          />
          <div className={cn(
            "flex items-center justify-center px-3 border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono whitespace-nowrap",
            isRTL ? "rounded-l-md" : "rounded-r-md"
          )}>
            .fotoshareai.com
          </div>
        </div>
        {errors.url && <p className="text-sm font-medium text-red-500 mt-1">{errors.url.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t('country')}
          options={countryOptions}
          error={errors.country?.message}
          {...register('country')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />
        
        <div className="space-y-1.5 text-start">
          <label className="text-sm font-medium leading-none text-slate-700">{t('phone')}</label>
          <div className={cn("relative flex", isRTL && "flex-row-reverse")}>
            <div className={cn(
              "flex items-center justify-center px-3 border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono whitespace-nowrap",
              isRTL ? "rounded-r-md border-l-0" : "rounded-l-md border-r-0"
            )}>
              {selectedCountryDialCode}
            </div>
            <input
              type="tel"
              dir="ltr"
              className={cn(
                "flex h-11 w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200",
                isRTL ? "rounded-l-md text-right" : "rounded-r-md text-left",
                errors.phone && "border-red-500 focus:ring-red-500"
              )}
              placeholder="555-0123"
              {...register('phone')}
            />
          </div>
          {errors.phone && <p className="text-sm font-medium text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      <Input
        label={t('email')}
        type="email"
        placeholder={t('email_placeholder')}
        error={errors.email?.message}
        {...register('email')}
        className="bg-white border-slate-200 focus:ring-slate-900"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('password')}
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />
        <Input
          label={t('confirm_password')}
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full mt-2 bg-[#0F172A] hover:bg-[#1E293B] text-white py-2.5 h-11" 
        isLoading={isSubmitting}
      >
        {t('create_account')}
      </Button>

      <div className="text-center text-sm text-slate-600 mt-4">
        {t('already_account')}{' '}
        <Link to="/login" className="font-semibold text-slate-900 hover:underline">
          {t('sign_in')}
        </Link>
      </div>
    </form>
  );
};
