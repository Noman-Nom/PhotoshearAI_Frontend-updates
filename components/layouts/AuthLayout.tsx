
import React from 'react';
import { Shield, Lock, CreditCard, FileText, User, Mail, Zap } from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { isRTL, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen w-full flex bg-white relative overflow-x-hidden">
      {/* Top Header Actions */}
      <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} z-50 flex items-center gap-3`}>
        <LanguageSwitcher />
      </div>

      {/* Left side - Decorative/Illustration */}
      <div className="hidden lg:flex w-1/2 bg-[#FDF2F8] relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Abstract "Network" Illustration Composition */}
        <div className="relative w-full max-w-lg aspect-square">
          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-2xl p-6 shadow-xl z-20">
            <User className="text-white w-12 h-12" />
          </div>

          {/* Orbiting Elements */}
          <div className="absolute inset-0 animate-[spin_60s_linear_infinite]">
            {/* Item 1 - Top */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-lg border border-slate-100">
              <FileText className="text-slate-600 w-8 h-8" />
            </div>
            {/* Item 2 - Right */}
            <div className="absolute top-1/2 right-10 -translate-y-1/2 bg-white p-4 rounded-xl shadow-lg border border-slate-100">
              <CreditCard className="text-slate-600 w-8 h-8" />
            </div>
            {/* Item 3 - Bottom */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-lg border border-slate-100">
              <Shield className="text-slate-600 w-8 h-8" />
            </div>
            {/* Item 4 - Left */}
            <div className="absolute top-1/2 left-10 -translate-y-1/2 bg-white p-4 rounded-xl shadow-lg border border-slate-100">
              <Lock className="text-slate-600 w-8 h-8" />
            </div>
          </div>

          {/* Connecting Lines (Decorative) */}
          <div className="absolute inset-0 border-[2px] border-dashed border-slate-300 rounded-full scale-75 opacity-50"></div>

          {/* Character Illustration Placeholder */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-10 w-64 h-48 bg-orange-50 rounded-t-[3rem] shadow-lg z-10 flex items-end justify-center pb-4">
            <div className="w-48 h-32 bg-slate-800 rounded-t-2xl opacity-90 relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-300 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center relative z-20 px-8">
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">{t('secure_access_title')}</h2>
          <p className="text-slate-500 mt-3 max-w-md">{t('secure_access_subtitle')}</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-16">
          <div className="w-full max-w-[440px] space-y-8">
            <div className="space-y-2 text-start">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h2>
              <p className="text-slate-500 text-sm sm:text-base">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-xs sm:text-sm text-slate-400 border-t border-slate-50 lg:border-none">
          <div className="flex items-center justify-center gap-2">
            <a href="#" className="hover:text-slate-600 hover:underline">Privacy Policy</a>
            <span className="opacity-30">|</span>
            <a href="#" className="hover:text-slate-600 hover:underline">Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};
