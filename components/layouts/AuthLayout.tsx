
import React from 'react';
import { Shield, Lock, CreditCard, FileText, User, Camera, Zap, ImageIcon } from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.div
        className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #eef2ff 40%, #e0e7ff 100%)' }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Subtle background orbs */}
        <div className="absolute top-20 left-20 w-48 h-48 rounded-full bg-indigo-100 opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-32 right-16 w-64 h-64 rounded-full bg-violet-100 opacity-30 blur-3xl pointer-events-none" />

        {/* Illustration composition */}
        <div className="relative w-full max-w-sm aspect-square">
          {/* Center Hub */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 shadow-2xl z-20"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <User className="text-white w-12 h-12" />
          </motion.div>

          {/* Orbiting Elements */}
          <div className="absolute inset-0 animate-[spin_60s_linear_infinite]">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
              <ImageIcon className="text-indigo-400 w-7 h-7" />
            </div>
            <div className="absolute top-1/2 right-6 -translate-y-1/2 bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
              <CreditCard className="text-slate-500 w-7 h-7" />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
              <Shield className="text-indigo-400 w-7 h-7" />
            </div>
            <div className="absolute top-1/2 left-6 -translate-y-1/2 bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
              <Camera className="text-slate-500 w-7 h-7" />
            </div>
          </div>

          {/* Dashed orbit ring */}
          <div className="absolute inset-0 border-[2px] border-dashed border-indigo-200 rounded-full scale-75 opacity-60" />
        </div>

        <motion.div
          className="mt-10 text-center relative z-20 px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">{t('secure_access_title')}</h2>
          <p className="text-slate-500 mt-3 max-w-sm text-sm leading-relaxed">{t('secure_access_subtitle')}</p>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          className="mt-8 flex flex-wrap gap-2 justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {['AI-Powered', 'Secure', 'Multi-Studio'].map((badge, i) => (
            <span key={badge} className="px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-600 border border-indigo-100 shadow-sm">
              {badge}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col min-h-screen"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-16">
          <div className="w-full max-w-[440px] space-y-8">
            <motion.div
              className="space-y-2 text-start"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h2>
              <p className="text-slate-500 text-sm sm:text-base">{subtitle}</p>
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-xs sm:text-sm text-slate-400 border-t border-slate-50 lg:border-none">
          <div className="flex items-center justify-center gap-2">
            <a href="#" className="hover:text-slate-600 hover:underline transition-colors">Privacy Policy</a>
            <span className="opacity-30">|</span>
            <a href="#" className="hover:text-slate-600 hover:underline transition-colors">Refund Policy</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
