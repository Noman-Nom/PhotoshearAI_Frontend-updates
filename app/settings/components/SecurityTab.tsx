import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, ShieldCheck, Mail, Smartphone, Clock, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Switch } from '../../../components/ui/Switch';
import { cn } from '../../../utils/cn';

interface User {
    mfaEnabled?: boolean;
    mfaMethod?: string;
}

interface SecurityTabProps {
    user: User | null;
    isOauthUser: boolean;
    isOwner: boolean;
    onUpdatePassword: () => void;
    onMfaToggle: (checked: boolean) => void;
    onDeleteAccount: () => void;
}

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

export const SecurityTab: React.FC<SecurityTabProps> = ({
    user,
    isOauthUser,
    isOwner,
    onUpdatePassword,
    onMfaToggle,
    onDeleteAccount
}) => {
    const navigate = useNavigate();

    return (
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
                                onClick={onUpdatePassword}
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
                                    onCheckedChange={onMfaToggle}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <MFAMethod active={!!user?.mfaEnabled && user?.mfaMethod === 'Email'} icon={<Mail size={18} />} label="Email Protocol" />
                            <MFAMethod active={!!user?.mfaEnabled && user?.mfaMethod === 'Authenticator'} icon={<Smartphone size={18} />} label="App Auth" />
                            <MFAMethod active={!!user?.mfaEnabled && user?.mfaMethod === 'SMS'} icon={<Clock size={18} />} label="SMS Logic" />
                        </div>
                    </Card>
                </div>
            </section>

            {/* Delete Account Section - Only for Members (Non-Owners) */}
            {!isOwner && (
                <section className="mt-12">
                    <div className="border-b border-red-200 pb-6 mb-10">
                        <h2 className="text-2xl font-black text-red-600 uppercase tracking-tight">Danger Zone</h2>
                        <p className="text-xs text-red-400 font-bold uppercase mt-1">Irreversible actions for your account</p>
                    </div>

                    <Card className="p-8 bg-red-50/50 border-red-200 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-8 hover:shadow-xl transition-all shadow-sm">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 flex-shrink-0 shadow-inner">
                                <Trash2 size={26} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-base font-black text-red-700 uppercase tracking-tight">Delete Account</h4>
                                <p className="text-xs text-red-500 mt-1 font-medium">Permanently delete your account and all associated data. This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={onDeleteAccount}
                                className="px-10 h-12 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all shadow-xl active:scale-95"
                            >
                                Delete Account
                            </button>
                        </div>
                    </Card>
                </section>
            )}
        </div>
    );
};
