import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Grid,
  List,
  AlertTriangle,
  ChevronDown,
  LayoutGrid,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Sidebar } from '../../components/shared/Sidebar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EventCard, EventData } from './components/EventCard';
import { EventListItem } from './components/EventListItem';
import { cn } from '../../utils/cn';
import { formatBytes } from '../../utils/formatters';
import { useTeam } from '../../contexts/TeamContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useEvents } from '../../contexts/EventsContext';
import { TeamMember } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { SkeletonEventCard } from '../../components/ui/Skeleton';

const MyEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  const { members, updateMember } = useTeam();
  const { activeWorkspace } = useWorkspace();
  const { events: apiEvents, isLoading, deleteEvent, refreshEvents } = useEvents();

  const [filter, setFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
  const [searchQuery, setSearchQuery] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [targetCollaboratorEvent, setTargetCollaboratorEvent] = useState<EventData | null>(null);
  const [collaboratorSearch, setCollaboratorSearch] = useState('');

  // Transform API events to EventData format
  const events: EventData[] = useMemo(() => {
    return apiEvents.map(ev => ({
      id: ev.id,
      title: ev.title,
      date: ev.event_date,
      status: ev.status === 'published' ? 'Published' : 'Draft',
      imageUrl: ev.cover_url || '',
      stats: {
        photos: Math.max(ev.total_photos || 0, ev.collections?.reduce((sum, c) => sum + (c.photo_count || 0), 0) || 0),
        videos: Math.max(ev.total_videos || 0, ev.collections?.reduce((sum, c) => sum + (c.video_count || 0), 0) || 0),
        size: formatBytes(ev.total_size_bytes || 0)
      },
      collaborators: ev.collaborators?.map(c =>
        c.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.first_name + ' ' + c.last_name)}&background=random&color=fff`
      ) || []
    }));
  }, [apiEvents]);

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'All' ? true : event.status === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      setIsDeleting(true);
      try {
        await deleteEvent(eventToDelete);
        setIsDeleteModalOpen(false);
        setEventToDelete(null);
      } catch (err) {
        console.error('Failed to delete event:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleOpenCollaboratorModal = (id: string) => {
    const event = events.find(e => e.id === id);
    if (event) {
      setTargetCollaboratorEvent(event);
      setCollaboratorSearch('');
      setIsCollaboratorModalOpen(true);
    }
  };

  // NOTE: Collaborator add/remove will need to be updated to use collaboratorsApi
  // For now, these are placeholder implementations that log the action
  const handleAddCollaborator = (member: TeamMember) => {
    if (!targetCollaboratorEvent) return;
    console.log('TODO: Add collaborator via API', member.id, 'to event', targetCollaboratorEvent.id);
    // TODO: Use collaboratorsApi.add(targetCollaboratorEvent.id, member.id)
  };

  const handleRemoveCollaborator = (member: TeamMember) => {
    if (!targetCollaboratorEvent) return;
    console.log('TODO: Remove collaborator via API', member.id, 'from event', targetCollaboratorEvent.id);
    // TODO: Use collaboratorsApi.remove(targetCollaboratorEvent.id, member.id)
  };

  const handleUploadClick = (id: string) => {
    const event = apiEvents.find(e => e.id === id);
    if (event) {
      navigate(`/events/${event.slug}`);
    }
  };

  const filteredTeamMembers = members.filter(m =>
    m.firstName.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(collaboratorSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white px-8 pt-8 pb-6 border-b border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div className="text-start">
              <h1 className="text-xl font-bold text-slate-900">{t('my_events_title')}</h1>
              <p className="text-sm text-slate-500">{t('my_events_subtitle')}</p>
            </div>
            <Button onClick={() => navigate('/create-event')} className="bg-[#0F172A] text-white font-bold h-11 px-6 shadow-md hover:bg-slate-800">
              <Plus className={isRTL ? "ml-2" : "mr-2"} size={20} strokeWidth={3} /> {t('add_new_event')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px] max-w-sm">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('search_events_placeholder')}
                className={cn("w-full py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 transition-all text-start", isRTL ? "pr-10 pl-4" : "pl-10 pr-4")}
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              {(['All', 'Published', 'Draft'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                    filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {t(f.toLowerCase())}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 uppercase tracking-wider">
              <LayoutGrid size={16} className="text-slate-400" />
              {t('sort_newest')}
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setViewMode('Grid')}
                className={cn("p-2 transition-colors", viewMode === 'Grid' ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50")}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('List')}
                className={cn("p-2 transition-colors", viewMode === 'List' ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50")}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/20">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SkeletonEventCard key={i} />
              ))}
            </div>
          ) : viewMode === 'Grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <button
                onClick={() => navigate('/create-event')}
                className="group bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center aspect-square transition-all hover:border-slate-400 hover:shadow-xl"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Plus size={32} className="text-slate-300" />
                </div>
                <h4 className="font-black text-slate-900 text-lg">{t('add_new_event')}</h4>
                <p className="text-sm text-slate-400 mt-1">{t('start_new_collection')}</p>
              </button>

              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={handleDeleteClick}
                  onEdit={id => navigate(`/create-event?id=${id}`)}
                  onAddCollaborator={handleOpenCollaboratorModal}
                  onShare={id => navigate(`/share-event/${id}`)}
                  onUpload={handleUploadClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredEvents.map(event => (
                <EventListItem
                  key={event.id}
                  event={event}
                  onDelete={handleDeleteClick}
                  onEdit={id => navigate(`/create-event?id=${id}`)}
                  onAddCollaborator={handleOpenCollaboratorModal}
                  onShare={id => navigate(`/share-event/${id}`)}
                  onUpload={handleUploadClick}
                />
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  {t('no_events_found')}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
        title={t('add_collaborator_modal_title')}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={16} />
            <input type="text" placeholder={t('search_team_members_placeholder')} value={collaboratorSearch} onChange={e => setCollaboratorSearch(e.target.value)} className={cn("w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-start", isRTL ? "pr-10 pl-4" : "pl-10 pr-4")} />
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredTeamMembers.map(member => {
              const isAdded = member.allowedEventIds?.includes(targetCollaboratorEvent?.id || '') ||
                targetCollaboratorEvent?.collaborators.some(url =>
                  url.includes(encodeURIComponent(member.firstName + ' ' + member.lastName))
                );

              return (
                <div key={member.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-start">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold", member.avatarColor)}>{member.initials}</div>
                    <div><h4 className="text-xs font-bold text-slate-900">{member.firstName} {member.lastName}</h4><p className="text-[10px] text-slate-500">{member.email}</p></div>
                  </div>

                  {isAdded ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">
                        <Check size={12} />
                        {t('added_label')}
                      </div>
                      <button
                        onClick={() => handleRemoveCollaborator(member)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 rounded-md"
                        title="Remove from event"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddCollaborator(member)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                    >
                      {t('add_to_event_btn')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('delete_event_modal_title')}>
        <div className="text-center py-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-slate-500">{t('delete_event_confirm_text')}</p>
          <div className="flex gap-4 mt-8">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setIsDeleteModalOpen(false)}>{t('cancel')}</Button>
            <Button className="flex-1 bg-red-600 text-white font-bold" onClick={confirmDelete}>{t('delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyEventsPage;
