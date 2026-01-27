
import React, { useMemo } from 'react';
import { Sidebar } from '../../components/shared/Sidebar';
import { CalendarView } from '../../components/shared/CalendarView';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useEvents } from '../../contexts/EventsContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const StudioCalendarPage: React.FC = () => {
  const { activeWorkspace, workspaces } = useWorkspace();
  const { events } = useEvents();
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();

  // Transform API events to calendar format
  const studioEvents = useMemo(() => {
    return events.map(e => ({
      id: e.id,
      workspaceId: e.workspace_id,
      title: e.title,
      date: e.event_date,
      status: e.status === 'published' ? 'Published' : 'Draft',
      coverUrl: e.cover_url || '',
      totalPhotos: e.total_photos,
      totalVideos: e.total_videos,
      totalSizeBytes: e.total_size_bytes,
      collections: [],
      collaborators: []
    }));
  }, [events]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20">
          <div className="min-w-0 text-start">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate uppercase tracking-tight leading-none">
              {t('studio_calendar')}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block mt-1.5">
              Scheduling for <span className="text-slate-700">{activeWorkspace?.name || 'Platform Hub'}</span>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col custom-scrollbar bg-slate-50/50">
          <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col min-h-[700px] md:min-h-0">
            <CalendarView events={studioEvents} workspaces={workspaces} isGlobal={false} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudioCalendarPage;
