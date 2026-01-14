
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Camera, 
  Building, 
  Heart, 
  Star, 
  Cloud,
  Check,
  X,
  User,
  Save,
  Users,
  Search,
  UserMinus,
  UserPlus
} from 'lucide-react';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useTeam } from '../../../contexts/TeamContext';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { cn } from '../../../utils/cn';
import { uploadAsset } from '../../../utils/api';
import { workspaceApi } from '../../../services/workspaceApi';

const THEMES = [
  { id: 'ocean', name: 'Ocean', color: 'bg-indigo-500' },
  { id: 'forest', name: 'Forest', color: 'bg-emerald-500' },
  { id: 'sunset', name: 'Sunset', color: 'bg-orange-600' },
  { id: 'bloom', name: 'Bloom', color: 'bg-fuchsia-500' },
];

const ICONS = [
  { id: 'camera', icon: Camera },
  { id: 'building', icon: Building },
  { id: 'heart', icon: Heart },
  { id: 'star', icon: Star },
];

const CreateWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('id');
  const isEditMode = !!workspaceId;

  const { workspaces, createWorkspace, updateWorkspace, addWorkspaceMember, removeWorkspaceMember, getWorkspaceMembers } = useWorkspace();
  const { user } = useAuth();
  const { members, updateMember } = useTeam();
  const { t, isRTL } = useTranslation();
  
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [url, setUrl] = useState('');
  const [studioType, setStudioType] = useState('Wedding Photography');
  const [timezone, setTimezone] = useState('Pacific Standard Time (PST)');
  const [currency, setCurrency] = useState('USD ($)');
  
  const [activeTheme, setActiveTheme] = useState('ocean');
  const [activeIcon, setActiveIcon] = useState('camera');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoAssetUrl, setLogoAssetUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const [settings, setSettings] = useState({
    photoGallery: true,
    qrSharing: true,
    downloadProtection: false,
    clientComments: false,
  });

  // Team Selection State
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form and selected members in Edit Mode
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (isEditMode && workspaceId) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace) {
          setName(workspace.name);
          setUrl(workspace.url || '');
          setStudioType(workspace.studioType || 'Wedding Photography');
          setTimezone(workspace.timezone || 'Pacific Standard Time (PST)');
          setCurrency(workspace.currency || 'USD ($)');
          setActiveTheme(workspace.colorTheme || 'ocean');
          setActiveIcon(workspace.iconType || 'camera');
          setLogoPreview(workspace.logo || null);
          setLogoAssetUrl(workspace.logo || null);
          if (workspace.settings) {
            setSettings(workspace.settings);
          }

          // Fetch workspace members from API
          try {
            const workspaceMembers = await getWorkspaceMembers(workspaceId);
            const memberIds = workspaceMembers.map(m => m.member_id);
            setSelectedMemberIds(new Set(memberIds));
          } catch (error) {
            console.error('Error loading workspace members:', error);
          }
        }
      } else if (user) {
          // In Create Mode, ensure the owner is selected
          const owner = members.find(m => m.email === user.email);
          if (owner) {
              setSelectedMemberIds(new Set([owner.id]));
          }
      }
    };

    loadWorkspaceData();
  }, [isEditMode, workspaceId, workspaces, members, user, getWorkspaceMembers]);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setNameError(''); // Clear error on change
    if (!isEditMode) {
      setUrl(slugify(newName));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set preview immediately for better UX
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Store file for upload on save
    setLogoFile(file);
    
    // Optionally upload immediately (uncomment if you want immediate upload)
    // setIsUploadingLogo(true);
    // try {
    //   const result = await uploadAsset({
    //     filename: file.name,
    //     content_type: file.type,
    //     asset_type: 'logo',
    //     workspace_id: isEditMode ? workspaceId : null
    //   }, file);
    //   setLogoAssetUrl(result.asset_url);
    // } catch (error) {
    //   console.error('Error uploading logo:', error);
    //   alert('Failed to upload logo. Please try again.');
    // } finally {
    //   setIsUploadingLogo(false);
    // }
  };

  const handleSave = async () => {
    if (!name) return;

    // Check for duplicate name
    const isDuplicate = workspaces.some(ws => 
      ws.name.toLowerCase() === name.toLowerCase() && 
      (!isEditMode || ws.id !== workspaceId)
    );

    if (isDuplicate) {
        setNameError('A workspace with this name already exists. Please choose a different name.');
        return;
    }

    try {
      // Upload logo to S3 if a new file was selected
      let finalLogoUrl = logoAssetUrl;
      if (logoFile) {
        setIsUploadingLogo(true);
        try {
          const uploadResult = await uploadAsset({
            filename: logoFile.name,
            content_type: logoFile.type,
            asset_type: 'logo',
            workspace_id: isEditMode ? workspaceId : null
          }, logoFile);
          finalLogoUrl = uploadResult.asset_url;
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          alert('Failed to upload logo. Saving workspace without logo.');
          finalLogoUrl = null;
        } finally {
          setIsUploadingLogo(false);
        }
      }
    
      const workspaceData = {
        name,
        description: `Workspace for ${studioType}`,
        url,
        studioType,
        timezone,
        currency,
        colorTheme: activeTheme,
        logo: finalLogoUrl || undefined,
        settings,
        status: 'Active' as const,
        iconType: activeIcon as any
      };

      let savedWorkspaceId = workspaceId;

      if (isEditMode && workspaceId) {
        await updateWorkspace(workspaceId, workspaceData);
      } else {
        await createWorkspace(workspaceData);
        // Get the newly created workspace ID by fetching updated list
        const updatedWorkspaces = await workspaceApi.list({ page: 1, page_size: 100 });
        const newWorkspace = updatedWorkspaces.items.find(w => w.name === name);
        savedWorkspaceId = newWorkspace?.id || null;
      }

      // Sync workspace members via API
      if (savedWorkspaceId) {
        try {
          // Get current members from API
          const currentMembers = await getWorkspaceMembers(savedWorkspaceId);
          const currentMemberIds = new Set(currentMembers.map(m => m.member_id));

          // Add new members
          for (const memberId of selectedMemberIds) {
            if (!currentMemberIds.has(memberId)) {
              try {
                await addWorkspaceMember(savedWorkspaceId, memberId);
              } catch (err) {
                console.error(`Failed to add member ${memberId}:`, err);
              }
            }
          }

          // Remove members that were deselected
          for (const currentMemberId of currentMemberIds) {
            if (!selectedMemberIds.has(currentMemberId)) {
              try {
                await removeWorkspaceMember(savedWorkspaceId, currentMemberId);
              } catch (err) {
                console.error(`Failed to remove member ${currentMemberId}:`, err);
              }
            }
          }
        } catch (err) {
          console.error('Error syncing workspace members:', err);
        }
      }

      navigate('/workspaces');
    } catch (error) {
      console.error('Error saving workspace:', error);
      // Error is already handled in the context
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMemberSelection = (id: string) => {
      setSelectedMemberIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
              // Don't allow removing the owner/user from their own workspace being created
              const member = members.find(m => m.id === id);
              if (member?.isOwner || member?.email === user?.email || member?.role === 'Owner' || member?.role === 'SuperAdmin / Owner') return prev;
              next.delete(id);
          } else {
              next.add(id);
          }
          return next;
      });
  };

  const filteredPool = useMemo(() => {
    return members.filter(m => 
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [members, memberSearch]);

  const selectedMembersList = useMemo(() => {
      return members.filter(m => selectedMemberIds.has(m.id));
  }, [members, selectedMemberIds]);

  const companyUrlPrefix = user?.companyUrl ? `${user.companyUrl}.fotoshareai.com/` : 'fotoshare.com/';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 md:pb-20 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        
        <button 
          onClick={() => navigate('/workspaces')}
          className="flex items-center text-[10px] md:text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-6 md:mb-8 group"
        >
          <ArrowLeft size={14} className={cn(isRTL ? "ml-2" : "mr-2", isRTL ? "group-hover:translate-x-1" : "group-hover:-translate-x-1", "transition-transform")} />
          {t('back_to_workspaces')}
        </button>

        <div className="mb-8 md:mb-10 text-start">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {isEditMode ? t('edit_workspace') : t('create_new_workspace')}
          </h1>
          <p className="text-[11px] md:text-sm font-medium text-slate-400 mt-1 uppercase tracking-tight">
            {t('workspace_config_desc')}
          </p>
        </div>

        <div className="space-y-4 md:space-y-8">
          <SectionCard 
            title={t('section_basic_info')} 
            subtitle={t('section_basic_info_desc')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="md:col-span-1">
                <Input 
                  label={t('workspace_name')} 
                  placeholder={t('workspace_placeholder')}
                  value={name}
                  onChange={handleNameChange}
                  error={nameError}
                  className="text-sm font-bold uppercase"
                />
              </div>
              <div className="md:col-span-1 text-start">
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">{t('workspace_url')}</label>
                <div className={cn("flex", isRTL && "flex-row-reverse")}>
                  <div className={cn(
                    "flex items-center px-3 md:px-4 border border-slate-200 bg-slate-50 text-slate-400 text-[10px] md:text-sm whitespace-nowrap font-mono",
                    isRTL ? "border-l-0 rounded-r-xl" : "border-r-0 rounded-l-xl"
                  )}>
                    {companyUrlPrefix}
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    className={cn(
                      "flex h-11 w-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all",
                      isRTL ? "rounded-l-xl text-right" : "rounded-r-xl text-left"
                    )}
                    placeholder="slug"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-6">
              <Select 
                label={t('studio_type')} 
                value={studioType}
                onChange={e => setStudioType(e.target.value)}
                options={[
                  { label: t('all'), value: 'Wedding Photography' },
                  { label: 'Commercial', value: 'Commercial' },
                  { label: 'Portrait', value: 'Portrait' },
                ]} 
                className="font-bold"
              />
              <Select 
                label={t('timezone')} 
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                options={[
                  { label: 'PST (UTC-8)', value: 'Pacific Standard Time (PST)' },
                  { label: 'EST (UTC-5)', value: 'Eastern Standard Time (EST)' },
                ]} 
                className="font-bold"
              />
              <Select 
                label={t('currency')} 
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                options={[
                  { label: 'USD ($)', value: 'USD ($)' },
                ]} 
                className="font-bold"
              />
            </div>
          </SectionCard>

          <SectionCard 
            title={t('section_team_members')} 
            subtitle={t('section_team_members_desc')}
            action={
              <button 
                onClick={() => setIsMemberModalOpen(true)}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-[9px] md:text-[10px] h-8 md:h-9 rounded-lg px-3 md:px-4 font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2"
              >
                <Plus size={14} strokeWidth={3} />
                {t('add_member')}
              </button>
            }
          >
            <div className="space-y-2 mt-4">
               {selectedMembersList.map(member => (
                 <div key={member.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-xl group transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0", member.avatarColor || 'bg-slate-100 text-slate-500')}>
                            {member.initials}
                        </div>
                        <div className="flex flex-col text-start">
                            <div className="text-xs md:text-sm font-bold text-slate-900 leading-tight uppercase tracking-tight">{member.firstName} {member.lastName}</div>
                            <div className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-wider">{member.role}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {member.role === 'Owner' || member.isOwner || member.role === 'SuperAdmin / Owner' ? (
                            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-slate-900 text-white text-[8px] md:text-[9px] font-black rounded-lg uppercase tracking-wider">Owner</span>
                        ) : (
                            <button 
                                onClick={() => toggleMemberSelection(member.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Remove member"
                            >
                                <UserMinus size={16} />
                            </button>
                        )}
                    </div>
                 </div>
               ))}
               {selectedMembersList.length === 0 && (
                   <div className="py-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
                       <Users className="mx-auto mb-2 opacity-20" size={32} />
                       <p className="text-[10px] font-black uppercase tracking-widest">No team members assigned</p>
                   </div>
               )}
            </div>
          </SectionCard>

          <SectionCard title={t('section_visual_branding')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="text-start">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 block">{t('color_theme')}</label>
                <div className="flex flex-wrap gap-4">
                  {THEMES.map(theme => (
                    <div key={theme.id} className="flex flex-col items-center gap-1.5">
                       <button
                         onClick={() => setActiveTheme(theme.id)}
                         className={cn(
                           "w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all relative overflow-hidden group shadow-sm",
                           theme.color,
                           activeTheme === theme.id ? "ring-2 ring-offset-2 ring-slate-900" : "hover:scale-105"
                         )}
                       >
                         {activeTheme === theme.id && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><Check size={18} className="text-white stroke-[3px]"/></div>}
                       </button>
                       <span className="text-[9px] font-bold text-slate-400 uppercase">{theme.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-start">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 block">{t('icon_set')}</label>
                <div className="flex flex-wrap gap-3">
                  {ICONS.map(item => {
                    const Icon = item.icon;
                    const isActive = activeIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveIcon(item.id)}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all border-2",
                          isActive ? "bg-white border-slate-900 text-slate-900 shadow-md scale-105" : "bg-slate-50 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-10 text-start">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 block">{t('studio_logo')}</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group shadow-sm"
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                {logoPreview ? (
                  <div className="relative w-32 h-20 md:w-40 md:h-24">
                    <img src={logoPreview} className="w-full h-full object-contain" alt="Preview" />
                    <button onClick={(e) => { e.stopPropagation(); setLogoPreview(null); }} className="absolute -top-2 -right-2 bg-red-50 text-white rounded-full p-1.5 shadow-lg"><X size={12} strokeWidth={3} /></button>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 mb-3 transition-all"><Cloud size={20} /></div>
                    <p className="text-xs md:text-sm font-bold text-slate-700">{t('logo_upload_desc').split(' or ')[0]} {t('or')} <span className="text-blue-600">{t('logo_upload_desc').split(' or ')[1]}</span></p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">{t('logo_upload_meta')}</p>
                  </>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t('section_default_settings')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 md:mb-10">
              <Select label={t('timezone')} value={timezone} onChange={e => setTimezone(e.target.value)} options={[{ label: 'UTC-8 (Pacific)', value: 'Pacific Standard Time (PST)' }]} />
              <Select label={t('currency')} value={currency} onChange={e => setCurrency(e.target.value)} options={[{ label: 'USD ($)', value: 'USD ($)' }]} />
            </div>
            <div className="space-y-4 text-start">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 block">{t('default_features')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CheckboxItem label={t('feature_gallery')} checked={settings.photoGallery} onChange={() => toggleSetting('photoGallery')} />
                <CheckboxItem label={t('feature_qr')} checked={settings.qrSharing} onChange={() => toggleSetting('qrSharing')} />
                <CheckboxItem label={t('feature_download')} checked={settings.downloadProtection} onChange={() => toggleSetting('downloadProtection')} />
                <CheckboxItem label={t('feature_comments')} checked={settings.clientComments} onChange={() => toggleSetting('clientComments')} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button 
            onClick={() => navigate('/workspaces')}
            className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-6 h-11 transition-colors"
          >
            {t('cancel')}
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="outline" className="h-12 border-slate-200 text-slate-700 font-black rounded-xl text-[10px] uppercase tracking-widest px-8 hover:bg-slate-50">
                {t('save_draft')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isUploadingLogo}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white h-12 rounded-xl shadow-lg shadow-slate-200 font-black text-[10px] uppercase tracking-widest px-10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingLogo ? 'Uploading Logo...' : (isEditMode ? t('update_studio') : t('create_studio'))}
            </Button>
          </div>
        </div>
      </div>

      {/* Member Selection Modal */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title="Organization Pool"
        className="max-w-2xl w-full"
        contentClassName="p-0 overflow-hidden"
      >
        <div className="bg-white flex flex-col h-[60vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="relative group">
                    <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder="Search global members..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        className="w-full ps-11 pe-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-start shadow-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredPool.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 opacity-60">
                        <Users size={48} className="mx-auto mb-2" />
                        <p className="text-[11px] font-black uppercase tracking-widest">No members match your search</p>
                    </div>
                ) : filteredPool.map(member => {
                    const isSelected = selectedMemberIds.has(member.id);
                    const isOwnerMember = member.role === 'Owner' || member.isOwner || member.role === 'SuperAdmin / Owner' || member.email === user?.email;
                    
                    return (
                        <div 
                            key={member.id}
                            onClick={() => toggleMemberSelection(member.id)}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all",
                                isSelected ? "bg-blue-50/30 border-blue-100" : "bg-white border-slate-50 hover:border-slate-200"
                            )}
                        >
                            <div className="flex items-center gap-4 text-start">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm", member.avatarColor || 'bg-slate-100 text-slate-500')}>
                                    {member.initials}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{member.firstName} {member.lastName}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">{member.role}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {isOwnerMember ? (
                                    <div className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg border border-slate-900 tracking-widest">
                                        Owner
                                    </div>
                                ) : isSelected ? (
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 tracking-widest flex items-center gap-1">
                                        <Check size={10} strokeWidth={4} /> Selected
                                    </div>
                                ) : (
                                    <div className="px-3 py-1 bg-white text-slate-400 text-[8px] font-black uppercase rounded-lg border border-slate-200 tracking-widest hover:border-slate-900 hover:text-slate-900 transition-colors">
                                        Add
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end">
                <Button 
                    onClick={() => setIsMemberModalOpen(false)}
                    className="bg-[#0F172A] px-10 h-11 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg"
                >
                    Done
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

const SectionCard = ({ title, subtitle, action, children }: any) => (
  <Card className="p-5 md:p-8 border-none shadow-sm rounded-2xl md:rounded-3xl bg-white">
    <div className="flex items-start justify-between mb-6 md:mb-8">
      <div className="text-start">
        <h2 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-tight">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </Card>
);

const CheckboxItem = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => {
    return (
        <div className="flex items-center gap-3 cursor-pointer group p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all text-start" onClick={onChange}>
            <div className={cn(
                "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                checked ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200 group-hover:border-slate-400"
            )}>
                {checked && <Check size={12} className="text-white" strokeWidth={4} />}
            </div>
            <span className={cn(
                "text-[10px] md:text-xs font-black transition-colors uppercase tracking-tight",
                checked ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
            )}>
                {label}
            </span>
        </div>
    );
};

export default CreateWorkspacePage;
