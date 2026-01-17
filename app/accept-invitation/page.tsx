
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Check, UserPlus, CheckCircle2, Loader2, AlertCircle, Building } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { invitationsApi } from '../../services/invitationsApi';
import { setAuthToken } from '../../utils/api';
import { cn } from '../../utils/cn';
import { redirectToSubdomain } from '../../utils/subdomain';

type Step = 'LOADING' | 'INVITE' | 'REGISTER' | 'SUCCESS' | 'ERROR';

const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [step, setStep] = useState<Step>('LOADING');
  const [invitationDetails, setInvitationDetails] = useState<{
    recipient: string;
    org: string;
    access_level: string;
    role: string | null;
    workspace_names: string[];
  } | null>(null);

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invitation details on mount
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) {
        setError('Invalid invitation link. Token is missing.');
        setStep('ERROR');
        return;
      }

      try {
        const details = await invitationsApi.getDetails(token);
        setInvitationDetails(details);
        setStep('INVITE');
      } catch (err: any) {
        console.error('Error fetching invitation details:', err);
        setError(err.message || 'This invitation link is invalid or has expired.');
        setStep('ERROR');
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const handleInitialAccept = () => {
    setStep('REGISTER');
  };

  const handleReject = () => {
    navigate('/login');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token || !invitationDetails) {
      setError('Invalid invitation. Please request a new invitation.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await invitationsApi.accept({
        token,
        password,
      });

      // Store the auth token
      setAuthToken(response.token);

      setIsSubmitting(false);
      setStep('SUCCESS');

      // Redirect to the organization's subdomain after success
      setTimeout(() => {
        if (response.subdomain) {
          redirectToSubdomain(response.subdomain);
        } else {
          navigate('/dashboard');
          window.location.reload();
        }
      }, 2500);

    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
      setIsSubmitting(false);
    }
  };

  // --- Loading State ---
  if (step === 'LOADING') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">Loading Invitation</h2>
            <p className="text-slate-500 text-sm font-medium">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (step === 'ERROR') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight uppercase">Invalid Invitation</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium max-w-[320px]">
              {error}
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white h-14 text-xs font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-900/10 rounded-2xl"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 1: Invitation Details Card ---
  if (step === 'INVITE' && invitationDetails) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 sm:p-10 flex flex-col items-center text-center">

            {/* Shield Icon */}
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-blue-600 fill-blue-600/10 stroke-[2]" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight uppercase">You're Invited!</h1>

            {/* Description */}
            <div className="text-slate-500 text-sm leading-relaxed mb-1 font-medium">
              Hello,<br />
              You have been invited to join <span className="font-bold text-slate-900">{invitationDetails.org}</span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
              AS PART OF THE CORE TEAM
            </p>

            <p className="text-base font-bold text-slate-900 mb-8 px-6 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
              {invitationDetails.recipient}
            </p>

            {/* Access Rights Card */}
            <div className="w-full bg-[#F8FAFC] rounded-2xl border border-slate-100 p-6 text-left mb-8 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Access Scope</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"></div>
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                    {invitationDetails.role || invitationDetails.access_level}
                  </span>
                </div>
                {invitationDetails.workspace_names && invitationDetails.workspace_names.length > 0 && (
                  <>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4 mb-2">Studios</h4>
                    {invitationDetails.workspace_names.map((name, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {name}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              <Button
                onClick={handleInitialAccept}
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white h-14 text-xs font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-900/10 rounded-2xl transition-all active:scale-[0.98]"
              >
                <UserPlus size={18} className="mr-2" strokeWidth={3} />
                Accept Invitation
              </Button>

              <button
                onClick={handleReject}
                className="w-full h-12 bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all"
              >
                Reject
              </button>
            </div>

          </div>
        </div>

        {/* Brand Footer */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1">
              Powered By AI Photo Share
            </div>
            <div className="h-0.5 w-12 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2: Registration Form ---
  if (step === 'REGISTER' && invitationDetails) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="p-8 sm:p-12">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Setup your account</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Create a secure password to join <span className="font-bold text-slate-900">{invitationDetails.org}</span></p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Email</label>
                <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed shadow-inner lowercase">
                  {invitationDetails.recipient}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <PasswordInput
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-200 rounded-2xl h-12 focus:ring-slate-900/5 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <PasswordInput
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white border-slate-200 rounded-2xl h-12 focus:ring-slate-900/5 font-bold"
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-4 rounded-2xl font-bold border border-red-100 animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white h-14 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 rounded-2xl transition-all"
                >
                  Accept Invitation & Join
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Secure Entry Point
        </div>
      </div>
    );
  }

  // --- Step 3: Success Message ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-12 flex flex-col items-center text-center">

          <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8 animate-in zoom-in duration-300 delay-150 shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={3} />
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Welcome Aboard!</h2>

          <p className="text-slate-500 text-sm leading-relaxed max-w-[300px] font-medium">
            Your account has been created successfully. Redirecting you to the workspace dashboard...
          </p>

          <div className="mt-10 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
