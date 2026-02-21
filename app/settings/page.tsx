
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
import { COUNTRIES } from '../../constants';
import { useEvents } from '../../contexts/EventsContext';
import { formatBytes } from '../../utils/formatters';
import { api } from '../../utils/api';
import { mapUserFromApi } from '../../utils/mappers';
import { showToast } from '../../utils/toast';
import { ProfileTab } from './components/ProfileTab';
import { SecurityTab } from './components/SecurityTab';
import { PaymentTab } from './components/PaymentTab';
import { PlansTab } from './components/PlansTab';
import { BillingHistoryTab } from './components/BillingHistoryTab';

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

  // Delete Account State
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

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

  const { events } = useEvents();

  const globalStorageStats = useMemo(() => {
    const totalSizeBytes = events.reduce((acc, event) => acc + (event.total_size_bytes || 0), 0);
    const limit = 1024 * 1024 * 1024; // 1 GB
    return {
      percentage: Math.min(100, Math.round((totalSizeBytes / limit) * 100)),
      formatted: formatBytes(totalSizeBytes)
    };
  }, [events]);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') {
      setDeleteAccountError('Please type "delete my account" to confirm');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError('');

    try {
      await api.delete('/api/v1/users/me', true);
      setIsDeleteAccountModalOpen(false);
      showToast({ message: 'Account deleted successfully. Logging out...', type: 'success' });
      // Wait a moment then logout
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (e: any) {
      setDeleteAccountError(e.message || 'Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
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
                  <ProfileTab
                    profileForm={profileForm}
                    setProfileForm={setProfileForm}
                    onSave={handleSaveProfile}
                  />
                )}

                {activeTab === 'security' && (
                  <SecurityTab
                    user={user}
                    isOauthUser={isOauthUser}
                    isOwner={isOwner}
                    onUpdatePassword={openPasswordModal}
                    onMfaToggle={handleMfaToggle}
                    onDeleteAccount={() => {
                      setDeleteConfirmText('');
                      setDeleteAccountError('');
                      setIsDeleteAccountModalOpen(true);
                    }}
                  />
                )}

                {activeTab === 'payment' && isOwner && (
                  <PaymentTab
                    paymentMethods={paymentMethods}
                    isBillingLoading={isBillingLoading}
                    onAddCard={() => setIsAddCardModalOpen(true)}
                    onDeleteCard={handleDeletePaymentMethod}
                  />
                )}

                {activeTab === 'plans' && isOwner && (
                  <PlansTab
                    plans={plans}
                    planName={subscription?.planName || plans.find(p => p.isCurrent)?.name || 'N/A'}
                    isBillingLoading={isBillingLoading}
                    onUpgrade={handleUpgradeSubscription}
                  />
                )}

                {activeTab === 'billing' && isOwner && (
                  <BillingHistoryTab
                    billingHistory={billingHistory}
                    isBillingLoading={isBillingLoading}
                  />
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

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        title="Delete Account"
        className="max-w-md w-full"
      >
        <div className="space-y-6 py-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trash2 className="text-red-600 w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-red-600 uppercase tracking-tight">Permanent Deletion</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              This action is <span className="font-bold text-red-600">irreversible</span>. All your data, memberships, and account information will be permanently deleted.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-start">
            <p className="text-xs text-red-600 font-bold mb-2">To confirm, type "delete my account" below:</p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete my account"
              className="bg-white border-red-200 focus:border-red-400 font-mono text-sm"
            />
          </div>

          {deleteAccountError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">
              {deleteAccountError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountModalOpen(false)}
              className="h-12 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              isLoading={isDeletingAccount}
              disabled={deleteConfirmText.toLowerCase() !== 'delete my account' || isDeletingAccount}
              className="bg-red-600 hover:bg-red-700 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl rounded-xl disabled:opacity-50"
            >
              Delete Forever
            </Button>
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



export default SettingsPage;
