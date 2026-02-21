
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

const VerifyOtpPage: React.FC = () => {
  const { verifyOtp, resendOtp, pendingUserEmail, status } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // If no registration is in progress, go back to signup
    if (!pendingUserEmail) {
      navigate('/signup');
    }
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [pendingUserEmail, navigate]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && otp.join('').length === 6) {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    setError(null);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) {
      // Auto-verify when full OTP is pasted
      setTimeout(() => handleVerify(), 100);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    try {
      await verifyOtp(code);
      navigate('/workspaces');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      // Reset inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOtp();
      setResendCooldown(60);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We've sent a 6-digit verification code to ${pendingUserEmail}. Check your email inbox.`}
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={cn(
                "w-10 h-12 sm:w-12 sm:h-14 rounded-xl border text-center text-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
                error ? "border-red-300 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-900"
              )}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-start border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white h-12 rounded-xl font-bold shadow-lg"
            onClick={handleVerify}
            isLoading={status === 'LOADING'}
            disabled={otp.join('').length !== 6}
          >
            Verify Email
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
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
              Back to registration
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtpPage;
