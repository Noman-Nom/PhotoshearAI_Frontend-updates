import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export interface ProfileForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string;
}

interface ProfileTabProps {
    profileForm: ProfileForm;
    setProfileForm: (form: ProfileForm) => void;
    onSave: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profileForm, setProfileForm, onSave }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="text-start">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Personal Information</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Manage your identity and credentials</p>
                </div>
                <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 h-12 px-10 text-xs uppercase tracking-[0.15em] font-black rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Save Changes</Button>
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
    );
};
