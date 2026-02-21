
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  Plus,
  Calendar,
  Users,
  Palette,
  Mail,
  Grid,
  ChevronRight,
  HardDrive,
  Settings,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '../../utils/cn';
import { SHARED_EVENTS } from '../../constants';
import { formatBytes } from '../../utils/formatters';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Calculate Storage Usage for Sidebar
  const storageStats = useMemo(() => {
    if (!activeWorkspace) return { percentage: 0, formatted: '0 Bytes' };
    const workspaceEvents = SHARED_EVENTS.filter(e => e.workspaceId === activeWorkspace.id);
    const totalSizeBytes = workspaceEvents.reduce((acc, event) => acc + (event.totalSizeBytes || 0), 0);
    const limit = 1024 * 1024 * 1024; // 1 GB
    return {
      percentage: Math.min(100, Math.round((totalSizeBytes / limit) * 100)),
      formatted: formatBytes(totalSizeBytes)
    };
  }, [activeWorkspace]);

  const NavContent = () => (
    <>
      <div className="space-y-1">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label={t('dashboard')}
          active={isActive('/dashboard')}
          onClick={() => navigate('/dashboard')}
        />
        <NavItem
          icon={<Plus size={20} />}
          label={t('add_event')}
          active={isActive('/create-event')}
          onClick={() => navigate('/create-event')}
        />
        <NavItem
          icon={<Calendar size={20} />}
          label={t('my_events')}
          active={isActive('/my-events')}
          onClick={() => navigate('/my-events')}
        />
        <NavItem
          icon={<CalendarDays size={20} />}
          label={t('studio_calendar')}
          active={isActive('/studio-calendar')}
          onClick={() => navigate('/studio-calendar')}
        />
        <NavItem
          icon={<Users size={20} />}
          label={t('team_members')}
          active={isActive('/team')}
          onClick={() => navigate('/team')}
        />
        <NavItem
          icon={<Palette size={20} />}
          label={t('branding')}
          active={isActive('/branding')}
          onClick={() => navigate('/branding')}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-shrink-0 flex-col h-full shadow-sm">
        {/* Workspace Selector Bridge */}
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={() => navigate('/workspaces')}
            className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group mb-4"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Grid size={20} />
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('active_studio')}</div>
              <div className="text-sm font-bold text-slate-900 truncate">{activeWorkspace?.name || 'Select Studio'}</div>
            </div>
            <ChevronRight size={14} className={cn("text-slate-400 group-hover:translate-x-0.5 transition-transform", isRTL && "rotate-180")} />
          </button>

          {/* Sidebar Storage Widget */}
          {activeWorkspace && (
            <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-500">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Storage {storageStats.percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-2 shadow-inner">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${storageStats.percentage}%` }}
                />
              </div>
              <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter uppercase">
                {storageStats.formatted} / 1GB
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
          <NavContent />
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-3">
          <div className="px-3">
            <NavItem
              icon={<Settings size={20} />}
              label={t('settings')}
              active={isActive('/settings')}
              onClick={() => navigate('/settings?origin=studio')}
            />
          </div>
          <div className="px-3 pb-2">
            <LanguageSwitcher className="w-full" direction="up" />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm font-bold text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} className={isRTL ? "ml-3" : "mr-3"} />
            {t('log_out')}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-4 py-2 flex justify-between items-center pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavItem
          icon={<LayoutDashboard size={20} />}
          label={t('dashboard')}
          active={isActive('/dashboard')}
          onClick={() => navigate('/dashboard')}
        />
        <MobileNavItem
          icon={<Calendar size={20} />}
          label={t('my_events')}
          active={isActive('/my-events')}
          onClick={() => navigate('/my-events')}
        />
        <div className="-mt-10">
          <button
            onClick={() => navigate('/workspaces')}
            className="bg-[#0F172A] text-white p-4 rounded-full shadow-xl hover:bg-[#1E293B] transition-all active:scale-90 border-4 border-white"
          >
            <Grid size={24} />
          </button>
        </div>
        <MobileNavItem
          icon={<Users size={20} />}
          label={t('team_members')}
          active={isActive('/team')}
          onClick={() => navigate('/team')}
        />
        <MobileNavItem
          icon={<Settings size={20} />}
          label={t('settings')}
          active={isActive('/settings')}
          onClick={() => navigate('/settings?origin=studio')}
        />
      </div>
    </>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  onClick,
  showPulse = false
}: {
  icon: React.ReactNode,
  label: string,
  active?: boolean,
  onClick?: () => void,
  showPulse?: boolean
}) => {
  const { isRTL } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center px-3 py-2.5 text-sm font-bold rounded-lg transition-all relative group",
        active
          ? "bg-slate-100 text-slate-900 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn("transition-colors", isRTL ? "ml-3" : "mr-3", active ? "text-slate-900" : "text-slate-400")}>
        {icon}
      </span>
      <span className="truncate flex-1 text-left">{label}</span>
      {showPulse && (
        <span className="absolute right-3 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
      )}
    </button>
  );
};

const MobileNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center w-16 space-y-1 transition-colors",
      active ? "text-slate-900" : "text-slate-400"
    )}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);
