import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { SignupFormData, signupSchema } from '../../../utils/validators';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Select } from '../../../components/ui/Select';
import { COUNTRIES } from '../../../constants';
import { cn } from '../../../utils/cn';
import { motion } from 'framer-motion';
import { User, Building2, Globe, Phone, Mail } from 'lucide-react';

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

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

  const inputClass = "bg-white border-slate-200 focus:ring-indigo-400 focus:border-indigo-300 rounded-xl shadow-sm transition-shadow hover:shadow-md";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('first_name')}
            placeholder={t('first_name')}
            error={errors.firstName?.message}
            leftIcon={<User size={18} />}
            {...register('firstName')}
            className={inputClass}
          />
          <Input
            label={t('last_name')}
            placeholder={t('last_name')}
            error={errors.lastName?.message}
            leftIcon={<User size={18} />}
            {...register('lastName')}
            className={inputClass}
          />
        </div>
      </motion.div>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
        <Input
          label={t('company_name')}
          placeholder={t('company_name')}
          error={errors.companyName?.message}
          leftIcon={<Building2 size={18} />}
          {...register('companyName')}
          className={inputClass}
        />
      </motion.div>

      <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5 text-start">
        <label className="text-sm font-medium leading-none text-slate-700">{t('studio_url')}</label>
        <div className={cn(
          "relative flex rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-300 transition-all overflow-hidden",
          isRTL && "flex-row-reverse",
          errors.url && "border-red-400 focus-within:ring-red-400"
        )}>
          <input
            type="text"
            dir="ltr"
            className={cn(
              "flex h-11 w-full bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 border-0",
              isRTL ? "text-right" : "text-left",
            )}
            placeholder={t('studio_url_placeholder')}
            {...register('url')}
          />
          <div className={cn(
            "flex items-center justify-center px-3 bg-slate-50 text-slate-500 text-sm font-mono whitespace-nowrap border-l border-slate-200",
            isRTL && "border-l-0 border-r border-slate-200"
          )}>
            .fotoshareai.com
          </div>
        </div>
        {errors.url && <p className="text-sm font-medium text-red-500 mt-1">{errors.url.message}</p>}
      </motion.div>

      <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t('country')}
            options={countryOptions}
            error={errors.country?.message}
            {...register('country')}
            className={inputClass}
          />

          <div className="space-y-1.5 text-start">
            <label className="text-sm font-medium leading-none text-slate-700">{t('phone')}</label>
            <div className={cn(
              "relative flex rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-300 transition-all overflow-hidden",
              isRTL && "flex-row-reverse",
              errors.phone && "border-red-400 focus-within:ring-red-400"
            )}>
              <div className={cn(
                "flex items-center justify-center px-3 bg-slate-50 text-slate-500 text-sm font-mono whitespace-nowrap border-r border-slate-200",
                isRTL && "border-r-0 border-l border-slate-200"
              )}>
                {selectedCountryDialCode}
              </div>
              <input
                type="tel"
                dir="ltr"
                className={cn(
                  "flex h-11 w-full bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 border-0",
                  isRTL ? "text-right" : "text-left",
                )}
                placeholder="555-0123"
                {...register('phone')}
              />
            </div>
            {errors.phone && <p className="text-sm font-medium text-red-500 mt-1">{errors.phone.message}</p>}
          </div>
        </div>
      </motion.div>

      <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
        <Input
          label={t('email')}
          type="email"
          placeholder={t('email_placeholder')}
          error={errors.email?.message}
          leftIcon={<Mail size={18} />}
          {...register('email')}
          className={inputClass}
        />
      </motion.div>

      <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PasswordInput
            label={t('password')}
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
            className={inputClass}
          />
          <PasswordInput
            label={t('confirm_password')}
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            className={inputClass}
          />
        </div>
      </motion.div>

      <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            type="submit"
            className="w-full mt-2 text-white py-2.5 h-11 rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            isLoading={isSubmitting}
          >
            {t('create_account')}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible" className="text-center text-sm text-slate-600 mt-4">
        {t('already_account')}{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
          {t('sign_in')}
        </Link>
      </motion.div>
    </form>
  );
};
