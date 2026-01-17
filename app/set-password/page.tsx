import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/PasswordInput';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { setOauthPassword, status } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: any) => {
    setFormError(null);
    try {
      await setOauthPassword(data.password);
      navigate('/settings');
    } catch (err: any) {
      setFormError(err.message || 'Failed to set password.');
    }
  };

  return (
    <AuthLayout
      title="Set a password"
      subtitle="Add a password for email login."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {formError && (
          <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm text-start font-bold border border-red-100">
            {formError}
          </div>
        )}

        <PasswordInput
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message as string}
          {...register('password')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message as string}
          {...register('confirmPassword')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />

        <Button
          type="submit"
          className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-2.5 h-11"
          isLoading={isSubmitting || status === 'LOADING'}
        >
          Save Password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SetPasswordPage;
