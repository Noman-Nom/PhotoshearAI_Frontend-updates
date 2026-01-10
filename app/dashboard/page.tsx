
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Users, 
  LayoutDashboard, 
  PlayCircle, 
  FileText, 
  Sparkles, 
  Zap, 
  Search, 
  Bell, 
  ChevronDown, 
  Plus, 
  Ticket,
  X,
  TrendingUp,
  CheckCircle2,
  Mail,
  Paperclip,
  Image as ImageIcon,
  Film,
  MessageSquare,
  Send,
  Clock,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { cn } from '../../utils/cn';
import { Sidebar } from '../../components/shared/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { SHARED_EVENTS } from '../../constants';
import { formatBytes } from '../../utils/formatters';

interface TicketComment {
  id: string;
  author: string;
  text: string;
  date: string;
  isSupport?: boolean;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  description?: string;
  stepsToReproduce?: string;
  mediaName?: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ticketMediaRef = useRef<HTMLInputElement>(null);

  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isSubmittingFeature, setIsSubmittingFeature] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  // Ticket View & Comments State
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [ticketComments, setTicketComments] = useState<Record<string, TicketComment[]>>({});
  const [newTicketComment, setNewTicketComment] = useState('');
  
  const [selectedGuide, setSelectedGuide] = useState<{ 
    title: string; 
    type: 'video' | 'article'; 
    src?: string; 
    description: string;
    content?: React.ReactNode; 
  } | null>(null);
  
  const [newTicket, setNewTicket] = useState<{
      subject: string;
      category: string;
      priority: string;
      description: string;
      stepsToReproduce: string;
      media: File | null;
  }>({ 
      subject: '', 
      category: 'Issue', 
      priority: 'Medium', 
      description: '',
      stepsToReproduce: '',
      media: null
  });

  const [featureForm, setFeatureForm] = useState({
      title: '',
      category: 'New Feature',
      priority: 'Low - Nice to have',
      email: user?.email || '',
      description: '',
      useCase: ''
  });

  const workspaceEvents = SHARED_EVENTS.filter(e => e.workspaceId === activeWorkspace?.id);
  const activeEventsCount = workspaceEvents.length;
  const totalSizeBytes = workspaceEvents.reduce((acc, event) => acc + event.totalSizeBytes, 0);
  const storageUsedValue = formatBytes(totalSizeBytes);
  
  const storageLimit = 1024 * 1024 * 1024; // 1 GB
  const storagePercentage = Math.min(100, Math.round((totalSizeBytes / storageLimit) * 100));

  const uniqueCollaborators = new Set<string>();
  workspaceEvents.forEach(event => {
    event.collaborators.forEach(collabUrl => uniqueCollaborators.add(collabUrl));
  });
  const teamMemberCount = uniqueCollaborators.size + (activeWorkspace ? activeWorkspace.membersCount : 0);

  const handleFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeature(true);
    setTimeout(() => {
        setIsSubmittingFeature(false);
        setIsFeatureModalOpen(false);
        setFeatureForm({
            title: '',
            category: 'New Feature',
            priority: 'Low - Nice to have',
            email: user?.email || '',
            description: '',
            useCase: ''
        });
    }, 1500);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTicket.subject.trim()) return;
      const ticketId = Date.now().toString();
      const ticket: SupportTicket = {
          id: ticketId,
          subject: newTicket.subject,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'Open',
          date: 'Just now',
          description: newTicket.description,
          stepsToReproduce: newTicket.stepsToReproduce,
          mediaName: newTicket.media?.name
      };
      setTickets(prev => [ticket, ...prev]);
      
      // Initialize empty comments for this ticket
      setTicketComments(prev => ({
        ...prev,
        [ticketId]: []
      }));

      setIsTicketModalOpen(false);
      setNewTicket({ subject: '', category: 'Issue', priority: 'Medium', description: '', stepsToReproduce: '', media: null });
  };

  const handleAddTicketComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketComment.trim() || !viewingTicket) return;

    const comment: TicketComment = {
      id: Date.now().toString(),
      author: `${user?.firstName} ${user?.lastName}`,
      text: newTicketComment,
      date: 'Just now'
    };

    setTicketComments(prev => ({
      ...prev,
      [viewingTicket.id]: [...(prev[viewingTicket.id] || []), comment]
    }));

    setNewTicketComment('');

    // Simulate Support response
    setTimeout(() => {
      const supportReply: TicketComment = {
        id: (Date.now() + 1).toString(),
        author: 'Support Agent',
        text: 'Thank you for the update. Our technical team is reviewing this and we will get back to you shortly.',
        date: 'A moment ago',
        isSupport: true
      };
      setTicketComments(prev => ({
        ...prev,
        [viewingTicket.id]: [...(prev[viewingTicket.id] || []), supportReply]
      }));
    }, 2000);
  };

  const handleTicketFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewTicket({ ...newTicket, media: e.target.files[0] });
    }
  };

  const removeTicketMedia = () => {
    setNewTicket({ ...newTicket, media: null });
    if (ticketMediaRef.current) ticketMediaRef.current.value = '';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="min-w-0 text-start">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">
              {t('good_morning')}, {user?.firstName || 'User'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block mt-0.5">
              {t('active_studio')}: <span className="text-slate-700">{activeWorkspace?.name || 'No Active Studio'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 md:space-x-6">
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} pr-6 border-r border-slate-200 hidden lg:flex`}>
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t('storage')} <span className="text-slate-900 ml-1">{storagePercentage}%</span></div>
                <div className="text-[10px] font-semibold text-slate-400 font-mono">{storageUsedValue} / 1GB</div>
              </div>
              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-1'} md:space-x-4 text-slate-400`}>
              {/* Email Sim Trigger */}
              <button 
                onClick={() => navigate('/email-simulation', { state: { from: location.pathname + location.search } })}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all shadow-sm group mr-2"
                title="Open Email Simulation"
              >
                <div className="relative">
                  <Mail size={16} className="text-indigo-600" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse border-2 border-indigo-50"></span>
                </div>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest hidden sm:block">Email Sim</span>
              </button>

              <button className="hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"><Search size={20} /></button>
              <button className="hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"><Bell size={20} /></button>
            </div>

            <div className={`flex items-center gap-3 ${isRTL ? 'pr-2' : 'pl-2'} group cursor-pointer`}>
              <div className="h-9 w-9 bg-slate-100 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
                <img src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} alt="Profile" className="h-full w-full object-cover" />
              </div>
              <button className="text-slate-400 group-hover:text-slate-900 transition-colors hidden md:block">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Hero Section */}
            <div className="bg-[#0F172A] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl text-start">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-bold text-blue-200 mb-6 border border-white/10 tracking-[0.2em] uppercase">
                  ✨ {t('active_studio')}: {activeWorkspace?.name || 'GET STARTED'}
                </span>
                <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">{t('ready_to_create')}</h2>
                <p className="text-slate-400 mb-10 max-w-lg text-sm md:text-base leading-relaxed font-medium">
                  {t('manage_events')}
                </p>
                <div className="flex wrap gap-4">
                  <Button 
                    className="bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-bold uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl transition-all active:scale-95"
                    onClick={() => navigate('/create-event')}
                  >
                    <Plus size={16} className={isRTL ? "ml-2" : "mr-2"} strokeWidth={3} />
                    {t('add_new_event')}
                  </Button>
                </div>
              </div>
              
              {/* Hero Graphic */}
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-1/3 h-4/5 hidden lg:block opacity-90 ${isRTL ? 'pl-10' : 'pr-10'}`}>
                 <div className="bg-slate-800/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 h-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <div className="w-20 h-2.5 bg-white/20 rounded-full"></div>
                            <div className="w-12 h-2.5 bg-white/10 rounded-full"></div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-[0_0_30px_rgba(37,99,235,0.6)]">
                            {storagePercentage}%
                        </div>
                    </div>
                    <div className="flex items-end space-x-2.5 h-36 mb-4">
                        <div className="w-1/5 h-[15%] bg-blue-500/20 rounded-xl transition-all duration-500 hover:h-[40%]"></div>
                        <div className="w-1/5 h-[35%] bg-blue-500/40 rounded-xl transition-all duration-500 hover:h-[60%]"></div>
                        <div className="w-1/5 h-[25%] bg-blue-500/20 rounded-xl transition-all duration-500 hover:h-[50%]"></div>
                        <div className="w-1/5 h-[65%] bg-blue-500 rounded-xl transition-all duration-500 hover:h-[85%] shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
                        <div className="w-1/5 h-[45%] bg-blue-500/30 rounded-xl transition-all duration-500 hover:h-[70%]"></div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <TrendingUp size={14} className="text-emerald-400" />
                            Live Metrics
                        </div>
                        <div className="px-2 py-0.5 bg-blue-500/20 rounded-md flex items-center justify-center border border-blue-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <MetricCard 
                icon={<Calendar className="text-slate-900" size={24} />} 
                iconBg="bg-slate-100"
                value={activeEventsCount.toString()} 
                label={t('studio_events')}
                badge={activeEventsCount > 0 ? "LIVE" : "IDLE"}
                badgeColor={activeEventsCount > 0 ? "text-blue-600 bg-blue-50" : "text-slate-400 bg-slate-50"}
              />
              <MetricCard 
                icon={<Users className="text-slate-900" size={24} />} 
                iconBg="bg-slate-100"
                value={teamMemberCount.toString()} 
                label={t('team_members')}
                badge="SECURE"
                badgeColor="text-emerald-600 bg-emerald-50"
              />
              <MetricCard 
                icon={<Zap className="text-slate-900" size={24} />} 
                iconBg="bg-slate-100"
                value={storageUsedValue} 
                label={t('storage_used')}
                subtext="limit 1GB"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-10">
                {/* Get Started Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t('get_started_learn')}</h3>
                    <a href="#" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest border-b-2 border-blue-100 hover:border-blue-600 transition-all">View all guides &gt;</a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div 
                      onClick={() => setSelectedGuide({
                        title: "Product Walkthrough",
                        type: "video",
                        src: "https://www.youtube.com/embed/lxRwEPvL-mQ",
                        description: "Watch the 5-min video to master the basics of the dashboard and event creation."
                      })}
                      className={`p-6 rounded-[2rem] border-2 border-slate-100 bg-white flex ${isRTL ? 'space-x-reverse' : ''} items-start space-x-6 hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer group text-start`}
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all flex-shrink-0">
                        <PlayCircle className="text-slate-400 group-hover:text-blue-600 transition-colors" size={28} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Visual Walkthrough</h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">Learn to master the event workflow in 5 mins.</p>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setSelectedGuide({
                        title: "Advanced Permissions Guide",
                        type: "article",
                        description: "Learn how to manage studio roles and access levels securely for each studio.",
                        content: (
                            <div className="space-y-5 text-sm text-slate-600 text-start leading-relaxed">
                                <p>Workspace-specific studio management allows you to control exactly who sees what studio and what they can do within it.</p>
                                <div className="space-y-3">
                                  <div className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /></div>
                                    <p className="font-medium">Assign members to specific studios with distinct roles.</p>
                                  </div>
                                  <div className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /></div>
                                    <p className="font-medium">Set fine-grained event permissions (View only vs Upload).</p>
                                  </div>
                                  <div className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /></div>
                                    <p className="font-medium">Manage administrative access at the workspace level.</p>
                                  </div>
                                </div>
                            </div>
                        )
                      })}
                      className={`p-6 rounded-[2rem] border-2 border-slate-100 bg-white flex ${isRTL ? 'space-x-reverse' : ''} items-start space-x-6 hover:border-emerald-200 hover:shadow-xl transition-all cursor-pointer group text-start`}
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all flex-shrink-0">
                        <FileText className="text-slate-400 group-hover:text-emerald-600 transition-colors" size={28} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Access Logic</h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">Learn how to manage team roles effectively.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Latest Updates Section */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-6 text-start">System Status</h3>
                   <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-10 shadow-sm relative overflow-hidden group">
                      <div className="py-12 text-center text-slate-400 relative z-10">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-50 group-hover:rotate-12 transition-all">
                            <CheckCircle2 size={32} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-widest">All systems operational</p>
                      </div>
                      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Tickets Widget */}
                <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className={`flex items-center ${isRTL ? 'gap-x-reverse' : ''} gap-3`}>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Ticket size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{t('my_tickets')}</h3>
                        </div>
                        <button 
                            onClick={() => setIsTicketModalOpen(true)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-[0.15em]"
                        >
                            {t('raise_ticket')}
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {tickets.length === 0 ? (
                            <div className="py-12 text-center text-slate-300">
                                <p className="text-[10px] font-bold uppercase tracking-widest">No Active Tickets</p>
                            </div>
                        ) : (
                            tickets.map(t_item => (
                                <div 
                                    key={t_item.id} 
                                    onClick={() => setViewingTicket(t_item)}
                                    className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-200 transition-all cursor-pointer group text-start"
                                >
                                    <div className={`min-w-0 ${isRTL ? 'pl-3' : 'pr-3'}`}>
                                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors mb-1">{t_item.subject}</h4>
                                        <p className={`text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center ${isRTL ? 'gap-x-reverse' : ''} gap-2`}>
                                            {t_item.category} 
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span> 
                                            {t_item.date}
                                        </p>
                                    </div>
                                    <span className={cn(
                                        "text-[8px] font-bold px-2 py-1 rounded-lg border flex-shrink-0 transition-colors uppercase tracking-widest",
                                        t_item.status === 'Open' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        t_item.status === 'In Progress' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>
                                        {t_item.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Feature Lab Widget */}
                <div className="bg-[#0F172A] rounded-[2rem] p-8 text-white text-start shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} mb-6`}>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all">
                          <Sparkles size={20} className="text-purple-400" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-tight">{t('feature_lab')}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">Have an idea for a tool that would help your studio? Suggest it below.</p>
                    <Button 
                        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 h-11 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                        onClick={() => setIsFeatureModalOpen(true)}
                    >
                        {t('request_feature')}
                    </Button>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] group-hover:bg-blue-500/20 transition-all"></div>
                </div>

                {/* Customize Layout Widget */}
                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center bg-white h-auto transition-all hover:border-slate-400 hover:bg-slate-50/30 group">
                   <div className="h-14 w-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-6 shadow-sm text-slate-400 group-hover:text-slate-900 group-hover:rotate-12 transition-all">
                      <LayoutDashboard size={28} strokeWidth={2.5} />
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{t('customize_layout')}</h4>
                   <p className="text-xs text-slate-400 mt-2 mb-8 max-w-[200px] leading-relaxed font-medium">Rearrange widgets to suit your specific workflow.</p>
                   <Button variant="outline" className="h-10 text-[10px] font-bold uppercase tracking-widest px-8 rounded-xl border-slate-200 hover:bg-white hover:shadow-lg transition-all">Edit Dashboard</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Guide Modal */}
      <Modal 
        isOpen={!!selectedGuide} 
        onClose={() => setSelectedGuide(null)} 
        title={selectedGuide?.title.toUpperCase() || ''}
        className="max-w-3xl w-full"
      >
        <div className="space-y-8 py-2">
            {selectedGuide?.type === 'video' && selectedGuide.src && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border-4 border-slate-100 shadow-2xl">
                    <iframe 
                        className="w-full h-full" 
                        src={selectedGuide.src} 
                        title={selectedGuide.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            )}
            
            <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{selectedGuide?.description}</p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  {selectedGuide?.content}
                </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button onClick={() => setSelectedGuide(null)} className="bg-[#0F172A] px-10 h-12 text-[11px] font-bold uppercase tracking-widest rounded-xl">Got it</Button>
            </div>
        </div>
      </Modal>

      {/* Support Ticket Modal (Raise Ticket) */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title={t('raise_ticket')}
        className="max-w-xl w-full"
      >
        <form onSubmit={handleTicketSubmit} className="space-y-6 py-2">
            <Input 
                label={t('ticket_subject')} 
                placeholder="Brief summary of the issue"
                value={newTicket.subject}
                onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                required
                className="font-bold"
            />
            
            <div className="grid grid-cols-2 gap-6">
                <Select 
                    label={t('ticket_category')}
                    value={newTicket.category}
                    onChange={e => setNewTicket({...newTicket, category: e.target.value})}
                    options={[
                        { label: 'Technical Issue', value: 'Issue' },
                        { label: 'Billing / Account', value: 'Billing' },
                        { label: 'Other', value: 'Other' }
                    ]}
                />
                <Select 
                    label={t('ticket_priority')}
                    value={newTicket.priority}
                    onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                    options={[
                        { label: 'Low', value: 'Low' },
                        { label: 'Medium', value: 'Medium' },
                        { label: 'High', value: 'High' }
                    ]}
                />
            </div>

            <TextArea 
                label={t('ticket_description')}
                placeholder="Describe what's happening..."
                value={newTicket.description}
                onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                className="font-medium"
            />

            <TextArea 
                label={t('ticket_steps')}
                placeholder="1. Clicked dashboard..."
                value={newTicket.stepsToReproduce}
                onChange={e => setNewTicket({...newTicket, stepsToReproduce: e.target.value})}
                className="font-medium"
            />

            {/* Media Attachment Field */}
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-medium leading-none text-slate-700 block uppercase tracking-wider">Attach Media</label>
                <div 
                    onClick={() => ticketMediaRef.current?.click()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50",
                        newTicket.media ? "border-blue-500 bg-blue-50/30" : "border-slate-200"
                    )}
                >
                    <input 
                        type="file" 
                        ref={ticketMediaRef} 
                        className="hidden" 
                        accept="image/*,video/*" 
                        onChange={handleTicketFileChange} 
                    />
                    {newTicket.media ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                    {newTicket.media.type.startsWith('image') ? <ImageIcon size={16} className="text-blue-500" /> : <Film size={16} className="text-purple-500" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{newTicket.media.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase">{formatBytes(newTicket.media.size)}</p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); removeTicketMedia(); }}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-2">
                            <Paperclip size={20} className="text-slate-300" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Screenshot or Video</p>
                            <p className="text-[10px] text-slate-400 font-medium">PNG, JPG, MP4 up to 10MB</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={() => setIsTicketModalOpen(false)} className="flex-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                <Button type="submit" className="flex-1 bg-[#0F172A] h-12 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-xl">{t('submit_ticket')}</Button>
            </div>
        </form>
      </Modal>

      {/* View Ticket Modal (Open Ticket Popup) - REFINED UI TO FIX MESSY LAYOUT */}
      <Modal
        isOpen={!!viewingTicket}
        onClose={() => setViewingTicket(null)}
        title="TICKET DETAILS"
        className="max-w-3xl w-full"
        contentClassName="p-0 overflow-hidden flex flex-col h-[85vh]"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 space-y-6 bg-slate-50/30">
          {/* Header Info - Responsive & Clean */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-start space-y-2 min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight break-words">{viewingTicket?.subject}</h2>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{viewingTicket?.category}</span>
                <span className="hidden sm:inline opacity-30">•</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {viewingTicket?.date}</span>
                <span className="hidden sm:inline opacity-30">•</span>
                <span className={cn(
                  "px-2 py-1 rounded border",
                  viewingTicket?.priority === 'High' ? "bg-red-50 text-red-600 border-red-100" :
                  viewingTicket?.priority === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                  "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  {viewingTicket?.priority} PRIORITY
                </span>
              </div>
            </div>
            <div className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm self-start sm:self-auto",
              viewingTicket?.status === 'Open' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
            )}>
              {viewingTicket?.status}
            </div>
          </div>

          {/* Ticket Body Content - Using flexible layout with word-break fixes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap break-words">
                  {viewingTicket?.description || "No description provided."}
                </p>
              </div>
              
              {viewingTicket?.stepsToReproduce && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Steps to Reproduce</h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap break-words overflow-hidden">
                    {viewingTicket.stepsToReproduce}
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-5">
              {viewingTicket?.mediaName && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Attached Media</h4>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                      <ImageIcon size={16} className="text-blue-500" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 truncate">{viewingTicket.mediaName}</span>
                  </div>
                </div>
              )}

              <div className="bg-[#2563EB] rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={18} className="text-blue-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest">System Info</span>
                    </div>
                    <p className="text-[11px] text-blue-50 leading-relaxed opacity-90 font-medium">
                    Diagnostic logs have been captured. Response time: ~24hrs.
                    </p>
                 </div>
                 <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200/60" />

          {/* Communication Area - Polished bubbles */}
          <div className="text-start space-y-6">
            <div className="flex items-center gap-2 mb-2 px-2">
              <MessageSquare size={18} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Conversation History</h3>
            </div>

            <div className="space-y-6 px-2 pb-10">
              {(ticketComments[viewingTicket?.id || ''] || []).length === 0 ? (
                <div className="py-16 bg-white/50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-300">
                  <p className="text-[10px] font-black uppercase tracking-widest">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                (ticketComments[viewingTicket?.id || ''] || []).map((comment) => (
                  <div key={comment.id} className={cn(
                    "flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-300",
                    comment.isSupport ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-white",
                      comment.isSupport ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {comment.isSupport ? <ShieldCheck size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div className={cn(
                      "flex-1 max-w-[85%] sm:max-w-[70%]",
                      comment.isSupport ? "text-right" : "text-left"
                    )}>
                      <div className={cn(
                        "flex items-center gap-2 mb-2",
                        comment.isSupport ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{comment.author}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{comment.date}</span>
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed break-words border",
                        comment.isSupport 
                          ? "bg-blue-50 text-blue-900 rounded-tr-none border-blue-100" 
                          : "bg-white text-slate-700 rounded-tl-none border-slate-100"
                      )}>
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Comment Input Footer - Fixed positioning */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex-shrink-0 z-10 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleAddTicketComment} className="flex gap-4">
             <div className="flex-1 relative group">
                <input 
                  type="text"
                  placeholder="Type your message to support..."
                  value={newTicketComment}
                  onChange={e => setNewTicketComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 ps-6 pe-16 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-start shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!newTicketComment.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 disabled:opacity-20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
             </div>
          </form>
        </div>
      </Modal>

      {/* Feature Request Modal */}
      <Modal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
        title={t('request_feature')}
        className="max-w-xl w-full"
      >
        <form onSubmit={handleFeatureSubmit} className="space-y-6 py-2 text-start">
            <Input 
                label={t('feature_title')}
                placeholder="Name your feature idea"
                value={featureForm.title}
                onChange={e => setFeatureForm({...featureForm, title: e.target.value})}
                required
                className="font-bold"
            />
            
            <TextArea 
                label={t('feature_description')}
                placeholder="Explain the concept..."
                value={featureForm.description}
                onChange={e => setFeatureForm({...featureForm, description: e.target.value})}
                required
                className="font-medium"
            />

            <TextArea 
                label={t('feature_use_case')}
                placeholder="How would this help your studio?"
                value={featureForm.useCase}
                onChange={e => setFeatureForm({...featureForm, useCase: e.target.value})}
                className="font-medium"
            />

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={() => setIsFeatureModalOpen(false)} className="flex-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                <Button 
                    type="submit" 
                    className="flex-1 bg-[#0F172A] h-12 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-xl" 
                    isLoading={isSubmittingFeature}
                >
                    {t('submit_request')}
                </Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

const MetricCard = ({ icon, iconBg, value, label, badge, badgeColor, subtext }: any) => {
  const { isRTL } = useTranslation();
  return (
    <Card className="p-8 flex flex-col justify-between h-44 hover:shadow-2xl transition-all duration-500 text-start group border-none shadow-sm bg-white rounded-[2.5rem]">
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 duration-500 shadow-sm border border-slate-100", iconBg)}>{icon}</div>
        {badge && <span className={cn("text-[9px] font-bold px-3 py-1.5 rounded-lg ms-2 whitespace-nowrap uppercase tracking-[0.15em] shadow-sm", badgeColor)}>{badge}</span>}
      </div>
      <div>
        <div className={`flex items-baseline ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
          <h3 className="text-3xl font-bold text-slate-900 leading-none tracking-tight">{value}</h3>
          {subtext && <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest font-mono">{subtext}</span>}
        </div>
        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </Card>
  );
}

export default DashboardPage;
