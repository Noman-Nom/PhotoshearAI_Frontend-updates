
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles,
  Mail,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  Grid,
  Plus
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher';
import { cn } from '../../utils/cn';
import { SHARED_EVENTS } from '../../constants';
import { formatBytes } from '../../utils/formatters';
import { CalendarView } from '../../components/shared/CalendarView';

const GlobalCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, isRTL } = useTranslation();
  const { workspaces } = useWorkspace();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const globalStorageStats = useMemo(() => {
    const totalSizeBytes = SHARED_EVENTS.reduce((acc, event) => acc + (event.totalSizeBytes || 0), 0);
    const limit = 1024 * 1024 * 1024; // 1 GB
    return {
      percentage: Math.min(100, Math.round((totalSizeBytes / limit) * 100)),
      formatted: formatBytes(totalSizeBytes)
    };
  }, []);

  const TABS = useMemo(() => [
    { id: 'WorkSpaces', label: t('workspaces'), path: '/workspaces' },
    { id: 'Calendar', label: t('calendar'), path: '/calendar' },
    { id: 'Roles', label: t('roles'), path: '/roles' },
    { id: 'TeamMembers', label: t('all_members'), path: '/all-members' },
    { id: 'GuestData', label: t('guest_data'), path: '/guest-data' },
  ], [t]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32 md:pb-20 w-full overflow-hidden flex flex-col">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50 w-full flex-shrink-0">
        <div className="w-full px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-[#0F172A] p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-slate-200 cursor-pointer" onClick={() => navigate('/workspaces')}>
              <Sparkles className="text-white fill-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="font-bold text-slate-900 text-base md:text-xl tracking-tight uppercase whitespace-nowrap cursor-pointer" onClick={() => navigate('/workspaces')}>AI Photo Share</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 lg:gap-12 h-full">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "h-full px-2 text-[14px] font-bold transition-all relative flex items-center tracking-tight",
                  location.pathname === tab.path ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {location.pathname === tab.path && <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#0F172A] rounded-t-full" />}
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
             <div className="hidden lg:block">
                <LanguageSwitcher />
            </div>

            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100 cursor-pointer active:scale-95 transition-all outline-none"
              >
                <img src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} alt="Profile" className="w-full h-full object-cover" />
              </button>

              {isUserMenuOpen && (
                <div className={cn(
                    "absolute mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60] animate-in zoom-in-95",
                    isRTL ? "left-0 origin-top-left" : "right-0 origin-top-right"
                )}>
                  <div className="px-4 py-3 border-b border-slate-50 mb-1 text-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{t('sign_in')}</p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => { setIsUserMenuOpen(false); navigate('/settings?origin=hub'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase text-slate-700 hover:bg-slate-50 tracking-[0.1em] transition-colors"
                  >
                    <Settings size={16}/> {t('settings')}
                  </button>
                  <button 
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase text-red-500 hover:bg-red-50 tracking-[0.1em] transition-colors"
                  >
                    <LogOut size={16}/> {t('log_out')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-12 overflow-y-auto flex flex-col custom-scrollbar">
          <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col min-h-[700px] md:min-h-0">
              <CalendarView events={SHARED_EVENTS} workspaces={workspaces} isGlobal={true} />
          </div>
      </main>
    </div>
  );
};

export default GlobalCalendarPage;
