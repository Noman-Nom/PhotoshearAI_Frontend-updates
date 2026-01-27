import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Lock, Download, Mail, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useEvents } from '../../contexts/EventsContext';
import { clientAccessApi } from '../../services/clientAccessApi';
import { addSimulatedEmail } from '../../constants';
import { cn } from '../../utils/cn';
import { EMAIL_REGEX } from '../../utils/validators';

type Step = 'PIN' | 'OTP' | 'CHOICE';

const ClientAccessPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { getEventById } = useEvents();

    // URL-driven state
    const mode = searchParams.get('mode') || 'full';
    const step = (searchParams.get('step') as Step) || 'PIN';

    // Local UI state
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState(['', '', '', '']);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessingChoice, setIsProcessingChoice] = useState(false);

    // PIN/OTP Input Refs
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Hardcoded PIN for simulation
    const CORRECT_PIN = "9522";

    // Helper to change steps via URL
    const navigateToStep = (nextStep: Step) => {
        setSearchParams({ mode, step: nextStep });
    };

    useEffect(() => {
        if (step === 'PIN') {
            // Optional: auto-focus logic
        } else if (step === 'OTP') {
            otpRefs.current[0]?.focus();
        }
    }, [step]);

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) value = value.slice(-1);

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setError('');

        if (value && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) value = value.slice(-1);

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handlePinContinue = async () => {
        if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }

        const enteredPin = pin.join('');
        if (enteredPin.length !== 4) {
            setError('Please enter the 4-digit PIN.');
            return;
        }

        if (!eventId) {
            setError('Event not found.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Call API to request access
            const response = await clientAccessApi.requestAccess(eventId, email.trim(), enteredPin);

            if (response.success) {
                // For simulation, generate OTP locally and show it
                const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                setGeneratedOtp(newOtp);

                // Get event details for email
                const event = await getEventById(eventId);

                // Simulate sending OTP
                addSimulatedEmail({
                    to: email,
                    subject: 'Security Verification Code',
                    body: `Your one-time password for accessing "${event?.title || 'the event'}" is: ${newOtp}. This code will expire shortly.`
                });

                navigateToStep('OTP');
            } else {
                setError(response.message || 'Access denied. Please check your credentials.');
            }
        } catch (error: any) {
            console.error('Access request failed:', error);
            // Fallback to simulation mode for development
            const event = await getEventById(eventId);

            // Validate against event customer email (simulation)
            if (event && email.toLowerCase().trim() !== event.customer_email?.toLowerCase().trim()) {
                setError('The entered email does not match our records for this event.');
            } else if (enteredPin !== CORRECT_PIN) {
                setError('Invalid event PIN. Please try again.');
            } else {
                // Generate OTP for simulation
                const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                setGeneratedOtp(newOtp);

                addSimulatedEmail({
                    to: email,
                    subject: 'Security Verification Code',
                    body: `Your one-time password for accessing "${event?.title || 'the event'}" is: ${newOtp}. This code will expire shortly.`
                });

                navigateToStep('OTP');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerify = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length !== 6 || !eventId) return;

        setIsLoading(true);
        setError('');

        try {
            // Try API verification first
            const response = await clientAccessApi.verifyOtp(eventId, email.trim(), enteredOtp);

            if (response.success) {
                // Store session token
                sessionStorage.setItem('client_session_token', response.token);
                sessionStorage.setItem('client_event_id', response.event_id);
                navigateToStep('CHOICE');
            }
        } catch (error) {
            // Fallback to simulation mode
            if (enteredOtp === generatedOtp || enteredOtp === '000000') {
                navigateToStep('CHOICE');
            } else {
                setError('Incorrect or expired OTP. Please check your email.');
                setOtp(['', '', '', '', '', '']);
                otpRefs.current[0]?.focus();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChoice = (type: 'photo' | 'download') => {
        setIsProcessingChoice(true);
        setTimeout(() => {
            navigate(`/client-gallery/${eventId}?mode=${mode}`);
        }, 1000);
    };

    const isPinComplete = pin.join('').length === 4 && EMAIL_REGEX.test(email.trim());
    const isOtpComplete = otp.join('').length === 6;

    const getTitle = () => {
        if (mode === 'selection') return t('selection_mode_title');
        if (mode === 'full') return t('full_access_title');
        return "Gallery Access";
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans text-start">
            <div className="bg-white w-full max-w-[440px] rounded-[2rem] shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-100">

                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>

                {step === 'PIN' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-2 shadow-inner">
                            <Lock className="text-blue-500 w-7 h-7 stroke-[2.5]" />
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">{getTitle()}</h1>
                        <p className="text-sm text-slate-500 mb-8 font-medium">Verify your identity to proceed to the secure gallery.</p>

                        <div className="space-y-6 text-start">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address*</label>
                                <div className="relative group">
                                    <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full ps-12 pe-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">Event PIN*</label>
                                <div className="flex justify-center gap-3">
                                    {pin.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={el => { pinRefs.current[idx] = el }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePinChange(idx, e.target.value)}
                                            onKeyDown={(e) => handlePinKeyDown(idx, e)}
                                            className={cn(
                                                "w-12 h-14 rounded-2xl border text-center text-2xl font-black focus:outline-none focus:ring-4 focus:ring-offset-0 transition-all",
                                                error && pin.join('').length > 0
                                                    ? 'border-red-300 focus:ring-red-100 bg-red-50 text-red-600'
                                                    : 'border-slate-200 focus:ring-blue-100 focus:border-slate-400 bg-slate-50 text-slate-900'
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-8 bg-red-50 text-red-600 text-[13px] py-3.5 px-4 rounded-2xl font-bold border border-red-100 animate-in fade-in slide-in-from-top-1 flex items-center justify-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handlePinContinue}
                            disabled={!isPinComplete || isLoading}
                            className={cn(
                                "w-full font-black py-4 mt-8 rounded-2xl transition-all flex items-center justify-center shadow-xl uppercase tracking-[0.1em] text-sm active:scale-[0.98]",
                                isPinComplete
                                    ? 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-slate-900/10'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                            )}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : "Continue"}
                        </button>

                        <button
                            onClick={() => navigate(`/share-event/${eventId}`)}
                            className="mt-10 text-[11px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-all"
                        >
                            {t('exit_simulation')}
                        </button>
                    </div>
                )}

                {step === 'OTP' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-2 shadow-inner">
                            <ShieldCheck className="text-indigo-500 w-7 h-7 stroke-[2.5]" />
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Verify Access</h1>
                        <p className="text-sm text-slate-500 mb-4 font-medium">We've sent a 6-digit verification code to <span className="text-slate-900 font-bold">{email}</span></p>

                        <div className="mb-6 py-2 px-4 bg-indigo-50 border border-indigo-100 rounded-xl inline-flex items-center gap-3">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Simulation Code:</span>
                            <span className="text-base font-black text-indigo-700 tracking-[0.2em] font-mono">{generatedOtp}</span>
                        </div>

                        <div className="flex justify-center gap-2 mb-8">
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
                                    className={cn(
                                        "w-10 h-14 rounded-xl border text-center text-xl font-black focus:outline-none focus:ring-4 focus:ring-offset-0 transition-all",
                                        error
                                            ? 'border-red-300 focus:ring-red-100 bg-red-50 text-red-600'
                                            : 'border-slate-200 focus:ring-blue-100 focus:border-slate-400 bg-slate-50 text-slate-900'
                                    )}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="mb-8 bg-red-50 text-red-600 text-[13px] py-3.5 px-4 rounded-2xl font-bold border border-red-100 flex items-center justify-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleOtpVerify}
                            disabled={!isOtpComplete || isLoading}
                            className={cn(
                                "w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center shadow-xl uppercase tracking-[0.1em] text-sm active:scale-[0.98]",
                                isOtpComplete
                                    ? 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-slate-900/10'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                            )}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : "Verify OTP"}
                        </button>

                        <div className="mt-8">
                            <button
                                onClick={() => {
                                    setOtp(['', '', '', '', '', '']);
                                    navigateToStep('PIN');
                                }}
                                className="text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                            >
                                <ArrowLeft size={12} strokeWidth={3} /> Change Details
                            </button>
                        </div>
                    </div>
                )}

                {step === 'CHOICE' && (
                    <div className="py-2 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-2 shadow-inner">
                            <ShieldCheck className="text-emerald-500 w-7 h-7 stroke-[2.5]" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight uppercase">Access Granted</h1>
                        <p className="text-sm text-slate-500 mb-10 px-4 leading-relaxed font-medium">
                            Identity verified successfully. How would you like to explore your gallery?
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleChoice('photo')}
                                disabled={isProcessingChoice}
                                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-2xl shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
                            >
                                {isProcessingChoice ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Square size={18} />
                                        Browse & Select
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => handleChoice('download')}
                                disabled={isProcessingChoice}
                                className="w-full bg-white border border-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all hover:bg-slate-50 flex items-center justify-center gap-3 active:scale-[0.98] text-xs uppercase tracking-widest shadow-sm"
                            >
                                <Download size={18} />
                                Download Entire Repository
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Reusable Square icon for Choice
const Square = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
);

export default ClientAccessPage;
