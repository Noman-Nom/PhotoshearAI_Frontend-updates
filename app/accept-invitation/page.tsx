
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Check, UserPlus, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../utils/cn';

type Step = 'INVITE' | 'REGISTER' | 'SUCCESS';

const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { acceptInvitation, pendingMembers } = useTeam();
  const { workspaces } = useWorkspace();
  
  const recipient = searchParams.get('recipient') || '';
  const accessLevelStr = searchParams.get('accessLevel') || 'Full Access';
  const org = searchParams.get('org') || 'Photmo Inc.';
  
  // Find original invitation to get the correct name
  const invite = pendingMembers.find(p => p.email.toLowerCase() === recipient.toLowerCase());
  const firstNameFromInvite = invite?.firstName || '';
  const lastNameFromInvite = invite?.lastName || '';

  // Parse access level into list if it's comma separated
  const accessList = accessLevelStr.includes(',') 
    ? accessLevelStr.split(',').map(s => s.trim()) 
    : [accessLevelStr];

  const [step, setStep] = useState<Step>('INVITE');
  
  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
    }
    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    setIsSubmitting(true);
    
    // Use invitation data for naming
    try {
        const firstName = firstNameFromInvite || recipient.split('@')[0];
        const lastName = lastNameFromInvite || '';

        await register({
            email: recipient,
            firstName,
            lastName,
            companyName: org,
            password: password,
            isInvitation: true // Flag to skip standard OTP email
        });

        // Use the centralized TeamContext method to transition from Pending to Registered
        // Pass current workspace IDs to snapshot access for "Full Access" users
        acceptInvitation(recipient, { 
            firstName, 
            lastName, 
            phone: '',
            password, // Included for persistence in simulated users list
            currentWorkspaceIds: workspaces.map(w => w.id)
        });
        
        setIsSubmitting(false);
        setStep('SUCCESS');
        
        // Auto redirect after showing success message
        setTimeout(() => {
            navigate('/dashboard');
        }, 2500);

    } catch (err) {
        console.error(err);
        setError('Registration failed. Please try again.');
        setIsSubmitting(false);
    }
  };

  // --- Step 1: Invitation Details Card ---
  if (step === 'INVITE') {
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
                Hello <span className="font-bold text-slate-900">{firstNameFromInvite} {lastNameFromInvite}</span>,<br/>
                You have been invited to join the <span className="font-bold text-slate-900">{org} workspace</span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
                AS PART OF THE CORE TEAM
            </p>
            
            <p className="text-base font-bold text-slate-900 mb-8 px-6 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                {recipient}
            </p>

            {/* Access Rights Card */}
            <div className="w-full bg-[#F8FAFC] rounded-2xl border border-slate-100 p-6 text-left mb-8 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Access Scope</h3>
                
                <div className="space-y-3">
                    {accessList.map((access, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", access === 'Full Access' ? 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'bg-emerald-50 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]')}></div>
                            <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{access}</span>
                        </div>
                    ))}
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
            
            <a href="#" className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors">
                Contact Us <ExternalLink size={10} strokeWidth={3} />
            </a>
        </div>
        </div>
    );
  }

  // --- Step 2: Registration Form ---
  if (step === 'REGISTER') {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
             <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="p-8 sm:p-12">
                    <div className="mb-10 text-center">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Setup your account</h2>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Create a secure password to join <span className="font-bold text-slate-900">{org}</span></p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Email</label>
                             <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed shadow-inner lowercase">
                                 {recipient}
                             </div>
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                             <Input 
                                type="password"
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white border-slate-200 rounded-2xl h-12 focus:ring-slate-900/5 font-bold"
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                             <Input 
                                type="password"
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
                                Register & Join Workspace
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
