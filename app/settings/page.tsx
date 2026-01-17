
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sidebar } from '../../components/shared/Sidebar';
import {
  User,
  Shield,
  CreditCard,
  Settings,
  Check,
  Lock,
  Smartphone,
  Mail,
  Download,
  ShieldCheck,
  ChevronDown,
  X,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  Clock,
  Zap,
  Search,
  Bell,
  Eye,
  EyeOff,
  Sparkles,
  LogOut,
  Plus,
  Trash2,
  LockKeyhole
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBilling } from '../../contexts/BillingContext';
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Modal } from '../../components/ui/Modal';
import { Switch } from '../../components/ui/Switch';
import { Select } from '../../components/ui/Select';
import { SubscriptionPlan, BillingHistoryItem, PaymentMethod } from '../../types';
import { SHARED_EVENTS, COUNTRIES } from '../../constants';
import { formatBytes } from '../../utils/formatters';
import { api } from '../../utils/api';
import { mapUserFromApi } from '../../utils/mappers';
import { showToast } from '../../utils/toast';

type SettingsTab = 'profile' | 'security' | 'payment' | 'plans' | 'billing';
type PasswordStep = 'UPDATE_FORM' | 'FORGOT_OTP' | 'FORGOT_RESET' | 'SUCCESS';

const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    interval: 'monthly',
    features: ['1 Workspace', '10 Events / Month', '1GB Storage', 'Standard Support'],
    isCurrent: true
  },
  {
    id: 'pro',
    name: 'Pro Studio',
    price: '$49',
    interval: 'monthly',
    features: ['Unlimited Workspaces', 'Unlimited Events', '50GB Storage', 'Priority Support', 'Custom Branding'],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    interval: 'monthly',
    features: ['Dedicated Account Manager', '250GB Storage', 'Custom Domain', 'SLA Guarantee', 'Bulk AI Processing'],
  }
];

const BILLING_HISTORY: BillingHistoryItem[] = [
  { id: 'INV-001', date: 'Oct 12, 2024', amount: '49.00', currency: 'USD', method: 'Visa ending in 4242', status: 'Paid' },
  { id: 'INV-002', date: 'Sep 12, 2024', amount: '49.00', currency: 'USD', method: 'Visa ending in 4242', status: 'Paid' },
  { id: 'INV-003', date: 'Aug 12, 2024', amount: '49.00', currency: 'USD', method: 'Visa ending in 4242', status: 'Failed' },
];

const PAYMENT_STORAGE_KEY = 'photmo_payment_methods_v1';

const SettingsPage: React.FC = () => {
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const origin = searchParams.get('origin') || 'studio';
  const { user, updateUserProfile, logout } = useAuth();
  const { members } = useTeam();
  const { activeWorkspace } = useWorkspace();
  const {
    paymentMethods,
    plans,
    subscription,
    billingHistory,
    billingHistoryTotal,
    billingHistoryPage,
    billingHistoryPageSize,
    fetchPaymentMethods,
    fetchPlans,
    fetchSubscription,
    fetchBillingHistory,
    addPaymentMethod,
    deletePaymentMethod: deletePaymentMethodApi,
    updateSubscription,
    isLoading: isBillingLoading,
    error: billingError,
  } = useBilling();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSuccessToast, setIsSuccessToast] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Settings updated successfully.');

  // Add Card Modal State
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    street: '',
    city: '',
    zip: '',
    country: 'US'
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [isSavingCard, setIsSavingCard] = useState(false);

  // User menu state for platform header
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // MFA Challenge State
  const [isMfaChallengeOpen, setIsMfaChallengeOpen] = useState(false);

  // Email Change State
  const [isEmailVerifyOpen, setIsEmailVerifyOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [emailError, setEmailError] = useState('');
  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(null);

  // Password Management State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState<PasswordStep>('UPDATE_FORM');
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
    phone: user?.phone || '+1 (555) 000-0000'
  });

  const isOauthUser = useMemo(() => {
    const status = user?.status?.toLowerCase() || '';
    return status.includes('oauth') || status.includes('google');
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: pendingEmailChange || user.email || '',
      companyName: user.companyName || '',
      phone: user.phone || ''
    });
  }, [user, pendingEmailChange]);

  const isOwner = useMemo(() => {
    const profile = members.find(m => m.email === user?.email);
    return profile?.isOwner || ['Owner', 'SuperAdmin / Owner'].includes(profile?.role || '');
  }, [members, user]);

  // Fetch billing data on mount and when activeTab changes to payment/plans/billing
  useEffect(() => {
    if (!isOwner) return;

    if (activeTab === 'payment') {
      fetchPaymentMethods();
    } else if (activeTab === 'plans') {
      fetchPlans();
      fetchSubscription();
    } else if (activeTab === 'billing') {
      fetchBillingHistory();
    }
  }, [activeTab, isOwner, fetchPaymentMethods, fetchPlans, fetchSubscription, fetchBillingHistory]);

  const globalStorageStats = useMemo(() => {
    const totalSizeBytes = SHARED_EVENTS.reduce((acc, event) => acc + (event.totalSizeBytes || 0), 0);
    const limit = 1024 * 1024 * 1024; // 1 GB
    return {
      percentage: Math.min(100, Math.round((totalSizeBytes / limit) * 100)),
      formatted: formatBytes(totalSizeBytes)
    };
  }, []);

  const handleSaveProfile = async () => {
    setEmailError('');
    try {
      const payload = {
        first_name: profileForm.firstName?.trim() || null,
        last_name: profileForm.lastName?.trim() || null,
        company_name: profileForm.companyName?.trim() || null,
        phone: profileForm.phone?.trim() || null
      };
      const profileResp = await api.put('/api/v1/users/me', payload, true);
      if (profileResp) {
        updateUserProfile(mapUserFromApi(profileResp));
      }

      if (profileForm.email !== user?.email) {
        await api.post('/api/v1/users/me/email-change', { new_email: profileForm.email }, true);
        setEmailOtp(['', '', '', '', '', '']);
        setPendingEmailChange(profileForm.email);
        setIsEmailVerifyOpen(true);
        return;
      }

      setSuccessMsg('Profile details updated.');
      setIsSuccessToast(true);
      setTimeout(() => setIsSuccessToast(false), 3000);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to update profile.');
    }
  };

  const verifyEmailOtp = async () => {
    const code = emailOtp.join('');
    if (code.length !== 6) {
      setEmailError('Invalid verification code.');
      return;
    }
    try {
      await api.post('/api/v1/users/me/email-verify', { otp: code }, true);
      const profileResp = await api.get('/api/v1/users/me', true);
      if (profileResp) {
        updateUserProfile(mapUserFromApi(profileResp));
      }
      setIsEmailVerifyOpen(false);
      setEmailOtp(['', '', '', '', '', '']);
      setPendingEmailChange(null);
      setSuccessMsg('Email successfully verified and updated.');
      setIsSuccessToast(true);
      setTimeout(() => setIsSuccessToast(false), 3000);
    } catch (err: any) {
      setEmailError(err.message || 'Invalid verification code.');
    }
  };

  const openPasswordModal = () => {
    setPasswordStep('UPDATE_FORM');
    setPasswordForm({ current: '', new: '', confirm: '' });
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setPasswordError('All fields are required.');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.post('/api/v1/users/me/password', {
        current_password: passwordForm.current,
        new_password: passwordForm.new
      }, true);
      setIsUpdatingPassword(false);
      setIsPasswordModalOpen(false);
      setSuccessMsg('Password successfully changed.');
      setIsSuccessToast(true);
      setTimeout(() => setIsSuccessToast(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
      setIsUpdatingPassword(false);
    }
  };

  const initiateForgotPassword = async () => {
    setIsUpdatingPassword(true);
    try {
      await api.post('/api/v1/users/me/password/otp', undefined, true);
      setPasswordStep('FORGOT_OTP');
      setForgotOtp(['', '', '', '', '', '']);
      setPasswordError('');
    } catch (e) {
      setPasswordError('Failed to dispatch recovery code.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const verifyForgotOtp = async () => {
    const code = forgotOtp.join('');
    if (code.length !== 6) {
      setPasswordError('Incorrect OTP code.');
      return;
    }
    try {
      await api.post('/api/v1/users/me/password/verify-otp', { otp: code }, true);
      setPasswordStep('FORGOT_RESET');
      setPasswordForm(prev => ({ ...prev, new: '', confirm: '' }));
      setPasswordError('');
    } catch (e: any) {
      setPasswordError('Incorrect OTP code.');
    }
  };

  const handleFinalReset = async () => {
    if (!passwordForm.new || !passwordForm.confirm) {
      setPasswordError('Fill both fields.');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.post('/api/v1/users/me/password/reset', { new_password: passwordForm.new }, true);
      setIsUpdatingPassword(false);
      setIsPasswordModalOpen(false);
      setSuccessMsg('Identity restored. Password reset successful.');
      setIsSuccessToast(true);
      setTimeout(() => setIsSuccessToast(false), 3000);
    } catch (e: any) {
      setPasswordError(e.message || 'Failed to reset password.');
      setIsUpdatingPassword(false);
    }
  };

  const handleMfaToggle = (checked: boolean) => {
    setIsMfaChallengeOpen(true);
  };

  const confirmMfaChange = async () => {
    const nextValue = !user?.mfaEnabled;
    try {
      const resp = await api.post('/api/v1/users/me/mfa', {
        enabled: nextValue,
        method: nextValue ? (user?.mfaMethod || 'Email') : null
      }, true);
      if (resp) {
        const baseUser = user ? { ...user } : {};
        updateUserProfile(mapUserFromApi({
          ...baseUser,
          mfa_enabled: resp.mfa_enabled,
          mfa_method: resp.mfa_method
        }));
      }
      setIsMfaChallengeOpen(false);
      setSuccessMsg(nextValue ? 'MFA Protection Enabled.' : 'MFA Protection Disabled.');
      setIsSuccessToast(true);
      setTimeout(() => setIsSuccessToast(false), 3000);
    } catch (e: any) {
      console.error(e);
      setIsMfaChallengeOpen(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length > 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const detectCardBrand = (number: string): PaymentMethod['brand'] => {
    const n = number.replace(/\D/g, '');
    if (n.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^6(?:011|5)/.test(n)) return 'Discover';
    return 'Generic';
  };

  const handleAddCard = async () => {
    const errs: Record<string, string> = {};
    if (!cardForm.name.trim()) errs.name = "Required";
    if (cardForm.number.replace(/\s/g, '').length < 13) errs.number = "Invalid card number";
    if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) errs.expiry = "Use MM/YY";
    if (cardForm.cvv.length < 3) errs.cvv = "Invalid CVV";
    if (!cardForm.street.trim()) errs.street = "Required";
    if (!cardForm.zip.trim()) errs.zip = "Required";

    if (Object.keys(errs).length > 0) {
      setCardErrors(errs);
      return;
    }

    setIsSavingCard(true);
    try {
      const [month, year] = cardForm.expiry.split('/');
      await addPaymentMethod({
        card_number: cardForm.number.replace(/\s/g, ''),
        exp_month: parseInt(month),
        exp_year: 2000 + parseInt(year),
        cvv: cardForm.cvv,
        cardholder_name: cardForm.name.trim(),
        billing_address: {
          street: cardForm.street,
          city: cardForm.city,
          zip: cardForm.zip,
          country: cardForm.country
        },
        is_default: paymentMethods.length === 0
      });
      setIsAddCardModalOpen(false);
      setCardForm({ name: '', number: '', expiry: '', cvv: '', street: '', city: '', zip: '', country: 'US' });
      setCardErrors({});
      showToast({ type: 'success', message: 'Payment method added successfully' });
      await fetchPaymentMethods();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to add payment method' });
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await deletePaymentMethodApi(id);
      showToast({ type: 'success', message: 'Payment method removed' });
      await fetchPaymentMethods();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to delete payment method' });
    }
  };

  const handleUpgradeSubscription = async (planId: string) => {
    try {
      await updateSubscription(planId);
      showToast({ type: 'success', message: 'Subscription updated successfully' });
      await fetchSubscription();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to update subscription' });
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Personal Information', icon: <User size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    ...(isOwner ? [
      { id: 'payment', label: 'Payment Details', icon: <CreditCard size={18} /> },
      { id: 'plans', label: 'Plans & Upgrade', icon: <Zap size={18} /> },
      { id: 'billing', label: 'Billing History', icon: <CreditCard size={18} /> }
    ] : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHubLayout = origin === 'hub';

  const platformTabs = useMemo(() => [
    { id: 'WorkSpaces', label: t('workspaces'), path: '/workspaces' },
    { id: 'Roles', label: t('roles'), path: '/roles' },
    { id: 'TeamMembers', label: t('all_members'), path: '/all-members' },
    { id: 'GuestData', label: t('guest_data'), path: '/guest-data' },
  ], [t]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden flex-col">
      {isHubLayout && (
        <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50 w-full flex-shrink-0">
          <div className="w-full px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => navigate('/workspaces')}>
              <div className="bg-[#0F172A] p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-slate-200">
                <Sparkles className="text-white fill-white w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-bold text-slate-900 text-base md:text-xl tracking-tight uppercase whitespace-nowrap">AI Photo Share</span>
            </div>

            <nav className="hidden md:flex items-center gap-8 lg:gap-12 h-full">
              {platformTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "h-full px-2 text-[14px] font-bold transition-all relative flex items-center tracking-tight text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <div className="flex items-center gap-4 px-6 border-l border-slate-100 ml-2 h-10 self-center">
                <div className="flex flex-col text-start">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    STORAGE <span className="text-slate-900 ml-1">{globalStorageStats.percentage}%</span>
                  </div>
                  <div className="text-[10px] font-bold text-blue-500 font-mono tracking-tighter uppercase leading-none">
                    {globalStorageStats.formatted} / 1GB
                  </div>
                </div>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${globalStorageStats.percentage}%` }}
                  />
                </div>
              </div>
            </nav>

            <div className="flex items-center gap-2 md:gap-5">
              <button
                onClick={() => navigate('/email-simulation', { state: { from: location.pathname + location.search } })}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all shadow-sm group"
              >
                <Mail size={18} className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest hidden lg:block">Email Sim</span>
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100 cursor-pointer outline-none"
                >
                  <img src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                </button>

                {isUserMenuOpen && (
                  <div className={cn(
                    "absolute mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60] animate-in zoom-in-95",
                    isRTL ? "left-0" : "right-0"
                  )}>
                    <button
                      onClick={() => { setIsUserMenuOpen(false); navigate('/settings?origin=hub'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase text-blue-600 bg-blue-50/50 tracking-[0.1em] transition-colors"
                    >
                      <Settings size={16} /> {t('settings')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase text-red-500 hover:bg-red-50 tracking-[0.1em] transition-colors"
                    >
                      <LogOut size={16} /> {t('log_out')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="flex-1 flex overflow-hidden">
        {!isHubLayout && <Sidebar />}

        <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
          {!isHubLayout && (
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20">
              <div className="min-w-0 text-start">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">
                  {t('settings')}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block mt-0.5">
                  {t('active_studio')}: <span className="text-slate-700">{activeWorkspace?.name || 'Platform Hub'}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3 md:space-x-6">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-1'} md:space-x-4 text-slate-400`}>
                  <button className="hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"><Search size={20} /></button>
                  <button className="hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"><Bell size={20} /></button>
                </div>

                <div className={`flex items-center gap-3 group cursor-pointer`}>
                  <div className="h-9 w-9 bg-slate-100 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
                    <img src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} alt="Profile" className="h-full w-full object-cover" />
                  </div>
                  <button className="text-slate-400 group-hover:text-slate-900 transition-colors hidden md:block">
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            </header>
          )}

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <nav className={cn(
              "bg-white border-r border-slate-100 p-4 md:p-8 space-y-2 overflow-x-auto no-scrollbar md:overflow-y-auto flex-shrink-0",
              isHubLayout ? "w-full md:w-80" : "w-full md:w-72"
            )}>
              <div className="mb-6 px-4 hidden md:block text-start">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configuration</h2>
                <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Identity & Security</p>
              </div>
              <div className="flex md:flex-col gap-1.5">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={cn(
                      "flex-1 md:flex-none flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all whitespace-nowrap",
                      activeTab === item.id
                        ? "bg-[#0F172A] text-white shadow-xl shadow-slate-900/10"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-lg", activeTab === item.id ? "bg-white/10" : "bg-slate-50")}>{item.icon}</div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            <main className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-50/50 custom-scrollbar">
              <div className="max-w-4xl mx-auto">

                {activeTab === 'profile' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                      <div className="text-start">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Personal Information</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Manage your identity and credentials</p>
                      </div>
                      <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 h-12 px-10 text-xs uppercase tracking-[0.15em] font-black rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Save Changes</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                      <Input label="First Name" value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} className="bg-white rounded-xl h-12 font-bold" />
                      <Input label="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} className="bg-white rounded-xl h-12 font-bold" />
                      <div className="space-y-1">
                        <Input label="Email Address" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="bg-white rounded-xl h-12 font-bold" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Updating email triggers a verification OTP code.</p>
                      </div>
                      <Input label="Phone Number" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="bg-white rounded-xl h-12 font-bold" />
                      <div className="md:col-span-2">
                        <Input label="Company Name" value={profileForm.companyName} onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })} className="bg-white rounded-xl h-12 font-bold" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start">
                    <section>
                      <div className="border-b border-slate-200 pb-6 mb-10">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Account Security</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Multi-layer protection for your platform data</p>
                      </div>

                      <div className="grid grid-cols-1 gap-8">
                        <Card className="p-8 bg-white border-slate-100 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-8 hover:shadow-xl transition-all border-none shadow-sm">
                          <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0 shadow-inner">
                              <Lock size={26} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Password Management</h4>
                              <p className="text-xs text-slate-500 mt-1 truncate font-medium">Update your login credentials or recover access via OTP.</p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={openPasswordModal}
                              className="px-10 h-12 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-[#0F172A] rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                            >
                              Update Password
                            </button>
                          </div>
                        </Card>

                        {isOauthUser && (
                          <Card className="p-8 bg-white border-slate-100 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-8 hover:shadow-xl transition-all border-none shadow-sm">
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0 shadow-inner">
                                <KeyRound size={26} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Set Password</h4>
                                <p className="text-xs text-slate-500 mt-1 truncate font-medium">Add a password for email login alongside Google sign-in.</p>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => navigate('/set-password')}
                                className="px-10 h-12 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-[#0F172A] rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                              >
                                Set Password
                              </button>
                            </div>
                          </Card>
                        )}

                        <Card className="p-8 bg-white border-slate-100 rounded-[2rem] hover:shadow-xl transition-all border-none shadow-sm">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10">
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 flex-shrink-0 shadow-inner">
                                <ShieldCheck size={26} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Multi-Factor Auth</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Add an extra verification layer to your login process.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-5 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 shadow-inner">
                              <div className="text-right">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border block mb-1",
                                  user?.mfaEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-200 text-slate-500 border-slate-300"
                                )}>
                                  {user?.mfaEnabled ? 'Shield Active' : 'MFA Disabled'}
                                </span>
                              </div>
                              <Switch
                                checked={user?.mfaEnabled || false}
                                onCheckedChange={handleMfaToggle}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <MFAMethod active={user?.mfaEnabled && user?.mfaMethod === 'Email'} icon={<Mail size={18} />} label="Email Protocol" />
                            <MFAMethod active={user?.mfaEnabled && user?.mfaMethod === 'Authenticator'} icon={<Smartphone size={18} />} label="App Auth" />
                            <MFAMethod active={user?.mfaEnabled && user?.mfaMethod === 'SMS'} icon={<Clock size={18} />} label="SMS Logic" />
                          </div>
                        </Card>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'payment' && isOwner && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Payment Details</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Manage your authorized credit and debit cards</p>
                      </div>
                      <Button
                        onClick={() => setIsAddCardModalOpen(true)}
                        className="bg-[#0F172A] hover:bg-slate-800 text-white h-12 px-8 text-xs uppercase tracking-widest font-black rounded-xl shadow-lg transition-all"
                      >
                        <Plus size={18} className="mr-2" /> Add Card
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {paymentMethods.length === 0 ? (
                        <Card className="col-span-full py-20 text-center border-dashed border-2 border-slate-100">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <CreditCard size={32} />
                          </div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No payment methods added</p>
                        </Card>
                      ) : (
                        paymentMethods.map(pm => (
                          <Card key={pm.id} className="p-6 bg-white border-slate-100 rounded-3xl group relative overflow-hidden shadow-sm hover:shadow-xl transition-all border-none">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                                pm.brand === 'Visa' ? "bg-blue-50 text-blue-600" :
                                  pm.brand === 'Mastercard' ? "bg-orange-50 text-orange-600" :
                                    "bg-slate-50 text-slate-600"
                              )}>
                                <CreditCard size={24} />
                              </div>
                              <div className="flex gap-2">
                                {pm.isDefault && (
                                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-100 tracking-widest">Default</span>
                                )}
                                <button
                                  onClick={() => handleDeletePaymentMethod(pm.id)}
                                  disabled={isBillingLoading}
                                  className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="relative z-10">
                              <div className="text-xl font-black text-slate-900 tracking-[0.25em] mb-1 font-mono">
                                •••• •••• •••• {pm.last4}
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="text-start">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cardholder</p>
                                  <p className="text-[11px] font-bold text-slate-900 uppercase truncate max-w-[200px]">{pm.cardholderName}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Expiry</p>
                                  <p className="text-[11px] font-bold text-slate-900">{pm.expiryDate}</p>
                                </div>
                              </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                          </Card>
                        ))
                      )}
                    </div>

                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                      <LockKeyhole size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                      <div className="text-start">
                        <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Enterprise Security Standards</h4>
                        <p className="text-xs text-blue-700/80 font-medium leading-relaxed mt-1 uppercase tracking-tight">
                          Card data is encrypted at the storage level. We adhere to strict PCI-DSS guidelines to ensure your financial credentials remain vault-protected and restricted to account owners.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'plans' && isOwner && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start">
                    <div className="border-b border-slate-200 pb-6 mb-10">
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Enterprise Infrastructure</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Current Tier: <strong>{subscription?.planName || plans.find(p => p.isCurrent)?.name || 'N/A'}</strong></p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {isBillingLoading && !plans.length ? (
                        <div className="col-span-full text-center py-12">
                          <p className="text-slate-400 font-bold">Loading plans...</p>
                        </div>
                      ) : plans.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                          <p className="text-slate-400 font-bold">No plans available</p>
                        </div>
                      ) : (
                        plans.map((plan) => (
                          <Card key={plan.id} className={cn(
                            "p-10 bg-white border-2 transition-all relative flex flex-col rounded-[2.5rem]",
                            plan.isCurrent ? "border-slate-900 ring-8 ring-slate-900/5 shadow-2xl" : "border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl",
                            plan.isPopular && !plan.isCurrent && "border-blue-500"
                          )}>
                            {plan.isPopular && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">POPULAR</div>
                            )}
                            <div className="mb-8">
                              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">{plan.name}</h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase">/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
                              </div>
                            </div>
                            <div className="flex-1 space-y-5 mb-10">
                              {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-sm"><Check size={14} strokeWidth={4} /></div>
                                  <span className="text-[13px] font-bold text-slate-600 leading-tight">{feature}</span>
                                </div>
                              ))}
                            </div>
                            <button
                              disabled={plan.isCurrent || isBillingLoading}
                              onClick={() => !plan.isCurrent && handleUpgradeSubscription(plan.id)}
                              className={cn("w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all", plan.isCurrent ? "bg-slate-100 text-slate-400 cursor-default shadow-inner" : "bg-[#0F172A] text-white hover:bg-slate-800 shadow-xl active:scale-95 disabled:opacity-50")}
                            >
                              {plan.isCurrent ? 'Active Hub' : 'Upgrade'}
                            </button>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && isOwner && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-start">
                    <div className="border-b border-slate-200 pb-6 mb-10">
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ledger & Billing</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Audit logs and financial records</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Date</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Amount</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Method</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Status</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-mono">
                            {isBillingLoading && !billingHistory.length ? (
                              <tr>
                                <td colSpan={5} className="px-10 py-12 text-center text-slate-400">Loading billing history...</td>
                              </tr>
                            ) : billingHistory.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-10 py-12 text-center text-slate-400">No billing history yet</td>
                              </tr>
                            ) : (
                              billingHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-10 py-6"><div className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{new Date(item.date).toLocaleDateString()}</div><div className="text-[10px] text-slate-400 mt-1 uppercase opacity-60">{item.id}</div></td>
                                  <td className="px-10 py-6"><div className="text-[12px] font-black text-slate-900 uppercase">{item.amount} {item.currency}</div></td>
                                  <td className="px-10 py-6"><div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{item.method}</div></td>
                                  <td className="px-10 py-6"><span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm", item.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : item.status === 'Failed' ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100")}>{item.status}</span></td>
                                  <td className="px-10 py-6 text-right"><button className="p-3 text-slate-300 hover:text-slate-900 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-slate-100"><Download size={20} /></button></td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Card Modal */}
      <Modal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        title="Secure Payment Method"
        className="max-w-2xl w-full"
        contentClassName="p-0 overflow-hidden"
      >
        <div className="bg-white flex flex-col max-h-[85vh]">
          <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
            {/* Visual Card Preview */}
            <div className="w-full h-48 rounded-3xl bg-slate-900 p-8 text-white relative overflow-hidden shadow-2xl transition-all animate-in zoom-in-95 duration-500">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-10 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                    <Zap className="text-white/40" size={20} />
                  </div>
                  <CreditCard className="text-white/20" size={32} />
                </div>
                <div className="space-y-4">
                  <div className="text-2xl font-black tracking-[0.25em] font-mono uppercase">
                    {cardForm.number || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-start">
                      <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Cardholder</p>
                      <p className="text-sm font-bold truncate max-w-[200px] uppercase">{cardForm.name || 'FULL NAME'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Expires</p>
                      <p className="text-sm font-bold uppercase">{cardForm.expiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative Shapes */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mt-12 -ml-12"></div>
            </div>

            {/* Secure Form */}
            <div className="space-y-6">
              <div className="text-start">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Payment Instrument</h3>
                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="Cardholder Name*"
                    placeholder="AS PRINTED ON CARD"
                    value={cardForm.name}
                    onChange={e => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })}
                    error={cardErrors.name}
                    className="font-bold rounded-xl h-12 uppercase"
                  />
                  <Input
                    label="Card Number*"
                    placeholder="0000 0000 0000 0000"
                    value={cardForm.number}
                    onChange={e => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                    maxLength={19}
                    error={cardErrors.number}
                    className="font-mono font-bold rounded-xl h-12"
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Expiry Date*"
                      placeholder="MM/YY"
                      value={cardForm.expiry}
                      onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                      maxLength={5}
                      error={cardErrors.expiry}
                      className="font-bold rounded-xl h-12"
                    />
                    <Input
                      label="CVV*"
                      type="password"
                      placeholder="•••"
                      value={cardForm.cvv}
                      onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                      maxLength={4}
                      error={cardErrors.cvv}
                      className="font-bold rounded-xl h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="text-start">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Billing Jurisdiction</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address*"
                      placeholder="Apartment, suite, etc."
                      value={cardForm.street}
                      onChange={e => setCardForm({ ...cardForm, street: e.target.value })}
                      error={cardErrors.street}
                      className="font-bold rounded-xl h-12"
                    />
                  </div>
                  <Input
                    label="City*"
                    placeholder="City"
                    value={cardForm.city}
                    onChange={e => setCardForm({ ...cardForm, city: e.target.value })}
                    className="font-bold rounded-xl h-12"
                  />
                  <Input
                    label="Zip / Postal Code*"
                    placeholder="Zip"
                    value={cardForm.zip}
                    onChange={e => setCardForm({ ...cardForm, zip: e.target.value })}
                    error={cardErrors.zip}
                    className="font-bold rounded-xl h-12"
                  />
                  <div className="md:col-span-2">
                    <Select
                      label="Country*"
                      value={cardForm.country}
                      onChange={e => setCardForm({ ...cardForm, country: e.target.value })}
                      options={COUNTRIES.map(c => ({ label: c.name, value: c.code }))}
                      className="font-bold rounded-xl h-12"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 opacity-50">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PCI-DSS Compliant Infrastructure</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsAddCardModalOpen(false)}
                className="flex-1 sm:flex-none px-8 h-12 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all rounded-xl"
              >
                CANCEL
              </button>
              <Button
                onClick={handleAddCard}
                isLoading={isSavingCard}
                className="flex-1 sm:flex-none bg-[#0F172A] hover:bg-slate-800 text-white h-12 px-10 text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
              >
                Authorize Card
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={passwordStep === 'UPDATE_FORM' ? "Password Update" : "Secure Recovery"}
        className="max-w-md w-full"
      >
        <div className="py-2 text-start">
          {passwordStep === 'UPDATE_FORM' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <PasswordInput
                  label="Current Password"
                  placeholder="••••••••"
                  value={passwordForm.current}
                  onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="h-12 font-bold"
                />
                <div className="flex justify-end">
                  <button
                    onClick={initiateForgotPassword}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="h-px bg-slate-100" />
                <PasswordInput
                  label="New Password"
                  placeholder="Min. 8 characters"
                  value={passwordForm.new}
                  onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="h-12 font-bold"
                />
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="h-12 font-bold"
                />
              </div>

              {passwordError && (
                <div className="bg-red-50 text-red-600 text-xs py-3 px-4 rounded-xl font-bold border border-red-100 flex items-center gap-2">
                  <AlertCircle size={14} /> {passwordError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="h-12 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl">Cancel</Button>
                <Button
                  onClick={handleUpdatePassword}
                  isLoading={isUpdatingPassword}
                  className="bg-[#0F172A] h-12 text-[10px] font-black uppercase tracking-widest shadow-xl rounded-xl"
                >
                  Save Update
                </Button>
              </div>
            </div>
          )}

          {passwordStep === 'FORGOT_OTP' && (
            <div className="space-y-8 text-center animate-in slide-in-from-right-4 duration-300">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="text-blue-500 w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Verification Check</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Verification code dispatched to your profile email.</p>
              </div>

              <div className="flex justify-center gap-2">
                {forgotOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { forgotOtpRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!/^\d*$/.test(val)) return;
                      const nextOtp = [...forgotOtp];
                      nextOtp[idx] = val.slice(-1);
                      setForgotOtp(nextOtp);
                      if (val && idx < 5) forgotOtpRefs.current[idx + 1]?.focus();
                      setPasswordError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !forgotOtp[idx] && idx > 0) forgotOtpRefs.current[idx - 1]?.focus();
                    }}
                    className={cn(
                      "w-10 h-14 rounded-xl border text-center text-xl font-black focus:outline-none focus:ring-4 transition-all",
                      passwordError ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setPasswordStep('UPDATE_FORM')} className="h-12 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl">Back</Button>
                <Button
                  onClick={verifyForgotOtp}
                  disabled={forgotOtp.join('').length !== 6}
                  className="bg-[#0F172A] h-12 text-[10px] font-black uppercase tracking-widest shadow-xl rounded-xl"
                >
                  Verify Identity
                </Button>
              </div>
            </div>
          )}

          {passwordStep === 'FORGOT_RESET' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <KeyRound className="text-emerald-600 w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">New Credentials</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Security cleared. Establish your new password.</p>
              </div>

              <div className="space-y-4">
                <PasswordInput
                  label="New Password"
                  placeholder="Min. 8 characters"
                  value={passwordForm.new}
                  onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="h-12 font-bold"
                />
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="h-12 font-bold"
                />
              </div>

              <Button
                onClick={handleFinalReset}
                isLoading={isUpdatingPassword}
                className="w-full bg-[#0F172A] h-14 text-xs font-black uppercase tracking-widest shadow-xl rounded-2xl transition-all active:scale-95"
              >
                Reset & Finalize
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isMfaChallengeOpen}
        onClose={() => setIsMfaChallengeOpen(false)}
        title="Security Verification"
        className="max-w-md w-full"
      >
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="text-blue-600 w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">MFA Sensitivity Challenge</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Please confirm your password to {user?.mfaEnabled ? 'disable' : 'enable'} Multi-Factor Protection.
            </p>
          </div>
          <PasswordInput label="Confirm Identity" placeholder="••••••••" className="text-center font-bold h-12" />
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setIsMfaChallengeOpen(false)} className="h-12 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl">Cancel</Button>
            <Button onClick={confirmMfaChange} className="bg-[#0F172A] h-12 text-[10px] font-black uppercase tracking-widest shadow-xl rounded-xl">Authorize Change</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEmailVerifyOpen}
        onClose={() => setIsEmailVerifyOpen(false)}
        title="Email Verification"
        className="max-w-md w-full"
      >
        <div className="space-y-8 py-4 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="text-indigo-500 w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Verify New Address</h4>
            <p className="text-sm text-slate-500 font-medium">Authentication token dispatched to <span className="font-bold text-slate-900">{pendingEmailChange || profileForm.email}</span></p>
          </div>
          <div className="flex justify-center gap-2">
            {emailOtp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { otpRefs.current[idx] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!/^\d*$/.test(val)) return;
                  const nextOtp = [...emailOtp];
                  nextOtp[idx] = val.slice(-1);
                  setEmailOtp(nextOtp);
                  if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
                  setEmailError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !emailOtp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
                }}
                className={cn(
                  "w-10 h-14 rounded-xl border text-center text-xl font-black focus:outline-none focus:ring-4 transition-all",
                  emailError ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                )}
              />
            ))}
          </div>
          {emailError && (
            <div className="bg-red-50 text-red-600 text-xs py-3 px-4 rounded-xl font-bold border border-red-100 flex items-center gap-2">
              <AlertCircle size={14} /> {emailError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setIsEmailVerifyOpen(false)} className="h-12 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl">Cancel</Button>
            <Button onClick={verifyEmailOtp} className="bg-[#0F172A] h-12 text-[10px] font-black uppercase tracking-widest shadow-xl rounded-xl">Verify & Save</Button>
          </div>
        </div>
      </Modal>

      {/* Global Success Toast */}
      {isSuccessToast && (
        <div className="fixed top-24 right-8 z-[9999] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <Check size={20} strokeWidth={4} />
          </div>
          <div className="text-start">
            <p className="text-xs font-black uppercase tracking-widest leading-none">Settings Refreshed</p>
            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{successMsg}</p>
          </div>
          <button onClick={() => setIsSuccessToast(false)} className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const MFAMethod = ({ active, icon, label }: { active: boolean, icon: React.ReactNode, label: string }) => (
  <div className={cn(
    "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group",
    active ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
  )}>
    <div className={cn("p-3 rounded-xl flex-shrink-0 transition-colors shadow-sm", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400 group-hover:text-slate-600")}>
      {icon}
    </div>
    <div className="text-start min-w-0">
      <p className={cn("text-[11px] font-black uppercase tracking-widest truncate", active ? "text-white" : "text-slate-900")}>{label}</p>
      <p className={cn("text-[9px] font-bold uppercase mt-0.5", active ? "text-blue-300" : "text-slate-400")}>{active ? 'Primary Mode' : 'Configuration Required'}</p>
    </div>
  </div>
);

export default SettingsPage;
