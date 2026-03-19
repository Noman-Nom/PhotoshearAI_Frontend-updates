
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
        className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 bg-slate-50"
        style={{
           backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(239, 246, 255) 0%, rgb(255, 255, 255) 90%)'
        }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Animated Background Mesh */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-40">
           <motion.div 
             className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full blur-[100px]"
             animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           />
           <motion.div 
             className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-200 rounded-full blur-[120px]"
             animate={{ x: [0, -40, 0], y: [0, -40, 0] }}
             transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           />
           <motion.div 
             className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-pink-100 rounded-full blur-[80px]"
             animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
             transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
           />
        </div>

        <div className="w-full h-full max-w-lg relative z-10 flex flex-col items-center justify-center">
          
          {/* Main Floating Card Construction */}
          <div className="relative w-full aspect-square flex items-center justify-center">
            
            {/* Center Platform */}
            <motion.div 
              className="relative w-64 h-64 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center border border-slate-100/50 backdrop-blur-xl z-20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
                 <User className="text-white w-10 h-10" strokeWidth={1.5} />
              </div>
              <div className="space-y-3 w-full px-8">
                <div className="h-3 w-24 bg-slate-100 rounded-full mx-auto" />
                <div className="h-2 w-32 bg-slate-50 rounded-full mx-auto" />
                <div className="h-8 w-full bg-indigo-50/50 rounded-lg mt-4 flex items-center justify-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                   <div className="h-2 w-16 bg-indigo-100 rounded-full" />
                </div>
              </div>

              {/* Decorative Ring */}
              <div className="absolute inset-[-20px] border border-slate-200/50 rounded-full z-[-1]" />
              <div className="absolute inset-[-60px] border border-slate-100/30 rounded-full z-[-1]" />
            </motion.div>

            {/* Orbiting Feature Cards (Icons) */}
            
            {/* Top Left - Images */}
            <motion.div 
              className="absolute top-10 left-0 p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-3 z-30"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 }}
            >
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <ImageIcon size={20} />
              </div>
              <div className="hidden sm:block">
                <div className="h-2 w-16 bg-slate-100 rounded-full mb-1" />
                <div className="h-1.5 w-10 bg-slate-50 rounded-full" />
              </div>
            </motion.div>

            {/* Top Right - Security */}
            <motion.div 
              className="absolute top-20 -right-4 p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-3 z-10"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                <Shield size={20} />
              </div>
               <div className="hidden sm:block">
                <div className="h-2 w-12 bg-slate-100 rounded-full mb-1" />
                <div className="h-1.5 w-8 bg-slate-50 rounded-full" />
              </div>
            </motion.div>

            {/* Bottom Left - Camera */}
            <motion.div 
              className="absolute bottom-20 -left-6 p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-3 z-30"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                <Camera size={20} />
              </div>
               <div className="hidden sm:block">
                <div className="h-2 w-14 bg-slate-100 rounded-full mb-1" />
                <div className="h-1.5 w-20 bg-slate-50 rounded-full" />
              </div>
            </motion.div>

            {/* Bottom Right - Payment/Credit */}
            <motion.div 
              className="absolute bottom-4 right-8 p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-3 z-30"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                <CreditCard size={20} />
              </div>
               <div className="hidden sm:block">
                <div className="h-2 w-16 bg-slate-100 rounded-full mb-1" />
                <div className="h-1.5 w-10 bg-slate-50 rounded-full" />
              </div>
            </motion.div>

            {/* Connecting lines (svg) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" viewBox="0 0 400 400">
               <motion.path 
                 d="M 120 120 Q 200 200 200 200" 
                 stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-slate-400"
                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5 }}
               />
               <motion.path 
                 d="M 280 140 Q 200 200 200 200" 
                 stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-slate-400"
                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.7 }}
               />
               <motion.path 
                 d="M 100 280 Q 200 200 200 200" 
                 stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-slate-400"
                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.9 }}
               />
               <motion.path 
                 d="M 280 300 Q 200 200 200 200" 
                 stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-slate-400"
                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 1.1 }}
               />
            </svg>

          </div>

          <motion.div
            className="mt-12 text-center relative z-20 px-8 max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight mb-4">{t('secure_access_title')}</h2>
            <p className="text-slate-500 text-lg leading-relaxed">{t('secure_access_subtitle')}</p>
          </motion.div>

        </div>
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
              className="space-y-2 text-center"
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
