import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Camera,
  Building,
  Heart,
  Star,
  MoreVertical,
  Users,
  User,
  Mail,
  ArrowRight,
  LayoutGrid,
  UserX,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  UserPlus,
  Pencil,
  Trash2,
  AlertTriangle,
  Globe,
  Shield,
  ShieldCheck,
  UserCheck,
  SearchX,
  Check,
  CheckCircle2,
  CreditCard,
  History,
  Code2,
  ImageIcon,
  Share2,
  Download,
  BarChart3,
  Layers,
  Settings,
  Zap,
  Printer,
  UserMinus,
  ClipboardList,
  MessageSquare,
  Send,
  Lock,
  Type,
  ChevronRight,
  MapPin,
  Briefcase,
  LogOut,
  X,
  Clock,
  Grid,
  AlertCircle,
  ShieldX,
  FileText,
  Filter,
  ArrowUpDown,
  Phone
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTeam } from '../../contexts/TeamContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { cn } from '../../utils/cn';
import { loadGuestRegistry } from '../../constants';
import { useEvents } from '../../contexts/EventsContext';
import { formatBytes } from '../../utils/formatters';
import { EMAIL_REGEX } from '../../utils/validators';
import { GuestRecord, Role } from '../../types';
import { showToast } from '../../utils/toast';

type TabType = 'WorkSpaces' | 'Roles' | 'TeamMembers' | 'GuestData' | 'Calendar';

interface Permission {
  id: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  id: string;
  category: string;
  icon: React.ReactNode;
  permissions: Permission[];
}

const THEME_COLORS: Record<string, string> = {
  ocean: 'bg-indigo-600',
  forest: 'bg-emerald-600',
  sunset: 'bg-orange-600',
  bloom: 'bg-fuchsia-600',
};

const THEME_HOVER: Record<string, string> = {
  ocean: 'hover:bg-indigo-700',
  forest: 'hover:bg-emerald-700',
  sunset: 'hover:bg-orange-700',
  bloom: 'hover:bg-fuchsia-700',
};

const PERMISSIONS_LIST: PermissionGroup[] = [
  {
    id: "platform",
    category: "Platform Administration",
    icon: <Shield size={18} />,
    permissions: [
      { id: "ws_add", label: "Add New Workspaces", description: "Create separate studio environments for your organization." },
      { id: "ws_edit", label: "Edit Workspace Settings", description: "Update workspace details, branding, and configurations." },
      { id: "ws_delete", label: "Delete Workspaces", description: "Permanently remove a workspace and its data." },
      { id: "ws_manage", label: "View All Workspaces", description: "Full visibility across all studio directories." },
      { id: "role_add", label: "Create Roles", description: "Define new access levels for team members." },
      { id: "role_edit", label: "Modify Roles", description: "Update permissions and titles for existing roles." },
      { id: "member_add", label: "Invite Global Members", description: "Send invitations to new team members at the platform level." },
      { id: "member_manage", label: "Manage Global Members", description: "Edit profiles and platform roles for existing staff." },
      { id: "member_remove", label: "Offboard Global Members", description: "Remove users from the organization and revoke all access." },
      { id: "guest_data_view", label: "View All Guest Data", description: "Access the registry of captured guest leads and their download activity." },
      { id: "billing_manage", label: "Manage Billing", description: "Access subscriptions, invoices, and payment methods." },
      { id: "audit_logs", label: "View Audit Logs", description: "Monitor security activity and system-wide changes." }
    ]
  },
  {
    id: "studio",
    category: "Studio Operations",
    icon: <Building size={18} />,
    permissions: [
      { id: "event_add", label: "Create New Events", description: "Launch new photo collections within a studio." },
      { id: "event_edit", label: "Update Event Details", description: "Change names, dates, and settings for active events." },
      { id: "event_delete", label: "Delete Events", description: "Remove event data and catalogs permanently." },
      { id: "studio_member_add", label: "Add Studio Members", description: "Enroll existing team members into specific studios." },
      { id: "studio_member_remove", label: "Remove Studio Members", description: "Revoke access to a specific studio environment." },
      { id: "studio_member_edit", label: "Edit Studio Access", description: "Adjust what a member can do within a studio." },
      { id: "branding_add", label: "Upload Brand Assets", description: "Add logos and visual identities to the studio." },
      { id: "branding_edit", label: "Manage Branding", description: "Configure watermark positions and brand themes." },
      { id: "studio_settings", label: "Configure Studio Features", description: "Toggle Gallery View, QR Sharing, and Download Protection." }
    ]
  },
  {
    id: "media",
    category: "Media & Collaboration",
    icon: <Zap size={18} />,
    permissions: [
      { id: "event_share", label: "Share Events", description: "Generate gallery links for clients and guests." },
      { id: "event_assign", label: "Assign Lead Staff", description: "Designate specific staff as leads for events." },
      { id: "media_manage", label: "Manage Files", description: "Upload, edit, and delete photos or videos in a gallery." },
      { id: "media_usage", label: "Client Actions", description: "Download, share, and print high-resolution media." },
      { id: "staff_manage", label: "Assign Event Staff", description: "Allocate team members to specific shoot dates." },
      { id: "comment_moderate", label: "Moderate Comments", description: "Resolve or delete client feedback and internal comments." },
      { id: "analytics_view", label: "View Reports", description: "Access performance data and download metrics." }
    ]
  }
];

const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, isRTL } = useTranslation();
  const { workspaces, setActiveWorkspaceById, deleteWorkspace } = useWorkspace();
  const { events: allEvents } = useEvents();
  const { members, pendingMembers, roles, setRoles, inviteMember, updateMember, deleteMember, deletePendingMember, createRole, updateRole, deleteRole, fetchRoles, fetchMembers, fetchInvitations } = useTeam();
  const [searchTerm, setSearchTerm] = useState('');

  // Tab State
  const activeTab = useMemo<TabType>(() => {
    const path = location.pathname;
    if (path === '/roles') return 'Roles';
    if (path === '/all-members') return 'TeamMembers';
    if (path === '/guest-data') return 'GuestData';
    if (path === '/calendar') return 'Calendar';
    return 'WorkSpaces';
  }, [location.pathname]);

  // RESET SEARCH ON TAB CHANGE
  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  const currentUserProfile = useMemo(() => {
    if (!user?.email) return null;
    return members.find(m => m?.email?.toLowerCase() === user.email.toLowerCase());
  }, [members, user]);

  const userRole = currentUserProfile?.role || 'Studio Member';
  // Always grant admin access to the org owner/creator, even if not in members list yet
  const isOwnerAccount = user?.email && user?.companyName; // If user has company, they're the org owner
  const isAdmin = isOwnerAccount || currentUserProfile?.isOwner || ['Owner', 'SuperAdmin / Owner', 'Account Manager'].includes(userRole);
  const canManageStudioMembers = isAdmin || userRole === 'Studio Manager';

  const assignableRoles = useMemo(() => {
    return roles.filter(r => !r.isSystem);
  }, [roles]);

  const canViewGuestData = useMemo(() => {
    if (!currentUserProfile) return false;
    if (isAdmin) return true;
    return false;
  }, [currentUserProfile, isAdmin]);

  // Calculate Global Storage Stats for the Menu Bar
  const globalStorageStats = useMemo(() => {
    const totalSizeBytes = allEvents.reduce((acc, event) => acc + (event.total_size_bytes || 0), 0);
    const limit = 1024 * 1024 * 1024; // 1 GB
    return {
      percentage: Math.min(100, Math.round((totalSizeBytes / limit) * 100)),
      formatted: formatBytes(totalSizeBytes)
    };
  }, [allEvents]);

  const rolesWithUserCounts = useMemo(() => {
    return roles.map(role => {
      let permissions = role.permissions;
      if (role.id === 'role_owner') permissions = PERMISSIONS_LIST.flatMap(g => g.permissions.map(p => p.id));
      else if (role.id === 'role_account_mgr' && permissions.length === 0) permissions = PERMISSIONS_LIST.flatMap(g => g.permissions.map(p => p.id)).filter(id => !['ws_delete', 'role_delete', 'branding_remove'].includes(id));
      else if (role.id === 'role_studio_mgr' && permissions.length === 0) permissions = [
        'event_add', 'event_edit', 'event_delete',
        'studio_member_add', 'studio_member_remove', 'studio_member_edit',
        'branding_add', 'branding_edit', 'studio_settings',
        'event_share', 'event_assign', 'media_manage', 'media_usage', 'staff_manage', 'comment_moderate', 'analytics_view'
      ];
      else if (role.id === 'role_studio_member' && permissions.length === 0) permissions = ['event_share', 'media_manage', 'media_usage'];

      return {
        ...role,
        permissions
        // Keep memberCount from API instead of recalculating
      };
    });
  }, [roles]);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [activePermissionTab, setActivePermissionTab] = useState(PERMISSIONS_LIST[0].id);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDescription, setRoleFormDescription] = useState('');
  const [roleFormLevel, setRoleFormLevel] = useState<'organization' | 'studio'>('studio');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [studioSearchTerm, setStudioSearchTerm] = useState('');
  const studioDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [managingMembersWorkspace, setManagingMembersWorkspace] = useState<any>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'Registered' | 'Pending'>('Registered');

  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    selectedStudioIds: [] as string[], // Default to empty to force selection
    message: ''
  });

  const [workspaceToDelete, setWorkspaceToDelete] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [initialMemberCountForDelete, setInitialMemberCountForDelete] = useState(0);

  const membersWithRoleToDelete = useMemo(() => {
    if (!roleToDelete) return [];
    return members.filter(m => {
      if (roleToDelete.id === 'role_owner') {
        return m.isOwner || m.role === 'Owner' || m.role === 'SuperAdmin / Owner';
      }
      return m.role === roleToDelete.name;
    });
  }, [roleToDelete, members]);

  useEffect(() => {
    if (roleToDelete) {
      setInitialMemberCountForDelete(membersWithRoleToDelete.length);
    } else {
      setInitialMemberCountForDelete(0);
    }
  }, [roleToDelete]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studioDropdownRef.current && !studioDropdownRef.current.contains(event.target as Node)) {
        setIsStudioDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isStudioDropdownOpen || isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStudioDropdownOpen, isUserMenuOpen]);

  const workspacesWithStats = useMemo(() => {
    return workspaces.map(ws => {
      if (!ws) return null;
      // Filter events for this workspace from API data
      const wsEvents = allEvents.filter(e => e.workspace_id === ws.id);
      const storage = wsEvents.reduce((acc, e) => acc + (e.total_size_bytes || 0), 0);

      const relevantMembers = members.filter(m =>
        m.role === 'Owner' ||
        m.isOwner ||
        m.allowedWorkspaceIds?.includes(ws.id) ||
        wsEvents.some(e => m.allowedEventIds?.includes(e.id))
      );

      return {
        ...ws,
        realEventsCount: wsEvents.length,
        realStorage: storage,
        realMembersCount: ws.membersCount, // Use API member count instead of calculating
        memberAvatars: relevantMembers.map(m => `https://ui-avatars.com/api/?name=${m.firstName}+${m.lastName}&background=random&color=fff`)
      };
    }).filter(Boolean);
  }, [workspaces, members, allEvents]);

  const filteredWorkspaces = workspacesWithStats.filter(ws =>
    ws?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPending = pendingMembers.filter(m =>
    `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = rolesWithUserCounts.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenWorkspace = async (id: string) => {
    try {
      await setActiveWorkspaceById(id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting active workspace:', error);
    }
  };

  const togglePermission = (id: string) => {
    const next = new Set(selectedPermissions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPermissions(next);
  };

  const handleCreateNewRole = () => {
    setEditingRoleId(null);
    setRoleFormName('');
    setRoleFormDescription('');
    setRoleFormLevel('studio');
    setSelectedPermissions(new Set());
    setActivePermissionTab(PERMISSIONS_LIST[0].id);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.isSystem) return;
    setEditingRoleId(role.id);
    setRoleFormName(role.name);
    setRoleFormDescription(role.description || '');
    setRoleFormLevel(role.level);
    setSelectedPermissions(new Set(role.permissions || []));
    setActivePermissionTab(PERMISSIONS_LIST[0].id);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    const trimmedName = roleFormName.trim();
    if (!trimmedName) return;

    const normalizedName = trimmedName.toLowerCase();
    const reservedNames = ['owner', 'super admin', 'superadmin', 'administrator', 'root'];

    if (reservedNames.includes(normalizedName)) {
      showToast({ message: `The name "${trimmedName}" is reserved for system use.`, type: 'error' });
      return;
    }

    const isDuplicate = roles.some(r => r.name.toLowerCase() === normalizedName && r.id !== editingRoleId);
    if (isDuplicate) {
      showToast({ message: `A role with the name "${trimmedName}" already exists.`, type: 'error' });
      return;
    }

    setIsSavingRole(true);

    try {
      const roleData = {
        name: trimmedName,
        description: roleFormDescription.trim() || undefined,
        level: roleFormLevel,
        permissions: Array.from(selectedPermissions)
      };

      if (editingRoleId) {
        await updateRole(editingRoleId, roleData);
        showToast({ message: `Role "${trimmedName}" updated successfully!`, type: 'success' });
      } else {
        await createRole(roleData);
        showToast({ message: `Role "${trimmedName}" created successfully!`, type: 'success' });
      }

      // Refresh roles from API to get updated counts
      await fetchRoles();

      setIsRoleModalOpen(false);
      setRoleFormName('');
      setRoleFormDescription('');
      setRoleFormLevel('studio');
      setSelectedPermissions(new Set());
      setEditingRoleId(null);
    } catch (error: any) {
      console.error('Error saving role:', error);
      showToast({ message: error.message || 'Failed to save role. Please try again.', type: 'error' });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleEditMember = (member: any) => {
    setEditingMemberId(member.id);
    // Find the role ID from the member's role name
    const memberRole = roles.find(r => r.name === member.role);
    setInviteForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email,
      roleId: memberRole?.id || '',
      selectedStudioIds: member.allowedWorkspaceIds?.length > 0 ? member.allowedWorkspaceIds : ['all'],
      message: ''
    });
    setIsAddMemberModalOpen(true);
  };

  const handleSendInvite = async () => {
    if (!inviteForm.firstName.trim() || !inviteForm.email.trim() || !EMAIL_REGEX.test(inviteForm.email.trim())) {
      showToast({ message: 'Please enter a valid email address and first name.', type: 'error' });
      return;
    }

    // Determine workspace IDs - filter out 'all' and convert to actual workspace IDs
    let workspaceIds: string[] = [];
    if (inviteForm.selectedStudioIds.includes('all')) {
      workspaceIds = workspaces.map(w => w.id).filter(id => !!id);
    } else {
      workspaceIds = inviteForm.selectedStudioIds.filter(id => id !== 'all' && !!id);
    }

    if (workspaceIds.length === 0) {
      showToast({ message: 'Please select at least one studio for access.', type: 'error' });
      return;
    }

    const roleId = inviteForm.roleId || null;
    const isAllStudios = inviteForm.selectedStudioIds.includes('all');

    try {
      if (editingMemberId) {
        // Update existing member
        await updateMember(editingMemberId, {
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          roleId: roleId,
          accessLevel: isAllStudios ? 'Full Access' : 'Specific Event',
          workspaceIds: workspaceIds,
        });
        showToast({ message: 'Member updated successfully!', type: 'success' });
        await fetchMembers();
      } else {
        // Create new invitation - send roleId and workspaceIds
        await inviteMember({
          email: inviteForm.email.trim().toLowerCase(),
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          roleId: roleId,
          accessLevel: isAllStudios ? 'Full Access' : 'Specific Event',
          workspaceIds: workspaceIds,
          message: inviteForm.message?.trim() || undefined,
        });
        showToast({ message: 'Invitation sent successfully!', type: 'success' });
        await fetchInvitations();
        setMemberStatusFilter('Pending');
      }

      setIsAddMemberModalOpen(false);
      setEditingMemberId(null);
      setInviteForm({ firstName: '', lastName: '', email: '', roleId: '', selectedStudioIds: [] as string[], message: '' });
    } catch (error: any) {
      console.error('Error saving member:', error);
      showToast({ message: error.message || 'Failed to save member. Please try again.', type: 'error' });
    }
  };

  const toggleWorkspaceMember = async (memberId: string) => {
    if (!managingMembersWorkspace) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const currentWS = member.allowedWorkspaceIds || [];
    const hasAccess = currentWS.includes(managingMembersWorkspace?.id);

    try {
      if (hasAccess) {
        if (member.isOwner || member.role === 'Owner' || member.role === 'SuperAdmin / Owner') return;
        // Use workspaceIds (not allowedWorkspaceIds) to match API mapper
        await updateMember(memberId, { workspaceIds: currentWS.filter(id => id !== managingMembersWorkspace?.id) });
        showToast({ message: `${member.firstName} ${member.lastName} removed from workspace!`, type: 'success' });
      } else {
        // Use workspaceIds (not allowedWorkspaceIds) to match API mapper
        await updateMember(memberId, { workspaceIds: [...currentWS, managingMembersWorkspace?.id] });
        showToast({ message: `${member.firstName} ${member.lastName} added to workspace!`, type: 'success' });
      }
      await fetchMembers();
    } catch (error: any) {
      console.error('Error updating workspace access:', error);
      showToast({ message: 'Failed to update workspace access. Please try again.', type: 'error' });
    }
  };

  const confirmDeleteRole = async () => {
    if (roleToDelete && !roleToDelete.isSystem && membersWithRoleToDelete.length === 0) {
      try {
        await deleteRole(roleToDelete.id);
        showToast({ message: `Role "${roleToDelete.name}" deleted successfully!`, type: 'success' });
        await fetchRoles();
        setRoleToDelete(null);
      } catch (error: any) {
        console.error('Error deleting role:', error);
        showToast({ message: error.message || 'Failed to delete role.', type: 'error' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const TABS = useMemo(() => {
    const base = [{ id: 'WorkSpaces', label: t('workspaces'), path: '/workspaces' }];
    if (isAdmin) {
      const extended = [
        ...base,
        { id: 'Calendar', label: t('calendar'), path: '/calendar' },
        { id: 'Roles', label: t('roles'), path: '/roles' },
        { id: 'TeamMembers', label: t('all_members'), path: '/all-members' },
      ];
      if (canViewGuestData) {
        extended.push({ id: 'GuestData', label: t('guest_data'), path: '/guest-data' });
      }
      return extended;
    }
    return base;
  }, [isAdmin, canViewGuestData, t]);

  const filteredStudioOptions = workspaces.filter(ws =>
    ws?.name?.toLowerCase().includes(studioSearchTerm.toLowerCase())
  );

  const getSearchPlaceholder = () => {
    if (activeTab === 'WorkSpaces') return t('search_workspaces');
    if (activeTab === 'Roles') return t('search_roles');
    if (activeTab === 'GuestData') return 'Search guests...';
    return t('search_members');
  };

  const toggleStudioSelection = (id: string) => {
    setInviteForm(prev => {
      let nextIds = [...prev.selectedStudioIds];
      if (id === 'all') {
        nextIds = ['all'];
      } else {
        nextIds = nextIds.filter(idx => idx !== 'all');
        if (nextIds.includes(id)) {
          nextIds = nextIds.filter(idx => idx !== id);
          if (nextIds.length === 0) nextIds = ['all'];
        } else {
          nextIds.push(id);
        }
      }
      return { ...prev, selectedStudioIds: nextIds };
    });
  };

  const getStudioDropdownLabel = () => {
    const { selectedStudioIds } = inviteForm;
    if (selectedStudioIds.includes('all')) return 'ALL STUDIOS';
    if (selectedStudioIds.length === 0) return 'SELECT STUDIOS FROM LIST';
    if (selectedStudioIds.length === 1) {
      return workspaces.find(ws => ws?.id === selectedStudioIds[0])?.name.toUpperCase() || '1 STUDIO';
    }
    return `${selectedStudioIds.length} STUDIOS SELECTED`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32 md:pb-20 w-full overflow-x-hidden text-start">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50 w-full">
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
                onClick={() => {
                  navigate(tab.path);
                }}
                className={cn(
                  "h-full px-2 text-[14px] font-bold transition-all relative flex items-center tracking-tight",
                  activeTab === tab.id ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#0F172A] rounded-t-full" />}
              </button>
            ))}

            {/* Global Storage Indicator in Menu Bar */}
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
            <button
              onClick={() => navigate('/email-simulation', { state: { from: location.pathname + location.search } })}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all shadow-sm group"
            >
              <div className="relative">
                <Mail size={18} className="text-indigo-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse border-2 border-indigo-50"></span>
              </div>
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest hidden lg:block">Email Sim</span>
            </button>

            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            <div className="relative hidden lg:block group">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border-none rounded-xl ps-10 pe-4 py-2.5 text-sm w-48 focus:ring-2 focus:ring-slate-200 transition-all text-start"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  if (activeTab === 'Roles') handleCreateNewRole();
                  else if (activeTab === 'TeamMembers') { setEditingMemberId(null); setInviteForm({ firstName: '', lastName: '', email: '', roleId: '', selectedStudioIds: [] as string[], message: '' }); setIsAddMemberModalOpen(true); }
                  else if (activeTab === 'WorkSpaces') navigate('/workspaces/create');
                }}
                className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-all shadow-sm active:scale-95"
              >
                <Plus size={20} className="md:w-6 md:h-6" strokeWidth={3} />
              </button>
            )}

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
                    <Settings size={16} /> {t('settings')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase text-red-500 hover:bg-red-50 tracking-[0.1em] transition-colors"
                  >
                    <LogOut size={16} /> {t('log_out')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center overflow-x-auto no-scrollbar border-t border-slate-50 bg-white px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                navigate(tab.path);
              }}
              className={cn(
                "flex-1 py-3 px-4 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2",
                activeTab === tab.id ? "text-slate-900 border-[#0F172A]" : "text-slate-400 border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="w-full px-4 md:px-12 mt-8 md:mt-12">
        <div className="lg:hidden mb-6 flex items-center gap-3">
          <div className="relative group flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl ps-10 pe-4 py-3 text-sm w-full focus:ring-2 focus:ring-slate-200 transition-all shadow-sm text-start"
            />
          </div>
          <LanguageSwitcher />
        </div>

        {activeTab === 'WorkSpaces' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8">
              {filteredWorkspaces.map(ws => (
                <WorkspaceCard
                  key={ws?.id}
                  workspace={ws}
                  onOpen={() => handleOpenWorkspace(ws?.id)}
                  onEdit={() => navigate(`/workspaces/create?id=${ws?.id}`)}
                  onDelete={() => setWorkspaceToDelete(ws)}
                  onManageMembers={() => { setMemberSearchQuery(''); setManagingMembersWorkspace(ws); }}
                  canManageMembers={canManageStudioMembers}
                  isAdmin={isAdmin}
                />
              ))}
              {isAdmin && (
                <button
                  onClick={() => navigate('/workspaces/create')}
                  className="border-2 border-dashed border-slate-200 rounded-3xl md:rounded-[3.5rem] flex flex-col items-center justify-center bg-white/50 hover:bg-white hover:border-slate-400 hover:shadow-xl transition-all aspect-auto sm:aspect-square py-12 sm:py-0 group"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:rotate-90">
                    <Plus size={24} className="md:w-7 md:h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-[10px] md:text-xs uppercase tracking-widest">{t('new_studio')}</h4>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Roles' && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 text-start">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-widest">{t('platform_roles')}</h2>
              <Button onClick={handleCreateNewRole} className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-6 h-11 md:h-12 rounded-xl text-[10px] md:text-xs uppercase tracking-widest w-full sm:w-auto shadow-lg">
                <Shield size={16} className={isRTL ? "ml-2" : "mr-2"} /> {t('add_new_role')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredRoles.map(role => (
                <Card key={role.id} className="p-5 md:p-7 border-none shadow-sm rounded-2xl md:rounded-[3rem] bg-white group hover:shadow-xl transition-all flex flex-col min-h-[auto] sm:min-h-[340px] text-start relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                      {role.isSystem ? <Lock size={20} className="md:w-6 md:h-6 text-slate-400" /> : <ShieldCheck size={20} className="md:w-6 md:h-6" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                        role.level === 'organization' ? "bg-blue-600 text-white border-blue-500" : "bg-purple-600 text-white border-purple-500"
                      )}>
                        {role.level === 'organization' ? 'ORG' : 'STUDIO'}
                      </span>
                      {!role.isSystem && (
                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditRole(role)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil size={14} /></button>
                          <button onClick={() => setRoleToDelete(role)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-1.5 truncate tracking-tight">{role.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-2 sm:line-clamp-3 mb-4 leading-relaxed uppercase tracking-tight opacity-80">{role.description || "No description"}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-widest border border-indigo-100/50">
                        {role.permissions.length === PERMISSIONS_LIST.flatMap(g => g.permissions).length ? 'Full Access' : `${role.permissions.length} PERMS`}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role.memberCount} USERS</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50">
                    <Button
                      variant="outline"
                      onClick={() => !role.isSystem ? handleEditRole(role) : null}
                      className="w-full h-10 md:h-12 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      {role.isSystem ? 'PROTECTED ROLE' : 'MANAGE ACCESS'}
                    </Button>
                  </div>
                </Card>
              ))}
              {filteredRoles.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 uppercase font-black tracking-widest opacity-60">
                  No roles match your search filter
                </div>
              )}
              <button onClick={() => handleCreateNewRole()} className="border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[3rem] p-6 md:p-7 flex flex-col items-center justify-center bg-white/40 hover:bg-white hover:border-slate-400 transition-all min-h-[180px] sm:min-h-[340px] group">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:rotate-90">
                  <Plus size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-widest">{t('add_new_role')}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'TeamMembers' && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 text-start">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-widest">{t('global_team_members')}</h2>
                <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                  <button onClick={() => setMemberStatusFilter('Registered')} className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all", memberStatusFilter === 'Registered' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{t('tab_registered')}</button>
                  <button onClick={() => setMemberStatusFilter('Pending')} className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all", memberStatusFilter === 'Pending' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{t('tab_pending')}</button>
                </div>
              </div>
              <Button onClick={() => { setEditingMemberId(null); setInviteForm({ firstName: '', lastName: '', email: '', roleId: '', selectedStudioIds: [] as string[], message: '' }); setIsAddMemberModalOpen(true); }} className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-6 h-11 md:h-12 rounded-xl text-[10px] md:text-xs uppercase tracking-widest w-full sm:w-auto shadow-lg">
                <UserPlus size={16} className={isRTL ? "ml-2" : "mr-2"} /> {t('invite_member')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {memberStatusFilter === 'Registered' ? (
                <>
                  <button onClick={() => { setEditingMemberId(null); setInviteForm({ firstName: '', lastName: '', email: '', roleId: '', selectedStudioIds: [] as string[], message: '' }); setIsAddMemberModalOpen(true); }} className="border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 flex items-center gap-4 md:gap-5 bg-white/40 hover:bg-white hover:border-slate-400 transition-all group">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all"><Plus size={20} className="md:w-6 md:h-6" /></div>
                    <div className="text-start"><span className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-widest block">{t('invite_member')}</span><span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Platform Invite</span></div>
                  </button>
                  {filteredMembers.map(member => (
                    <Card key={member.id} className="bg-white border-none shadow-sm rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 flex items-center gap-4 md:gap-5 group hover:shadow-xl hover:-translate-y-0.5 transition-all text-start relative overflow-hidden">
                      <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-base md:text-lg font-bold transition-transform group-hover:scale-110", member.avatarColor || 'bg-slate-100 text-slate-500')}>{member.initials}</div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 truncate text-xs md:text-sm">{member.firstName} {member.lastName}</h4>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 md:mt-1">{member.role}</p>
                      </div>
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => handleEditMember(member)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Pencil size={18} /></button>
                        {!(member.isOwner || member.role === 'Owner' || member.role === 'SuperAdmin / Owner' || roles.find(r => r.name === member.role)?.isSystem) ? (
                          <button onClick={() => setMemberToDelete(member)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                        ) : (
                          <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center cursor-not-allowed" title="System profile cannot be deleted"><Lock size={18} /></div>
                        )}
                      </div>
                    </Card>
                  ))}
                </>
              ) : (
                filteredPending.map(member => (
                  <Card key={member.id} className="bg-white border-none shadow-sm rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 flex items-center gap-4 md:gap-5 group hover:shadow-xl hover:-translate-y-0.5 transition-all text-start relative overflow-hidden">
                    <div className={cn("absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter rounded-bl-lg shadow-sm", member.status === 'Invitation Expired' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{member.status === 'Invitation Expired' ? 'Expired' : 'Awaiting'}</div>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-base md:text-lg font-bold transition-transform group-hover:scale-110 bg-slate-50 text-slate-400 border border-slate-100 shadow-inner">{((member.firstName?.[0] || '') + (member.lastName?.[0] || '') || member.email.substring(0, 2)).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 truncate text-xs md:text-sm">{member.firstName ? `${member.firstName} ${member.lastName || ''}` : member.email.split('@')[0]}</h4>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 md:mt-1 truncate">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1.5"><span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-indigo-100/50">{member.role || 'Member'}</span><span className="text-[8px] font-bold text-slate-300 uppercase flex items-center gap-1"><Clock size={8} /> Sent {member.sentDate}</span></div>
                    </div>
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => setMemberToDelete({ ...member, isPending: true })} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><X size={18} /></button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'GuestData' && canViewGuestData && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
            <GuestDataView searchTerm={searchTerm} isRTL={isRTL} />
          </div>
        )}
      </div>

      <Modal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} title={editingMemberId ? "Edit Global Member" : "Invite Global Member"} className="max-w-4xl w-full" contentClassName="p-0 overflow-hidden">
        <div className="flex flex-col max-h-[85vh]">
          <div className="flex-1 p-6 sm:p-12 space-y-10 bg-white overflow-y-auto custom-scrollbar pb-24 text-start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              <div className="space-y-2 text-start">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-0.5">FIRST NAME *</label>
                <div className="relative group"><div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"><User size={18} /></div><input type="text" placeholder="John" value={inviteForm.firstName} onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })} className="w-full ps-11 pe-4 py-3.5 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold normal-case text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-start shadow-inner" /></div>
              </div>
              <div className="space-y-2 text-start">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-0.5">LAST NAME</label>
                <div className="relative group"><div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"><User size={18} /></div><input type="text" placeholder="Doe" value={inviteForm.lastName} onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })} className="w-full ps-11 pe-4 py-3.5 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold normal-case text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-start shadow-inner" /></div>
              </div>
              <div className="space-y-2 text-start">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-0.5">EMAIL *</label>
                <div className="relative group"><div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"><Mail size={18} /></div><input type="email" disabled={!!editingMemberId} placeholder="email@work.com" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} className={cn("w-full ps-11 pe-4 py-3.5 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold normal-case text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-start shadow-inner", editingMemberId && "opacity-50 cursor-not-allowed")} /></div>
              </div>
              <div className="space-y-2 text-start">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-0.5">ROLE *</label>
                <div className="relative group">
                  <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none z-10"><Briefcase size={18} /></div>
                  <Select
                    value={inviteForm.roleId}
                    onChange={e => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                    options={[
                      { label: "SELECT A ROLE FROM LIST", value: "" },
                      ...assignableRoles.map(r => ({
                        label: `${r.name.toUpperCase()} [${r.level === 'organization' ? 'ORG' : 'STUDIO'}]`,
                        value: r.id
                      }))
                    ]}
                    className="ps-11 bg-slate-50 border-none rounded-xl font-bold h-[52px] text-[11px] uppercase tracking-wide shadow-inner focus:ring-slate-900/5"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2 text-start pb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-0.5">STUDIO ACCESS</label>
              <div className="relative" ref={studioDropdownRef}>
                <button type="button" onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)} className={cn("w-full bg-slate-50 h-[56px] px-6 rounded-xl border border-transparent flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-all shadow-inner", isStudioDropdownOpen && "ring-2 ring-slate-900")}><span className="truncate">{getStudioDropdownLabel()}</span><ChevronDown size={20} className={cn("text-slate-400 transition-transform duration-300", isStudioDropdownOpen && "rotate-180")} /></button>
                {isStudioDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search studios..." value={studioSearchTerm} onChange={e => setStudioSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-5 py-3 text-xs font-medium focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none text-start" autoFocus /></div></div>
                    <div className="max-h-[320px] overflow-y-auto py-3 custom-scrollbar">
                      <button type="button" onClick={() => toggleStudioSelection('all')} className={cn("w-full px-6 py-4 text-start text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-4", inviteForm.selectedStudioIds.includes('all') ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50")}><div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", inviteForm.selectedStudioIds.includes('all') ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white")}>{inviteForm.selectedStudioIds.includes('all') && <Check size={12} strokeWidth={4} className="text-white" />}</div><Grid size={18} className="text-slate-400" /><span className="flex-1">ALL STUDIOS</span>{inviteForm.selectedStudioIds.includes('all') && <Check size={16} strokeWidth={4} />}</button>
                      {filteredStudioOptions.map(ws => { if (!ws) return null; const isSelected = inviteForm.selectedStudioIds.includes(ws.id); const WSIcon = ws.iconType === 'camera' ? Camera : ws.iconType === 'building' ? Building : ws.iconType === 'star' ? Star : Heart; return (<button type="button" key={ws.id} onClick={() => toggleStudioSelection(ws.id)} className={cn("w-full px-6 py-4 text-start text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-4", isSelected ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50")}><div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white")}>{isSelected && <Check size={12} strokeWidth={4} className="text-white" />}</div><div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">{ws.logo ? (<img src={ws.logo} className="w-full h-full object-contain" alt="" />) : (<WSIcon size={18} className="text-slate-400" />)}</div><span className="flex-1 truncate pr-5">{ws.name}</span>{isSelected && <Check size={16} strokeWidth={4} />}</button>); })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 py-6 sm:px-12 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 z-40">
            <button onClick={() => setIsAddMemberModalOpen(false)} className="w-full sm:w-auto px-8 h-12 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all rounded-xl hover:bg-slate-100">CANCEL</button>
            <Button
              onClick={handleSendInvite}
              disabled={
                !inviteForm.firstName.trim() ||
                !inviteForm.email.trim() ||
                !EMAIL_REGEX.test(inviteForm.email.trim()) ||
                !inviteForm.roleId ||
                inviteForm.selectedStudioIds.length === 0
              }
              className="w-full sm:w-auto sm:min-w-[280px] bg-[#0F172A] hover:bg-[#1E293B] text-white font-black h-14 rounded-xl shadow-2xl shadow-slate-900/10 text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all"
            >
              {editingMemberId ? "SAVE MEMBER DETAILS" : "SEND PLATFORM INVITE"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!managingMembersWorkspace}
        onClose={() => setManagingMembersWorkspace(null)}
        title={`Studio Access: ${managingMembersWorkspace?.name?.toUpperCase() || 'MANAGE'}`}
        className="max-w-2xl w-full"
        contentClassName="p-0 overflow-hidden"
      >
        <div className="bg-white flex flex-col h-[60vh]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="relative group">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900" size={18} />
              <input
                type="text"
                placeholder="Search organization pool..."
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                className="w-full ps-12 pe-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-start"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {managingMembersWorkspace && members.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())).map(member => {
              const isSelected = member.allowedWorkspaceIds?.includes(managingMembersWorkspace?.id);
              const isOwner = member.isOwner || member.role === 'Owner' || member.role === 'SuperAdmin / Owner';

              return (
                <div key={member.id} onClick={() => !isOwner && toggleWorkspaceMember(member.id)} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all", isOwner ? "opacity-70 bg-slate-50 cursor-default" : "cursor-pointer hover:bg-slate-50 hover:border-slate-200", isSelected && !isOwner && "bg-blue-50/30 border-blue-100")}>
                  <div className="flex items-center gap-4 text-start">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm", member.avatarColor || 'bg-slate-200 text-slate-500')}>{member.initials}</div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{member.firstName} {member.lastName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <div className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg tracking-widest">Permanent</div>
                    ) : isSelected ? (
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 tracking-widest flex items-center gap-1"><Check size={10} strokeWidth={4} /> Access Active</div>
                    ) : (
                      <div className="px-3 py-1 bg-white text-slate-400 text-[8px] font-black uppercase rounded-lg border border-slate-200 tracking-widest hover:border-slate-900 hover:text-slate-900 transition-colors">Grant Access</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <Button onClick={() => setManagingMembersWorkspace(null)} className="bg-[#0F172A] px-10 h-11 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg">Done</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!roleToDelete} onClose={() => setRoleToDelete(null)} title={membersWithRoleToDelete.length > 0 ? "Role in Use" : "Safe to Delete"} className="max-w-xl w-full">
        <div className="flex flex-col items-center text-center space-y-6 py-2 text-start transition-all duration-500">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-inner", membersWithRoleToDelete.length > 0 ? "bg-amber-50" : "bg-red-50")}>{membersWithRoleToDelete.length > 0 ? (<ShieldX className="text-amber-600 w-8 h-8" />) : (<Trash2 className="text-red-600 w-8 h-8" />)}</div>
          <div className="space-y-2"><h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight text-center">{membersWithRoleToDelete.length > 0 ? "Cannot Delete Role" : "Confirm Role Deletion"}</h4><p className="text-sm text-slate-500 max-sm mx-auto leading-relaxed text-center font-medium">{membersWithRoleToDelete.length > 0 ? "This role is assigned to the following members. Change their role to enable the delete action." : `Are you sure you want to delete the ${roleToDelete?.name} role?`}</p></div>
          {membersWithRoleToDelete.length > 0 && (
            <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 max-h-72 overflow-y-auto custom-scrollbar p-3 space-y-2 animate-in fade-in duration-300">
              {membersWithRoleToDelete.map(member => (
                <div key={member.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 min-w-0 flex-1 text-start"><div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm", member.avatarColor || 'bg-slate-200 text-slate-500')}>{member.initials}</div><div className="min-w-0"><p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{member.firstName} {member.lastName}</p><p className="text-[10px] text-slate-400 truncate">{member.email}</p></div></div>
                  <div className="w-full sm:w-48">
                    <Select value={member.role} onChange={(e) => {
                      const selectedRole = assignableRoles.find(r => r.name === e.target.value);
                      if (selectedRole) updateMember(member.id, { roleId: selectedRole.id });
                    }} options={assignableRoles.map(r => ({ label: r.name.toUpperCase(), value: r.name }))} className="h-9 py-0 text-[10px] font-bold uppercase tracking-widest bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-none" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"><button onClick={() => setRoleToDelete(null)} className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button><Button onClick={confirmDeleteRole} disabled={membersWithRoleToDelete.length > 0} className={cn("w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300", membersWithRoleToDelete.length > 0 ? "bg-slate-100 text-slate-300 border-none cursor-not-allowed opacity-50" : "bg-red-600 text-white hover:bg-red-700")}>Delete Role</Button></div>
        </div>
      </Modal>

      {/* Role Management Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={editingRoleId ? "EDIT ROLE ACCESS" : "CREATE NEW ROLE"} className="max-w-5xl w-full h-[90vh]" contentClassName="p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full bg-white">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="space-y-2 text-start"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">ROLE TITLE</label><input type="text" placeholder="Role name" value={roleFormName} onChange={e => setRoleFormName(e.target.value)} className="w-full h-12 px-5 rounded-xl border border-slate-200 bg-[#F8FAFC]/50 text-sm font-bold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 normal-case" /></div>
              <div className="space-y-2 text-start"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">ROLE LEVEL</label><Select value={roleFormLevel} onChange={e => setRoleFormLevel(e.target.value as any)} options={[{ label: 'ORGANIZATION LEVEL', value: 'organization' }, { label: 'STUDIO LEVEL', value: 'studio' }]} className="h-12 bg-[#F8FAFC]/50 border-slate-200 font-bold text-[11px] tracking-wide" /></div>
              <div className="space-y-2 text-start"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">DESCRIPTION (OPTIONAL)</label><input type="text" placeholder="Add a brief description..." value={roleFormDescription} onChange={e => setRoleFormDescription(e.target.value)} className="w-full h-12 px-5 rounded-xl border border-slate-200 bg-[#F8FAFC]/50 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 normal-case" /></div>
            </div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-72 bg-[#F8FAFC]/50 border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto no-scrollbar">
              <div className="p-4 md:p-5 space-y-2">
                {PERMISSIONS_LIST.map((group) => { const isActive = activePermissionTab === group.id; const selectedInCategory = group.permissions.filter(p => selectedPermissions.has(p.id)).length; return (<button key={group.id} onClick={() => setActivePermissionTab(group.id)} className={cn("w-full flex items-center justify-between p-3.5 rounded-xl transition-all group", isActive ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-100" : "text-slate-500 hover:bg-slate-100")}><div className="flex items-center gap-3"><div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm", isActive ? "bg-blue-50 text-blue-600" : "bg-white text-slate-300 group-hover:text-slate-400")}>{group.icon}</div><span className={cn("text-[11px] font-bold uppercase tracking-widest", isActive ? "text-blue-700" : "text-slate-400")}>{group.category}</span></div><div className={cn("w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm", isActive ? "bg-blue-600 text-white" : "bg-white text-slate-400")}>{selectedInCategory || group.permissions.length}</div></button>); })}
              </div>
            </div>
            <div className="flex-1 bg-white overflow-y-auto custom-scrollbar p-6 md:p-10">
              <div className="max-w-3xl mx-auto space-y-3">
                {PERMISSIONS_LIST.find(g => g.id === activePermissionTab)?.permissions.map((perm) => { const isSelected = selectedPermissions.has(perm.id); return (<div key={perm.id} onClick={() => togglePermission(perm.id)} className={cn("flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group relative", isSelected ? "bg-blue-50/50 border-blue-200" : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50")}><div className="flex items-start gap-5 text-start w-full"><div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all shadow-sm", isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200 group-hover:border-slate-300")}>{isSelected && <Check size={14} className="text-white stroke-[4px]" />}</div><div className="flex-1 min-w-0 pr-4"><p className={cn("text-[14px] font-bold uppercase tracking-tight mb-1", isSelected ? "text-blue-900" : "text-slate-800")}>{perm.label}</p><p className="text-[12px] text-slate-400 font-medium leading-relaxed">{perm.description}</p></div></div></div>); })}
              </div>
            </div>
          </div>
          <div className="px-6 py-5 md:px-10 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6"><div className="flex flex-col items-center sm:items-start"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">ACTIVE CONFIG</span><span className="text-sm font-bold text-blue-600 uppercase tracking-widest">{selectedPermissions.size} PERMISSIONS</span></div><div className="flex items-center gap-6 w-full sm:w-auto"><button onClick={() => setIsRoleModalOpen(false)} disabled={isSavingRole} className="text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest disabled:opacity-50">Cancel</button><Button onClick={handleSaveRole} disabled={!roleFormName.trim() || isSavingRole} isLoading={isSavingRole} className="bg-[#0F172A] hover:bg-slate-900 text-white font-bold px-12 h-12 rounded-xl shadow-xl active:scale-95 text-[11px] uppercase tracking-[0.2em] w-full sm:w-auto">SAVE</Button></div></div>
        </div>
      </Modal>      <Modal isOpen={!!memberToDelete} onClose={() => setMemberToDelete(null)} title={memberToDelete?.isPending ? "Cancel Invitation" : "Delete Member"}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <div className="space-y-2 text-start">
            <h4 className="text-lg font-bold text-slate-900 text-center">
              {memberToDelete?.isPending ? "Cancel Invitation?" : "Delete Global Member?"}
            </h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed text-center font-medium">
              {memberToDelete?.isPending
                ? `Are you sure you want to cancel the invitation for ${memberToDelete?.email}?`
                : `Are you sure you want to permanently delete ${memberToDelete?.firstName} ${memberToDelete?.lastName}? This will revoke access to all assigned studios.`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full pt-4">
            <Button variant="outline" onClick={() => setMemberToDelete(null)} className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest border-slate-200">Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  if (memberToDelete?.isPending) {
                    await deletePendingMember(memberToDelete.id);
                    showToast({ message: 'Invitation cancelled successfully!', type: 'success' });
                    await fetchInvitations();
                  } else if (memberToDelete) {
                    await deleteMember(memberToDelete.id);
                    showToast({ message: `${memberToDelete.firstName} ${memberToDelete.lastName} deleted successfully!`, type: 'success' });
                    await fetchMembers();
                  }
                  setMemberToDelete(null);
                } catch (error: any) {
                  console.error('Error deleting member:', error);
                  showToast({ message: error.message || 'Failed to delete member. Please try again.', type: 'error' });
                }
              }}
              className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              {memberToDelete?.isPending ? "Remove" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!workspaceToDelete} onClose={() => setWorkspaceToDelete(null)} title="Delete Workspace">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2"><AlertTriangle className="text-red-600 w-8 h-8" /></div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">Delete Studio?</h4>
            <div className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-slate-900">{workspaceToDelete?.name}</span>? This action cannot be undone.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full pt-4">
            <Button variant="outline" onClick={() => setWorkspaceToDelete(null)} className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest border-slate-200">Cancel</Button>
            <Button
              onClick={async () => {
                if (workspaceToDelete) {
                  try {
                    await deleteWorkspace(workspaceToDelete.id);
                    setWorkspaceToDelete(null);
                  } catch (error) {
                    console.error('Error deleting workspace:', error);
                    // Error is already handled in the context
                  }
                }
              }}
              className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const GuestDataView: React.FC<{ searchTerm: string; isRTL: boolean }> = ({ searchTerm, isRTL }) => {
  const [registry, setRegistry] = useState<GuestRecord[]>([]);
  const [sortField, setSortField] = useState<keyof GuestRecord>('accessDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  useEffect(() => { setRegistry(loadGuestRegistry()); }, []);
  const uniqueWorkspaces = useMemo(() => { return Array.from(new Set(registry.map(r => r.workspaceName))).sort(); }, [registry]);
  const filteredData = useMemo(() => { return registry.filter(r => { const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.email.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone.includes(searchTerm); const matchesWorkspace = workspaceFilter === 'all' || r.workspaceName === workspaceFilter; return matchesSearch && matchesWorkspace; }).sort((a, b) => { const valA = a[sortField]; const valB = b[sortField]; if (typeof valA === 'string' && typeof valB === 'string') { return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); } if (typeof valA === 'number' && typeof valB === 'number') { return sortOrder === 'asc' ? valA - valB : valB - valA; } return 0; }); }, [registry, searchTerm, workspaceFilter, sortField, sortOrder]);
  const toggleSort = (field: keyof GuestRecord) => { if (sortField === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); } else { setSortField(field); setSortOrder('desc'); } };
  return (<div className="space-y-6"><div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 mb-8", isRTL && "sm:flex-row-reverse")}><div className="text-start"><h2 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-widest">Guest Lead Intelligence</h2><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Cross-Studio Guest Registry & Activity tracking</p></div><div className="flex items-center gap-3"><div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><select value={workspaceFilter} onChange={(e) => setWorkspaceFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer"><option value="all">All Studios</option>{uniqueWorkspaces.map(ws => <option key={ws} value={ws}>{ws}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} /></div><Button variant="outline" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 bg-white border-slate-200"><Download size={14} /> Export CSV</Button></div></div><div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm overflow-x-auto custom-scrollbar"><table className="w-full text-left border-collapse min-w-[1000px]"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><TableTh label="Guest Identity" field="name" currentField={sortField} order={sortOrder} onSort={toggleSort} /><TableTh label="Studio" field="workspaceName" currentField={sortField} order={sortOrder} onSort={toggleSort} /><TableTh label="Event Target" field="eventName" currentField={sortField} order={sortOrder} onSort={toggleSort} /><TableTh label="Last Access" field="accessDate" currentField={sortField} order={sortOrder} onSort={toggleSort} /><TableTh label="DL Count" field="downloadCount" currentField={sortField} order={sortOrder} onSort={toggleSort} /></tr></thead><tbody className="divide-y divide-slate-50">{filteredData.length === 0 ? (<tr><td colSpan={5} className="py-24 text-center text-slate-300"><div className="flex flex-col items-center justify-center opacity-40"><SearchX size={48} className="mb-4" /><p className="text-[11px] font-black uppercase tracking-widest">No guest records found</p></div></td></tr>) : (filteredData.map(record => (<tr key={record.id} className="hover:bg-slate-50/30 transition-colors group"><td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-black shadow-inner">{record.name.substring(0, 2).toUpperCase()}</div><div className="text-start"><h4 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{record.name}</h4><div className="flex items-center gap-3 mt-1"><span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Mail size={10} /> {record.email}</span><span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Phone size={10} /> {record.phone}</span></div></div></div></td><td className="px-8 py-5"><div className="flex items-center gap-2"><Building size={14} className="text-slate-300" /><span className="text-xs font-bold text-slate-600 uppercase">{record.workspaceName}</span></div></td><td className="px-8 py-5"><div className="flex items-center gap-2"><ImageIcon size={14} className="text-slate-300" /><span className="text-xs font-bold text-slate-600 truncate max-w-[150px] uppercase">{record.eventName}</span></div></td><td className="px-8 py-5"><div className="flex items-center gap-2"><Clock size={14} className="text-slate-300" /><span className="text-xs font-bold text-slate-500 font-mono tracking-tighter">{record.accessDate}</span></div></td><td className="px-8 py-5"><div className="flex items-center gap-3"><div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 shadow-sm">{record.downloadCount} FILES</div>{record.downloadCount > 5 && <Sparkles size={14} className="text-amber-400 animate-pulse" />}</div></td></tr>)))}</tbody></table></div></div>);
};

const TableTh = ({ label, field, currentField, order, onSort }: { label: string, field: keyof GuestRecord, currentField: keyof GuestRecord, order: 'asc' | 'desc', onSort: (f: keyof GuestRecord) => void }) => { const isActive = currentField === field; return (<th className="px-8 py-5 cursor-pointer hover:bg-slate-100/50 transition-colors group" onClick={() => onSort(field)}><div className="flex items-center gap-2"><span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600")}>{label}</span><ArrowUpDown size={12} className={cn("transition-opacity", isActive ? "opacity-100 text-blue-600" : "opacity-0 group-hover:opacity-100 text-slate-300")} /></div></th>); }

const WorkspaceCard = ({ workspace, onOpen, onEdit, onDelete, onManageMembers, canManageMembers, isAdmin }: any) => { const [isMenuOpen, setIsMenuOpen] = useState(false); const { t, isRTL } = useTranslation(); const menuRef = useRef<HTMLDivElement>(null); const Icon = workspace?.iconType === 'camera' ? Camera : workspace?.iconType === 'building' ? Building : workspace?.iconType === 'star' ? Star : Heart; const themeClass = THEME_COLORS[workspace?.colorTheme || 'ocean'] || 'bg-slate-900'; const themeHoverClass = THEME_HOVER[workspace?.colorTheme || 'ocean'] || 'hover:bg-slate-800'; useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false); }; if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [isMenuOpen]); return (<Card className="flex flex-col border-none shadow-sm bg-white rounded-3xl md:rounded-[3.5rem] overflow-hidden group aspect-auto sm:aspect-square transition-all hover:shadow-2xl border border-transparent hover:border-slate-100 relative min-h-[300px] sm:min-h-0 text-start"><div className="p-5 md:p-7 flex-1 flex flex-col min-w-0 h-full"><div className="flex justify-between items-start mb-4">{workspace?.logo ? (<div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 p-1.5 md:p-2 flex items-center justify-center overflow-hidden shadow-inner transition-all group-hover:scale-105"><img src={workspace.logo} alt="Logo" className="w-full h-full object-contain" /></div>) : (<div className={cn("p-2.5 md:p-3.5 rounded-xl md:rounded-2xl text-white shadow-lg transition-all group-hover:rotate-6 flex-shrink-0", themeClass)}><Icon size={20} className="md:w-6 md:h-6" /></div>)}<div className="flex items-center gap-1">{canManageMembers && (<button onClick={(e) => { e.stopPropagation(); onManageMembers(); }} className="p-2 md:p-2.5 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-lg md:rounded-xl flex-shrink-0 shadow-sm" title="Manage Members"><Plus size={18} /></button>)}{isAdmin && (<div className="relative" ref={menuRef}><button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="p-2 md:p-2.5 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-lg md:rounded-xl flex-shrink-0"><MoreVertical size={18} /></button>{isMenuOpen && (<div className={cn("absolute mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50 animate-in zoom-in-95", isRTL ? "left-0" : "right-0")}><button onClick={(e) => { e.stopPropagation(); onEdit(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase text-slate-700 hover:bg-slate-50 tracking-widest transition-colors text-start"><Pencil size={12} /> {t('edit_studio')}</button><button onClick={(e) => { e.stopPropagation(); onDelete(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 tracking-widest transition-colors text-start"><Trash2 size={12} /> {t('delete')}</button></div>)}</div>)}</div></div><div className="flex-1 flex flex-col justify-center min-w-0 space-y-1 mb-4"><h3 className="text-xl md:text-2xl font-bold text-slate-900 truncate tracking-tight w-full leading-tight">{workspace?.name}</h3><p className="text-[9px] md:text-[11px] text-slate-400 line-clamp-1 font-bold opacity-80 uppercase tracking-widest">{workspace?.description}</p></div><div className="space-y-4 mb-4 md:mb-5"><div className="grid grid-cols-3 gap-2 w-full"><div className="flex flex-col min-w-0"><span className="text-lg md:text-xl font-bold text-slate-900 truncate">{workspace?.realEventsCount}</span><span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('events')}</span></div><div className="flex flex-col min-w-0"><span className="text-lg md:text-xl font-bold text-slate-900 truncate">{workspace?.realMembersCount}</span><span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('team')}</span></div><div className="flex flex-col min-w-0"><span className="text-lg md:text-xl font-bold text-slate-900 truncate">{formatBytes(workspace?.realStorage || 0, 0)}</span><span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('storage_label')}</span></div></div><div className="flex items-center justify-between"><div className="flex -space-x-2 md:-space-x-2.5 overflow-hidden">{workspace?.memberAvatars?.slice(0, 4).map((src: string, i: number) => (<img key={i} src={src} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-[2px] md:border-[3px] border-white object-cover shadow-sm bg-slate-100" alt="Member" />))}</div>{workspace?.url && <div className="p-2 md:p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors" title={workspace.url}><Globe size={16} /></div>}</div></div><div className="mt-auto"><button onClick={onOpen} className={cn("w-full text-white h-11 md:h-14 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 group/btn text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em]", themeClass, themeHoverClass)}><span>{t('manage_studio')}</span><ArrowRight size={16} className={cn("md:w-[18px] md:h-[18px] transition-transform", isRTL ? "rotate-180 group-hover/btn:-translate-x-1.5" : "group-hover/btn:translate-x-1.5")} /></button></div></div></Card>); };

export default WorkspacesPage;