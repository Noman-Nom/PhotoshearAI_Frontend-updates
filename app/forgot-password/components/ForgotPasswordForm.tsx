
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShieldCheck, Lock, Mail, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { cn } from '../../../utils/cn';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPasswordSendOtp, verifyResetOtp, resetPassword, status, resetEmail, resetStep, setResetStep } = useAuth();
  const { t, isRTL } = useTranslation();

  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Email Form
  const { register: regEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm({
    defaultValues: { email: resetEmail || '' }
  });

  // Step 3: Password Form
  const { register: regPass, handleSubmit: handlePassSubmit, formState: { errors: passErrors } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  // Cooldown timer effect
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onSendOtp = async (data: { email: string }) => {
    setError(null);
    try {
      await forgotPasswordSendOtp(data.email);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !resetEmail) return;
    setError(null);
    try {
      await forgotPasswordSendOtp(resetEmail);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  const onVerifyOtp = async () => {
    setError(null);
    const code = otp.join('');
    if (code.length !== 6) return;
    try {
      await verifyResetOtp(code);
    } catch (err: any) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const onResetPassword = async (data: any) => {
    setError(null);
    try {
      await resetPassword(data.password);
      setResetStep('SUCCESS');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && otp.join('').length === 6) {
      onVerifyOtp();
    }
  };

  // STEP: EMAIL
  if (resetStep === 'EMAIL') {
    return (
      <form onSubmit={handleEmailSubmit(onSendOtp)} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}
        <Input
          label={t('email')}
          type="email"
          placeholder={t('email_placeholder')}
          error={emailErrors.email?.message}
          {...regEmail('email', { required: 'Email is required' })}
          className="bg-white border-slate-200"
          leftIcon={<Mail size={16} />}
        />
        <Button type="submit" className="w-full bg-[#0F172A] hover:bg-[#1E293B] h-12 rounded-xl font-bold" isLoading={status === 'LOADING'}>
          Send Email OTP
        </Button>
        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
            {t('back_to_login')}
          </Link>
        </div>
      </form>
    );
  }

  // STEP: OTP
  if (resetStep === 'OTP') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center">
          <p className="text-sm text-slate-500">We've sent a code to <span className="font-bold text-slate-900">{resetEmail}</span></p>
        </div>
        <div className="flex justify-center gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { otpRefs.current[idx] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
              className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          ))}
        </div>
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}

        <div className="space-y-4">
          <Button onClick={onVerifyOtp} className="w-full bg-[#0F172A] hover:bg-[#1E293B] h-12 rounded-xl font-bold shadow-lg" disabled={otp.join('').length !== 6} isLoading={status === 'LOADING'}>
            Verify OTP
          </Button>

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={cn(
                  "font-bold text-slate-900 hover:underline disabled:opacity-50 disabled:no-underline",
                  resendCooldown > 0 && "text-slate-400"
                )}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </p>

            <button
              onClick={() => setResetStep('EMAIL')}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
              Change Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP: PASSWORD
  if (resetStep === 'PASSWORD') {
    return (
      <form onSubmit={handlePassSubmit(onResetPassword)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-start space-y-1 mb-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Set New Password</h3>
          <p className="text-xs text-slate-500">Must be at least 8 characters with 1 uppercase and 1 number.</p>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}

        <Input
          label="EMAIL"
          type="email"
          value={resetEmail || ''}
          disabled
          className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed opacity-80"
          leftIcon={<Mail size={16} />}
        />

        <PasswordInput
          label="NEW PASSWORD"
          placeholder="••••••••"
          error={passErrors.password?.message}
          {...regPass('password')}
          className="bg-white border-slate-200"
        />

        <PasswordInput
          label="CONFIRM NEW PASSWORD"
          placeholder="••••••••"
          error={passErrors.confirmPassword?.message}
          {...regPass('confirmPassword')}
          className="bg-white border-slate-200"
        />

        <Button type="submit" className="w-full bg-[#0F172A] hover:bg-[#1E293B] h-12 rounded-xl font-bold" isLoading={status === 'LOADING'}>
          Save Password
        </Button>
      </form>
    );
  }

  // STEP: SUCCESS
  return (
    <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
      <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
        <CheckCircle className="w-10 h-10 text-emerald-500" strokeWidth={3} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Password Reset!</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Your password has been successfully updated. <br />Redirecting you to login...
        </p>
      </div>
      <div className="pt-4 flex justify-center gap-1">
        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
