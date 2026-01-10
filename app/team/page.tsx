
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../../components/shared/Sidebar';
import { 
  Search, 
  SearchX,
  Plus, 
  Calendar, 
  Mail, 
  Phone, 
  Pencil, 
  Trash2, 
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  Check,
  RefreshCw,
  Lock,
  X,
  ExternalLink,
  Shield,
  User,
  Users,
  Clock,
  Briefcase,
  ChevronRight,
  UserPlus,
  // Added missing UserMinus import
  UserMinus,
  ArrowRight,
  UserCheck,
  MessageSquare,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useTeam } from '../../contexts/TeamContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TeamMember, PendingMember } from '../../types';
import { SHARED_EVENTS } from '../../constants';
import { useTranslation } from '../../contexts/LanguageContext';

const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { 
    members, 
    pendingMembers, 
    roles,
    updateMember, 
    deleteMember, 
    inviteMember, 
    updatePendingMember, 
    deletePendingMember, 
    resendInvitation 
  } = useTeam();

  const { activeWorkspace, workspaces } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'Registered' | 'Pending'>('Registered');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'EXISTING' | 'INVITE'>('EXISTING');
  const [globalSearch, setGlobalSearch] = useState('');
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', role: 'Studio Member', message: '' });
  const [selectedStudioRoles, setSelectedStudioRoles] = useState<Record<string, string>>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailMember, setSelectedDetailMember] = useState<TeamMember | PendingMember | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleEditValue, setRoleEditValue] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'Registered' | 'Pending' } | null>(null);

  const studioLevelRoles = useMemo(() => {
    return roles.filter(r => r.level === 'studio' && !r.isSystem);
  }, [roles]);

  const canAddMembers = useMemo(() => {
    if (!user || !activeWorkspace) return false;
    const currentUserProfile = members.find(m => m.email === user.email);
    const role = currentUserProfile?.role || 'Studio Member';
    return ['Owner', 'SuperAdmin / Owner', 'Account Manager', 'Studio Manager'].includes(role);
  }, [user, members, activeWorkspace]);

  const studioMembers = useMemo(() => {
    if (!activeWorkspace) return [];
    const wsEvents = SHARED_EVENTS.filter(e => e.workspaceId === activeWorkspace.id);
    const wsEventIds = wsEvents.map(e => e.id);
    return members.filter(m => {
        if (m.isOwner || m.role === 'Owner' || m.role === 'SuperAdmin / Owner') return true;
        if (m.allowedWorkspaceIds?.includes(activeWorkspace.id)) return true;
        return m.allowedEventIds?.some(id => wsEventIds.includes(id));
    });
  }, [members, activeWorkspace]);

  const studioPending = useMemo(() => {
    if (!activeWorkspace) return [];
    return pendingMembers.filter(p => p.allowedWorkspaceIds?.includes(activeWorkspace.id));
  }, [pendingMembers, activeWorkspace]);

  const filteredMembers = studioMembers.filter(m => m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPending = studioPending.filter(m => m.email.toLowerCase().includes(searchQuery.toLowerCase()) || (m.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const listToRender = activeTab === 'Registered' ? filteredMembers : filteredPending;

  const otherGlobalMembers = useMemo(() => {
    const studioEmails = new Set(studioMembers.map(m => m.email));
    return members.filter(m => !studioEmails.has(m.email) && !m.isOwner && m.role !== 'Owner' && m.role !== 'SuperAdmin / Owner');
  }, [members, studioMembers]);

  const filteredGlobalMembers = otherGlobalMembers.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(globalSearch.toLowerCase()) || m.email.toLowerCase().includes(globalSearch.toLowerCase()));

  const handleOpenAddModal = () => { if (!canAddMembers) { alert("Access denied."); return; } setAddMode('EXISTING'); setGlobalSearch(''); setIsAddModalOpen(true); };

  const handleAddExistingToStudio = (member: TeamMember) => {
    if (!activeWorkspace) return;
    const role = selectedStudioRoles[member.id] || 'Studio Member';
    updateMember(member.id, { role: role, allowedWorkspaceIds: Array.from(new Set([...(member.allowedWorkspaceIds || []), activeWorkspace.id])) });
    setIsAddModalOpen(false);
  };

  const handleSendInvite = () => {
    if (!inviteForm.fullName || !inviteForm.email || !inviteForm.role || !activeWorkspace) return;
    const names = inviteForm.fullName.trim().split(' ');
    // FIX: Using user's companyName instead of activeWorkspace.name for the Organization Name field
    inviteMember({ 
      email: inviteForm.email, 
      firstName: names[0], 
      lastName: names.slice(1).join(' '), 
      role: inviteForm.role, 
      accessLevel: 'Full Access', 
      allowedWorkspaceIds: [activeWorkspace.id], 
      org: user?.companyName || 'Photmo Inc.', 
      accessScope: activeWorkspace.name, 
      message: inviteForm.message 
    } as any);
    setIsAddModalOpen(false);
    setActiveTab('Pending');
  };

  const handleOpenDetail = (member: TeamMember | PendingMember) => { setSelectedDetailMember(member); setIsEditingRole(false); setRoleEditValue(member.role || 'Studio Member'); setIsDetailModalOpen(true); };

  const handleUpdateRole = () => {
    if (!selectedDetailMember) return;
    if (activeTab === 'Registered') updateMember(selectedDetailMember.id, { role: roleEditValue });
    else updatePendingMember(selectedDetailMember.id, { role: roleEditValue });
    setSelectedDetailMember({ ...selectedDetailMember, role: roleEditValue });
    setIsEditingRole(false);
  };

  const handleDelete = (member: TeamMember | PendingMember, e?: React.MouseEvent) => { 
    e?.stopPropagation(); 
    const m = member as any;
    // Don't allow removing owners
    if (m.role === 'Owner' || m.role === 'SuperAdmin / Owner' || m.isOwner) return; 
    
    setItemToDelete({ 
        id: member.id, 
        name: isRegistered(member) ? `${member.firstName} ${member.lastName}` : (member.firstName || member.email),
        type: activeTab 
    }); 
    setIsDeleteModalOpen(true); 
    setIsDetailModalOpen(false); 
  };

  const isRegistered = (m: TeamMember | PendingMember): m is TeamMember => {
      return (m as TeamMember).firstName !== undefined;
  };

  const confirmDelete = () => {
    if (!itemToDelete || !activeWorkspace) return;
    
    const wsId = activeWorkspace.id;
    const handleRemoval = (m: any, isPending: boolean) => {
        // Logic: Remove ONLY this studio ID from the user's allowed list
        let currentWS = [...(m.allowedWorkspaceIds || [])].filter(id => id !== wsId);
        
        // Also remove event-level access for events inside this studio
        const wsEventIds = SHARED_EVENTS.filter(e => e.workspaceId === wsId).map(e => e.id);
        const nextEvents = (m.allowedEventIds || []).filter(id => !wsEventIds.includes(id));
        
        if (isPending) {
            updatePendingMember(m.id, { allowedWorkspaceIds: currentWS, allowedEventIds: nextEvents });
        } else {
            updateMember(m.id, { allowedWorkspaceIds: currentWS, allowedEventIds: nextEvents });
        }
    };

    if (itemToDelete.type === 'Registered') { 
        const m = members.find(m => m.id === itemToDelete.id); 
        if (m) handleRemoval(m, false); 
    } else { 
        const p = pendingMembers.find(p => p.id === itemToDelete.id); 
        if (p) handleRemoval(p, true); 
    }
    
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const assignedEvents = selectedDetailMember ? (selectedDetailMember.accessLevel === 'Full Access' ? SHARED_EVENTS.filter(e => e.workspaceId === activeWorkspace?.id) : SHARED_EVENTS.filter(e => selectedDetailMember.allowedEventIds?.includes(e.id))) : [];

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-start">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <header className="bg-white px-4 md:px-8 py-6 border-b border-slate-100 flex-shrink-0">
          <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4", isRTL && "sm:flex-row-reverse")}>
            <div className={cn("text-start", isRTL && "text-right")}>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{t('team_title')}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{activeWorkspace?.name.toUpperCase()} PERSONNEL DIRECTORY</p>
            </div>
            <Button onClick={handleOpenAddModal} className="bg-[#0F172A] text-white font-black uppercase tracking-widest text-[11px] h-12 px-8 shadow-xl hover:bg-slate-800 w-full sm:w-auto rounded-xl transition-all active:scale-95">
              <Plus size={18} className={isRTL ? "ml-2" : "mr-2"} strokeWidth={3} /> {t('add_member')}
            </Button>
          </div>
          <div className={cn("flex flex-col md:flex-row items-center gap-4", isRTL && "md:flex-row-reverse")}>
            <div className={cn("bg-slate-100 p-1 rounded-xl flex w-full md:w-auto overflow-hidden", isRTL && "flex-row-reverse")}>
              {(['Registered', 'Pending'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 md:flex-none px-6 md:px-10 py-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] rounded-lg transition-all", activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                  {tab === 'Registered' ? t('tab_registered') : t('tab_pending')}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-none md:max-w-md w-full">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-4" : "left-4")} size={18} />
              <input type="text" placeholder={t('search_staff_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn("w-full py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-inner text-start", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar">
          <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm min-w-[900px] md:min-w-0">
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left border-collapse", isRTL && "text-right")}>
                <thead>
                  <tr className={cn("border-b border-slate-50 bg-slate-50/50", isRTL && "flex-row-reverse")}>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('name_header')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('role_header')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('stats_header')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('contact_header')}</th>
                    <th className={cn("px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]", isRTL ? "text-left" : "text-right")}>{t('actions_header')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listToRender.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center opacity-60">
                          <SearchX size={48} className="mb-4 text-slate-200" /><p className="text-[11px] font-black uppercase tracking-widest">{t('no_staff_found')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    listToRender.map(member => {
                      const isRegistered = activeTab === 'Registered';
                      const m = member as any;
                      const isOwner = m.role === 'Owner' || m.role === 'SuperAdmin / Owner' || m.isOwner;
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/40 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(member)}>
                          <td className="px-8 py-5">
                            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm flex-shrink-0 ring-4 ring-white transition-transform group-hover:scale-105", (member as any).avatarColor || 'bg-slate-100 text-slate-500')}>{(member as any).initials || (((member as any).firstName?.[0] || '') + ((member as any).lastName?.[0] || '') || member.email.substring(0, 2)).toUpperCase()}</div>
                              <div className={cn("min-w-0 text-start", isRTL && "text-right")}>
                                <h3 className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">{isRegistered ? `${m.firstName} ${m.lastName}` : (m.firstName ? `${m.firstName} ${m.lastName || ''}` : t('invitation_pending_label'))}</h3>
                                {!isRegistered && <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-0.5">{m.status}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5"><span className={cn("inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border", isOwner ? "bg-slate-900 text-white border-transparent" : "bg-white text-slate-600 border-slate-200")}>{m.role || 'Studio Member'}</span></td>
                          <td className="px-8 py-5"><div className={cn("flex items-center gap-2.5 text-slate-600 font-mono", isRTL && "flex-row-reverse")}><Calendar size={14} className="text-slate-300" /><span className="text-[11px] font-bold">{isRegistered ? (m.eventsCount || 0) : (m.allowedEventIds?.length || 0)} {t('events_count_label')}</span></div></td>
                          <td className="px-8 py-5"><div className="space-y-1"><div className={cn("flex items-center gap-2 text-[11px] text-slate-500 font-bold font-mono", isRTL && "flex-row-reverse")}><Mail size={12} className="text-slate-300" /><span className="truncate max-w-[200px] tracking-tight lowercase">{member.email}</span></div></div></td>
                          <td className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>
                            {isOwner ? (
                              <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-400 rounded-xl cursor-default border border-slate-100", isRTL && "flex-row-reverse")}>
                                <Lock size={12} strokeWidth={2.5} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('fixed_label')}</span>
                              </div>
                            ) : (
                              <div className={cn("flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all", isRTL ? "justify-start" : "justify-end")}>
                                {!isRegistered && (<button onClick={(e) => { e.stopPropagation(); resendInvitation(member.id); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title={t('resend_label')}><RefreshCw size={16}/></button>)}
                                <button onClick={(e) => handleDelete(member, e)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Remove from Studio"><Trash2 size={16}/></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* --- ADD MEMBER MODAL --- */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="ADD MEMBER TO STUDIO" className="max-w-3xl w-full" contentClassName="p-0 overflow-hidden">
        <div className="bg-white">
            <div className="flex bg-slate-100 p-2 mx-8 mt-8 rounded-2xl"><button onClick={() => setAddMode('EXISTING')} className={cn("flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all", addMode === 'EXISTING' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600")}>Organization Pool</button><button onClick={() => setAddMode('INVITE')} className={cn("flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all", addMode === 'INVITE' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600")}>External Invite</button></div>
            <div className="p-8">
            {addMode === 'EXISTING' ? (
                <div className="space-y-6">
                    <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input type="text" placeholder="Search global team members..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:ring-0 focus:border-slate-900 focus:bg-white outline-none text-start transition-all" /></div>
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 border-2 border-slate-50 rounded-3xl custom-scrollbar">{filteredGlobalMembers.length === 0 ? (<div className="py-20 text-center text-slate-300"><Users className="mx-auto mb-4 opacity-10" size={48} /><p className="text-[11px] font-black uppercase tracking-widest">Pool exhausted</p></div>) : (filteredGlobalMembers.map(m => (<div key={m.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors"><div className="flex items-center gap-4 text-start"><div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm", m.avatarColor)}>{m.initials}</div><div className="min-w-0"><h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{m.firstName} {m.lastName}</h4><p className="text-[10px] text-slate-400 font-bold font-mono truncate tracking-tight">{m.email}</p><span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1.5 inline-block tracking-[0.1em] border border-indigo-100/50">GLOBAL: {m.role}</span></div></div><div className="flex items-center gap-3"><div className="w-40 mr-2"><Select value={selectedStudioRoles[m.id] || 'Studio Member'} onChange={e => setSelectedStudioRoles(prev => ({ ...prev, [m.id]: e.target.value }))} options={studioLevelRoles.map(r => ({ label: r.name.toUpperCase(), value: r.name }))} className="h-10 text-[10px] font-bold" /></div><button onClick={() => handleAddExistingToStudio(m)} className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all">Add</button></div></div>)))}</div>
                </div>
            ) : (
                <div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><Input label="Full Name" placeholder="John Doe" value={inviteForm.fullName} onChange={e => setInviteForm({...inviteForm, fullName: e.target.value})} /><Input label="Email Address" placeholder="john@example.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} /></div><Select label="Studio Role" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} options={studioLevelRoles.map(r => ({ label: r.name.toUpperCase(), value: r.name }))} /><TextArea label="Personal Message (Optional)" placeholder="Welcome to the team!" value={inviteForm.message} onChange={e => setInviteForm({...inviteForm, message: e.target.value})} /><Button onClick={handleSendInvite} disabled={!inviteForm.fullName || !inviteForm.email} className="w-full bg-[#0F172A] h-14 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl">Send Studio Invitation</Button></div>
            )}
            </div>
        </div>
      </Modal>

      {/* --- MEMBER DETAIL MODAL --- */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('member_details_title')} className="max-w-2xl w-full">
         {selectedDetailMember && (
           <div className="space-y-8 py-2">
              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative min-h-[140px]"><div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center text-xl font-black shadow-xl ring-8 ring-white", (selectedDetailMember as any).avatarColor || 'bg-slate-100 text-slate-500')}>{(selectedDetailMember as any).initials || (selectedDetailMember.firstName?.[0] || selectedDetailMember.email[0]).toUpperCase()}</div><div className="text-start flex-1 min-w-0 flex flex-col justify-center"><h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedDetailMember.firstName ? `${selectedDetailMember.firstName} ${selectedDetailMember.lastName || ''}` : t('invitation_pending_label')}</h2>{isEditingRole ? (<div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200 w-full max-w-xs"><Select value={roleEditValue} onChange={e => setRoleEditValue(e.target.value)} options={studioLevelRoles.map(r => ({ label: r.name.toUpperCase(), value: r.name }))} className="h-10 py-0 text-[10px] font-black uppercase tracking-widest border-blue-500 focus:ring-blue-500/10 shadow-sm" /></div>) : (<p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">{selectedDetailMember.role || 'Studio Member'}</p>)}</div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><DetailItem label={t('email_address_label')} value={selectedDetailMember.email} icon={<Mail size={14}/>} /><DetailItem label={t('joined_studio_label')} value={activeTab === 'Registered' ? ((selectedDetailMember as TeamMember).joinedDate || 'Jan 10, 2025') : ((selectedDetailMember as any).sentDate || 'Pending')} icon={<Clock size={14}/>} /></div>
              <div className="text-start space-y-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">{t('linked_events_label')}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{assignedEvents.length === 0 ? (<div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active events assigned</p></div>) : (assignedEvents.map(ev => (<div key={ev.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors cursor-pointer group"><div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all"><img src={ev.coverUrl} className="w-full h-full object-cover" alt="" /></div><span className="text-[11px] font-bold text-slate-700 truncate">{ev.title}</span></div>)))}</div></div>
              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  {((selectedDetailMember as any).role === 'Owner' || (selectedDetailMember as any).role === 'SuperAdmin / Owner' || roles.find(r => r.name === selectedDetailMember.role)?.isSystem) ? (
                      <div className="w-full py-4 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t('protected_profile_label')}</div>
                  ) : (
                      isEditingRole ? (<><Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200" onClick={() => setIsEditingRole(false)}>Cancel</Button><Button className="flex-1 h-12 rounded-xl text-[10px] font-black bg-blue-600 text-white" onClick={handleUpdateRole}>Save Role</Button></>) : (<><Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200" onClick={() => setIsEditingRole(true)}>{t('edit_access_btn')}</Button><Button className="flex-1 h-12 rounded-xl text-[10px] font-black bg-red-50 text-red-600" onClick={(e) => handleDelete(selectedDetailMember, e)}>{t('remove_member_btn')}</Button></>)
                  )}
              </div>
           </div>
         )}
      </Modal>

      {/* --- STUDIO REMOVAL CONFIRMATION MODAL --- */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove from Studio">
          <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <UserMinus className="text-red-600 w-8 h-8" />
              </div>
              <div className="space-y-2">
                  <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Remove from Studio?</h4>
                  <div className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
                      Are you sure you want to remove <span className="font-bold text-slate-900">{itemToDelete?.name}</span> from <strong>{activeWorkspace?.name}</strong>?
                      <p className="mt-2 text-slate-400 text-xs italic">The member will remain in your global organization pool.</p>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200">
                      {t('cancel')}
                  </Button>
                  <Button onClick={confirmDelete} className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg">
                      Remove Member
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

const DetailItem = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (<div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-start flex items-start gap-4"><div className="p-2 bg-slate-50 rounded-lg text-slate-400 mt-0.5">{icon}</div><div className="min-w-0"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-[13px] font-bold text-slate-900 truncate">{value}</p></div></div>);
export default TeamPage;
