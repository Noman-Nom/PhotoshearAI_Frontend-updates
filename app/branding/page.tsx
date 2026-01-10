
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Download, 
  ExternalLink, 
  Layout, 
  Image as ImageIcon,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Upload,
  Check,
  Globe,
  Mail,
  Instagram,
  Youtube,
  Facebook,
  Smartphone,
  Info,
  Move
} from 'lucide-react';
import { Sidebar } from '../../components/shared/Sidebar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../contexts/LanguageContext';

type GridPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface BrandingItem {
  id: string;
  name: string;
  website: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  status: 'Active' | 'Draft';
  lastUpdated: string;
  iconType: 'main' | 'summer' | 'dark' | 'holiday';
  logo?: string;
  watermarkPosition?: GridPosition;
  detailsPosition?: GridPosition;
  logoOpacity?: number;
  logoSize?: number;
  brandOpacity?: number;
  brandSize?: number;
}

const BRANDING_STORAGE_KEY = 'photmo_branding_items_v1';

const BrandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Data State - Initialize from Local Storage
  const [brandingItems, setBrandingItems] = useState<BrandingItem[]>(() => {
    try {
      const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load branding items", e);
      return [];
    }
  });

  // Persist changes to Local Storage
  useEffect(() => {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(brandingItems));
  }, [brandingItems]);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BrandingItem | null>(null);

  // Add/Edit Branding Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Positioning States
  const [watermarkPosition, setWatermarkPosition] = useState<GridPosition>('top-right');
  const [detailsPosition, setDetailsPosition] = useState<GridPosition>('bottom-left');
  const [logoOpacity, setLogoOpacity] = useState(90);
  const [logoSize, setLogoSize] = useState(15);
  const [brandOpacity, setBrandOpacity] = useState(100);
  const [brandSize, setBrandSize] = useState(100);
  
  const [formData, setFormData] = useState({
    brandName: '',
    website: '',
    instagram: '',
    youtube: '',
    facebook: ''
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const filteredData = brandingItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (item: BrandingItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setBrandingItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      
      // Remove from selection if it was selected
      if (selectedIds.has(itemToDelete.id)) {
          const newSet = new Set(selectedIds);
          newSet.delete(itemToDelete.id);
          setSelectedIds(newSet);
      }
      
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Reset form helper
  const resetForm = () => {
    setFormData({
      brandName: '',
      website: '',
      instagram: '',
      youtube: '',
      facebook: ''
    });
    setLogoPreview(null);
    setLogoFile(null);
    setWatermarkPosition('top-right');
    setDetailsPosition('bottom-left');
    setLogoOpacity(90);
    setLogoSize(15);
    setBrandOpacity(100);
    setBrandSize(100);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditClick = (item: BrandingItem) => {
    setEditingId(item.id);
    setFormData({
      brandName: item.name,
      website: item.website === 'N/A' ? '' : item.website,
      instagram: item.instagram || '',
      facebook: item.facebook || '',
      youtube: item.youtube || ''
    });
    setLogoPreview(item.logo || null);
    setWatermarkPosition(item.watermarkPosition || 'top-right');
    setDetailsPosition(item.detailsPosition || 'bottom-left');
    setLogoOpacity(item.logoOpacity ?? 90);
    setLogoSize(item.logoSize ?? 15);
    setBrandOpacity(item.brandOpacity ?? 100);
    setBrandSize(item.brandSize ?? 100);
    setIsAddModalOpen(true);
  };

  // Add Branding Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveBranding = async () => {
      if (formData.brandName) {
          let base64Logo = logoPreview || undefined;

          if (logoFile) {
              try {
                  base64Logo = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(logoFile);
                      reader.onload = () => resolve(reader.result as string);
                      reader.onerror = error => reject(error);
                  });
              } catch (e) {
                  console.error("Failed to convert logo", e);
              }
          }

          if (editingId) {
              // Update existing
              setBrandingItems(prev => prev.map(item => {
                  if (item.id === editingId) {
                      return {
                          ...item,
                          name: formData.brandName,
                          website: formData.website || 'N/A',
                          instagram: formData.instagram,
                          facebook: formData.facebook,
                          youtube: formData.youtube,
                          lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                          logo: base64Logo,
                          watermarkPosition,
                          detailsPosition,
                          logoOpacity,
                          logoSize,
                          brandOpacity,
                          brandSize
                      };
                  }
                  return item;
              }));
          } else {
              // Create new
              const newItem: BrandingItem = {
                  id: Date.now().toString(),
                  name: formData.brandName,
                  website: formData.website || 'N/A',
                  instagram: formData.instagram,
                  facebook: formData.facebook,
                  youtube: formData.youtube,
                  status: 'Active',
                  lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  iconType: 'main',
                  logo: base64Logo,
                  watermarkPosition,
                  detailsPosition,
                  logoOpacity,
                  logoSize,
                  brandOpacity,
                  brandSize
              };
              setBrandingItems(prev => [newItem, ...prev]);
          }
      }
      
      setIsAddModalOpen(false);
      resetForm();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'main':
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-sm">
             <Layout className="text-white w-5 h-5" />
          </div>
        );
      case 'summer':
        return (
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
             <ImageIcon className="w-5 h-5" />
          </div>
        );
      case 'dark':
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-sm">
             <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/50"></div>
          </div>
        );
      case 'holiday':
        return (
          <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
             <ImageIcon className="w-5 h-5" />
          </div>
        );
      default:
        return <div className="w-10 h-10 bg-slate-100 rounded-lg" />;
    }
  };

  const getAbsolutePosition = (pos: GridPosition) => {
      switch(pos) {
          case 'top-left': return 'top-0 left-0';
          case 'top-center': return 'top-0 left-1/2 -translate-x-1/2';
          case 'top-right': return 'top-0 right-0';
          case 'center-left': return 'top-1/2 left-0 -translate-y-1/2';
          case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
          case 'center-right': return 'top-1/2 right-0 -translate-y-1/2';
          case 'bottom-left': return 'bottom-0 left-0';
          case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2';
          case 'bottom-right': return 'bottom-0 right-0';
          default: return 'bottom-0 right-0';
      }
  };

  const getTextAlignment = (pos: GridPosition) => {
      if (pos.includes('left')) return 'text-left items-start';
      if (pos.includes('right')) return 'text-right items-end';
      return 'text-center items-center';
  }

  const getGradientClass = (pos: GridPosition) => {
      if (pos.startsWith('top')) return "bg-gradient-to-b from-black/80 via-black/20 to-transparent";
      if (pos.startsWith('bottom')) return "bg-gradient-to-t from-black/80 via-black/20 to-transparent";
      return "bg-black/40"; 
  }

  const getSocialLink = (platform: string, value: string) => {
      if (!value) return '#';
      let url = value.trim();
      
      if (platform === 'email') return `mailto:${url}`;
      
      if (platform === 'instagram' && url.startsWith('@')) {
          return `https://instagram.com/${url.substring(1)}`;
      }
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${url}`;
      }
      
      return url;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-8 py-6">
          <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4", isRTL && "sm:flex-row-reverse")}>
            <h1 className={cn("text-2xl font-bold text-slate-900", isRTL && "text-right")}>{t('branding_title')}</h1>
            <Button 
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white w-full sm:w-auto"
              onClick={openAddModal}
            >
              <Plus size={18} className={isRTL ? "ml-2" : "mr-2"} />
              {t('add_branding_btn')}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={18} />
              <input 
                type="text" 
                placeholder={t('search_branding_placeholder')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("w-full py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-shadow text-start", isRTL ? "pr-10 pl-4" : "pl-10 pr-4")}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          
          {/* MOBILE VIEW: Card List (< md) */}
          <div className="md:hidden space-y-4">
             {filteredData.length === 0 ? (
                 <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
                     <p>{t('no_branding_found')}</p>
                 </div>
             ) : (
                 filteredData.map(item => (
                     <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-start">
                         {/* Header: Select + Logo + Name + Status */}
                         <div className={cn("flex items-start justify-between mb-4", isRTL && "flex-row-reverse")}>
                             <div className={cn("flex items-center gap-3 overflow-hidden", isRTL && "flex-row-reverse")}>
                                 <input 
                                    type="checkbox" 
                                    checked={selectedIds.has(item.id)}
                                    onChange={() => toggleSelect(item.id)}
                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-5 h-5 flex-shrink-0" 
                                 />
                                 
                                 {/* Logo/Icon */}
                                 <div className="flex-shrink-0">
                                    {item.logo ? (
                                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                                            <img src={item.logo} alt="Brand Logo" className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        getIcon(item.iconType)
                                    )}
                                 </div>

                                 <div className={cn("min-w-0 text-start", isRTL && "text-right")}>
                                     <h3 className="font-bold text-slate-900 text-sm truncate">{item.name}</h3>
                                     <a 
                                        href={item.website !== 'N/A' ? `https://${item.website}` : '#'} 
                                        className="text-xs text-blue-600 truncate block"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                     >
                                        {item.website}
                                     </a>
                                 </div>
                             </div>

                             <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide flex-shrink-0",
                                item.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                                {item.status}
                             </span>
                         </div>

                         {/* Socials Row */}
                         <div className={cn("flex items-center gap-2 mb-4", isRTL ? "pr-9" : "pl-9", isRTL && "flex-row-reverse")}>
                            {item.instagram && (
                                <div className="w-6 h-6 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                                    <Instagram size={12} />
                                </div>
                            )}
                            {item.facebook && (
                                <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                    <Facebook size={12} />
                                </div>
                            )}
                            {item.youtube && (
                                <div className="w-6 h-6 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                                    <Youtube size={12} />
                                </div>
                            )}
                            {!item.instagram && !item.facebook && !item.youtube && (
                                <span className="text-slate-300 text-xs">-</span>
                            )}
                         </div>

                         {/* Footer: Date + Actions */}
                         <div className={cn("flex items-center justify-between pt-3 border-t border-slate-50", isRTL && "flex-row-reverse")}>
                             <span className="text-[10px] text-slate-400 font-medium">Updated {item.lastUpdated}</span>
                             <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                                <button 
                                    onClick={() => handleEditClick(item)} 
                                    className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 border border-slate-100 transition-colors"
                                >
                                    <Pencil size={14}/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(item)} 
                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-100 transition-colors"
                                >
                                    <Trash2 size={14}/>
                                </button>
                             </div>
                         </div>
                     </div>
                 ))
             )}
          </div>

          {/* DESKTOP VIEW: Table (>= md) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className={cn("grid grid-cols-[50px_2fr_2fr_1.5fr_1fr_1fr_80px] gap-4 px-6 py-4 bg-white border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider items-center min-w-[800px] text-start", isRTL && "flex-row-reverse text-right")}>
              <div className="flex justify-center">
                <input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              </div>
              <div>{t('brand_identity_header')}</div>
              <div>{t('website_header')}</div>
              <div>{t('socials_header')}</div>
              <div>{t('status_header')}</div>
              <div>{t('last_updated_header')}</div>
              <div className={isRTL ? "text-left" : "text-right"}>{t('actions_header')}</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-50 overflow-x-auto custom-scrollbar">
              <div className="min-w-[800px]">
              {filteredData.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-3 opacity-20" />
                      <p className="text-sm">{t('no_branding_found')}</p>
                  </div>
              ) : (
                filteredData.map((item) => (
                    <div 
                    key={item.id}
                    className={cn("grid grid-cols-[50px_2fr_2fr_1.5fr_1fr_1fr_80px] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group text-start", isRTL && "flex-row-reverse text-right")}
                    >
                    <div className="flex justify-center">
                        <input 
                        type="checkbox" 
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
                        />
                    </div>
                    
                    <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                        {item.logo ? (
                            <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                                <img src={item.logo} alt="Brand Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            getIcon(item.iconType)
                        )}
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                    </div>

                    <div className={cn("flex items-center gap-1.5 group/link cursor-pointer overflow-hidden", isRTL && "flex-row-reverse")}>
                        <span className="text-sm font-medium text-blue-600 group-hover/link:underline truncate">{item.website}</span>
                        <ExternalLink size={12} className="text-blue-400 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                    </div>

                    {/* Socials Column */}
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        {item.instagram && (
                            <div className="w-6 h-6 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600" title="Instagram">
                                <Instagram size={12} />
                            </div>
                        )}
                        {item.facebook && (
                            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600" title="Facebook">
                                <Facebook size={12} />
                            </div>
                        )}
                        {item.youtube && (
                            <div className="w-6 h-6 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600" title="YouTube">
                                <Youtube size={12} />
                            </div>
                        )}
                        {!item.instagram && !item.facebook && !item.youtube && (
                            <span className="text-slate-300 text-xs">-</span>
                        )}
                    </div>

                    <div>
                        <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wide",
                        item.status === 'Active' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                        {item.status}
                        </span>
                    </div>

                    <div className="text-sm text-slate-500">
                        {item.lastUpdated}
                    </div>

                    <div className={cn("flex gap-2", isRTL ? "justify-start" : "justify-end")}>
                        <button 
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    </div>
                ))
              )}
              </div>
            </div>

            {/* Pagination Footer */}
            {filteredData.length > 0 && (
                <div className={cn("flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50", isRTL && "flex-row-reverse")}>
                <p className="text-xs font-medium text-slate-500">
                    {t('showing_results').replace('{count}', filteredData.length.toString())}
                </p>
                
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <button className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                        {t('previous_btn')}
                    </button>
                    <button className="w-7 h-7 bg-[#0F172A] text-white rounded text-xs font-bold flex items-center justify-center">
                    1
                    </button>
                    <button className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                        {t('next_btn')}
                    </button>
                </div>
                </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('delete_branding_title')}
      >
        <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="text-red-600 w-8 h-8" />
            </div>
            
            <div className="space-y-2 text-center">
                <h4 className="text-lg font-bold text-slate-900">Are you sure?</h4>
                <div className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-slate-900">{itemToDelete?.name}</span>? 
                    This action cannot be undone.
                </div>
            </div>

            <div className={cn("grid grid-cols-2 gap-4 w-full pt-4", isRTL && "flex-row-reverse")}>
                <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full"
                >
                    {t('cancel')}
                </Button>
                <Button 
                    onClick={confirmDelete}
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-600"
                >
                    {t('delete')}
                </Button>
            </div>
        </div>
      </Modal>

      {/* Add/Edit Branding Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingId ? t('edit_brand_identity_title') : t('new_brand_identity_title')}
        className="max-w-7xl w-full h-[90vh]"
        contentClassName="p-0 overflow-hidden flex flex-col"
      >
          <div className={cn("flex flex-col lg:flex-row h-full bg-slate-50 lg:overflow-hidden overflow-y-auto", isRTL && "lg:flex-row-reverse")}>
               {/* Left Column: Form Configuration */}
               <div className="flex-1 flex flex-col border-r border-slate-200 lg:h-full h-auto bg-slate-50">
                   <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-8 h-auto">
                       
                        {/* Section: Watermark & Logo */}
                        <div className="space-y-6">
                           <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-2", isRTL && "sm:flex-row-reverse")}>
                               <div className={cn("text-start", isRTL && "text-right")}>
                                   <h3 className={cn("text-lg font-bold text-slate-900 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                       <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                           <ImageIcon size={18} />
                                       </div>
                                       {t('logo_watermark_section')}
                                   </h3>
                                   <p className={cn("text-sm text-slate-500", isRTL ? "mr-10" : "ml-10")}>{t('logo_watermark_desc')}</p>
                               </div>
                           </div>

                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                               <div className={cn("flex flex-col md:flex-row gap-8", isRTL && "md:flex-row-reverse")}>
                                   {/* Upload */}
                                   <div className="flex-1">
                                        <label className={cn("text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-3 block text-start", isRTL && "text-right")}>{t('upload_logo_label')}</label>
                                        <div 
                                            className={cn(
                                                "w-full aspect-square md:aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative bg-slate-50",
                                                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-100",
                                                logoPreview && "border-solid border-slate-200 bg-white"
                                            )}
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                            onClick={() => !logoPreview && fileInputRef.current?.click()}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleFileChange} 
                                            />
                                            
                                            {logoPreview ? (
                                                <div className="relative w-full h-full p-4 flex items-center justify-center">
                                                    <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                                                    <button 
                                                        onClick={removeLogo}
                                                        className="absolute top-2 right-2 p-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg hover:text-red-500 hover:border-red-200 shadow-sm transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-slate-500">
                                                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Upload size={20} className="text-slate-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-semibold text-slate-700">Click to upload</p>
                                                        <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG (max 2MB)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Logo Controls: Opacity & Size */}
                                        <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Logo Opacity</label>
                                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{logoOpacity}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="10" max="100" 
                                                        value={logoOpacity} 
                                                        onChange={(e) => setLogoOpacity(parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Logo Size</label>
                                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{logoSize}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="5" max="100" 
                                                        value={logoSize} 
                                                        onChange={(e) => setLogoSize(parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                   </div>

                                   {/* Position Selector for Logo */}
                                   <div className="w-full md:w-48">
                                       <label className={cn("text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-3 block text-start", isRTL && "text-right")}>{t('logo_position_label')}</label>
                                       <PositionSelector current={watermarkPosition} onChange={setWatermarkPosition} />
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Section: Brand Identity */}
                       <div className="space-y-6">
                           <div className={cn("text-start", isRTL && "text-right")}>
                               <h3 className={cn("text-lg font-bold text-slate-900 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                   <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                       <Layout size={18} />
                                   </div>
                                   {t('brand_identity_section')}
                               </h3>
                               <p className={cn("text-sm text-slate-500", isRTL ? "mr-10" : "ml-10")}>{t('brand_identity_desc')}</p>
                           </div>

                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative">
                               <div className={cn("absolute top-6 w-32 z-10 hidden sm:block", isRTL ? "left-6" : "right-6")}>
                                   <label className={cn("text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block", isRTL ? "text-left" : "text-right")}>{t('text_position_label')}</label>
                                   <div className={cn("scale-75", isRTL ? "origin-top-left" : "origin-top-right")}>
                                      <PositionSelector current={detailsPosition} onChange={setDetailsPosition} />
                                   </div>
                               </div>
                               
                               {/* Mobile Text Position Selector */}
                               <div className="block sm:hidden mb-4 text-start">
                                   <label className={cn("text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block", isRTL && "text-right")}>{t('text_position_label')}</label>
                                   <PositionSelector current={detailsPosition} onChange={setDetailsPosition} />
                               </div>

                               <div className={cn(isRTL ? "sm:pl-36" : "sm:pr-36")}> 
                                   <ModernInput 
                                       label={`${t('brand_name_label')} *`}
                                       name="brandName"
                                       value={formData.brandName}
                                       onChange={handleInputChange}
                                       placeholder={t('brand_name_placeholder')}
                                       icon={<Layout size={16} />}
                                   />
                               </div>

                               <div>
                                   <ModernInput 
                                       label={t('website_label')}
                                       name="website"
                                       value={formData.website}
                                       onChange={handleInputChange}
                                       placeholder={t('website_placeholder')}
                                       icon={<Globe size={16} />}
                                   />
                               </div>

                               {/* Identity Controls: Opacity & Size */}
                               <div className="pt-6 border-t border-slate-100 space-y-6">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <div className="space-y-3">
                                           <div className="flex justify-between items-center">
                                               <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Identity Opacity</label>
                                               <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{brandOpacity}%</span>
                                           </div>
                                           <input 
                                               type="range" 
                                               min="10" max="100" 
                                               value={brandOpacity} 
                                               onChange={(e) => setBrandOpacity(parseInt(e.target.value))}
                                               className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                           />
                                       </div>
                                       <div className="space-y-3">
                                           <div className="flex justify-between items-center">
                                               <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Identity Size</label>
                                               <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{brandSize}%</span>
                                           </div>
                                           <input 
                                               type="range" 
                                               min="50" max="150" 
                                               value={brandSize} 
                                               onChange={(e) => setBrandSize(parseInt(e.target.value))}
                                               className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                           />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Section: Contact & Social */}
                       <div className="space-y-6">
                           <div className={cn("text-start", isRTL && "text-right")}>
                               <h3 className={cn("text-lg font-bold text-slate-900 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                   <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                       <Smartphone size={18} />
                                   </div>
                                   {t('contact_social_section')}
                               </h3>
                               <p className={cn("text-sm text-slate-500", isRTL ? "mr-10" : "ml-10")}>{t('contact_social_desc')}</p>
                           </div>

                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                               <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", isRTL && "text-right")}>
                                   <ModernInput 
                                       label={t('instagram_label')}
                                       name="instagram"
                                       value={formData.instagram}
                                       onChange={handleInputChange}
                                       placeholder={t('instagram_placeholder')}
                                       icon={<Instagram size={16} />}
                                   />
                                   <ModernInput 
                                       label={t('facebook_label')}
                                       name="facebook"
                                       value={formData.facebook}
                                       onChange={handleInputChange}
                                       placeholder={t('facebook_placeholder')}
                                       icon={<Facebook size={16} />}
                                   />
                                   <ModernInput 
                                       label={t('youtube_label')}
                                       name="youtube"
                                       value={formData.youtube}
                                       onChange={handleInputChange}
                                       placeholder={t('youtube_placeholder')}
                                       icon={<Youtube size={16} />}
                                   />
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Sticky Footer for Buttons */}
                   <div className={cn("p-5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 z-10 sticky bottom-0 lg:static", isRTL && "flex-row-reverse")}>
                        <Button 
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6"
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            onClick={handleSaveBranding}
                            disabled={!formData.brandName.trim()}
                            className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 h-11 text-sm font-bold shadow-md rounded-xl whitespace-nowrap"
                        >
                            {editingId ? t('save') : t('save_branding_btn')}
                        </Button>
                   </div>
               </div>

               {/* Right Column: Sticky Preview */}
               <div className={cn("w-full lg:w-[480px] bg-white border-l border-slate-200 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-10 h-[500px] lg:h-auto flex-shrink-0", isRTL && "border-l-0 border-r")}>
                   <div className={cn("p-6 border-b border-slate-100 flex items-center justify-between", isRTL && "flex-row-reverse")}>
                       <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t('live_preview_label')}</h3>
                       <div className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded border border-green-100">
                           {t('updated_just_now')}
                       </div>
                   </div>

                   <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-6 overflow-y-auto">
                       {/* Preview Card */}
                       <div className="w-full bg-slate-200 rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative group aspect-[4/5] md:aspect-auto md:h-[500px]">
                           {/* Simulated Image */}
                           <img 
                               src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                               className="w-full h-full object-cover"
                               alt="Preview"
                               onError={(e) => {
                                   (e.target as HTMLImageElement).style.display = 'none';
                               }}
                           />
                           
                           {/* Dynamic Overlay Gradient based on Text Position */}
                           <div className={cn("absolute inset-0 pointer-events-none transition-all duration-500", getGradientClass(detailsPosition))} />

                           {/* Watermark Overlay (Logo) */}
                           <div className={cn(
                                "absolute p-4 transition-all duration-300 pointer-events-none",
                                getAbsolutePosition(watermarkPosition)
                           )}>
                                {logoPreview ? (
                                    <img 
                                        src={logoPreview} 
                                        alt="Watermark" 
                                        style={{ opacity: logoOpacity / 100, width: `${logoSize * 5}px` }}
                                        className="object-contain grayscale-[30%] brightness-110 drop-shadow-md" 
                                    />
                                ) : (
                                    <div className="px-4 py-2 border-2 border-white/40 text-white/50 font-bold text-lg tracking-widest uppercase backdrop-blur-[1px]">
                                        {formData.brandName || "LOGO"}
                                    </div>
                                )}
                           </div>

                           {/* Branding Info Overlay (Text & Socials) */}
                           <div className={cn(
                               "absolute p-4 text-white space-y-3 transition-all duration-300 flex flex-col w-full max-w-[80%]",
                               getAbsolutePosition(detailsPosition),
                               getTextAlignment(detailsPosition)
                           )} style={{ opacity: brandOpacity / 100 }}>
                               <div>
                                   <h4 className="font-bold drop-shadow-sm leading-tight" style={{ fontSize: `${(brandSize / 100) * 1.125}rem` }}>{formData.brandName || 'Brand Name'}</h4>
                                   {formData.website && (
                                       <p className="mt-1 font-medium tracking-wide drop-shadow-sm" style={{ fontSize: `${(brandSize / 100) * 0.75}rem`, opacity: 0.8 }}>
                                           {formData.website}
                                       </p>
                                   )}
                               </div>

                               {/* Social Icons Row */}
                               <div className={cn("flex items-center gap-2 pointer-events-auto", isRTL && "flex-row-reverse")}>
                                   {formData.instagram && (
                                     <a 
                                       href={getSocialLink('instagram', formData.instagram)}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="p-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-md shadow-sm hover:bg-white/20 transition-colors" 
                                       title="Instagram"
                                     >
                                       <Instagram size={12} className="text-white" />
                                     </a>
                                   )}
                                   {formData.facebook && (
                                     <a 
                                       href={getSocialLink('facebook', formData.facebook)}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="p-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-md shadow-sm hover:bg-white/20 transition-colors" 
                                       title="Facebook"
                                     >
                                       <Facebook size={12} className="text-white" />
                                     </a>
                                   )}
                                   {formData.youtube && (
                                     <a 
                                       href={getSocialLink('youtube', formData.youtube)}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="p-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-md shadow-sm hover:bg-white/20 transition-colors" 
                                       title="Youtube"
                                     >
                                       <Youtube size={12} className="text-white" />
                                     </a>
                                   )}
                                   
                                   {/* Placeholder if none entered */}
                                   {!formData.instagram && !formData.facebook && !formData.youtube && (
                                     <div className={cn("flex gap-2 opacity-30", isRTL && "flex-row-reverse")}>
                                         <div className="p-1.5 bg-white/10 rounded-full border border-white/5"><Instagram size={12} /></div>
                                         <div className="p-1.5 bg-white/10 rounded-full border border-white/5"><Facebook size={12} /></div>
                                     </div>
                                   )}
                               </div>
                           </div>

                           {/* Label */}
                           <div className={cn("absolute top-4 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 z-20 group-hover:opacity-0 transition-opacity", isRTL ? "right-4" : "left-4")}>
                               {t('client_gallery_view_label')}
                           </div>
                       </div>

                       {/* Helper Text */}
                       <div className={cn("flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-start", isRTL && "text-right flex-row-reverse")}>
                           <Info size={16} className="mt-0.5 flex-shrink-0" />
                           <p className="text-xs leading-relaxed">
                               {t('positioning_tip')}
                           </p>
                       </div>
                   </div>
               </div>
          </div>
      </Modal>
    </div>
  );
};

// Modern Input Component
const ModernInput = ({ label, icon, ...props }: any) => {
    const { isRTL } = useTranslation();
    return (
        <div className="space-y-1.5 text-start">
            <label className={cn("text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 block", isRTL && "text-right")}>{label}</label>
            <div className="relative group">
                <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors", isRTL ? "right-3.5" : "left-3.5")}>
                    {icon}
                </div>
                <input 
                    {...props}
                    className={cn(
                        "w-full py-3 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-start",
                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                    )}
                />
            </div>
        </div>
    );
};

// 3x3 Position Selector Component
const PositionSelector = ({ current, onChange }: { current: GridPosition, onChange: (p: GridPosition) => void }) => {
    const positions: GridPosition[] = [
        'top-left', 'top-center', 'top-right',
        'center-left', 'center', 'center-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];

    return (
        <div className="aspect-square rounded-xl border border-slate-200 bg-slate-50 p-2 grid grid-cols-3 grid-rows-3 gap-1.5 w-full max-w-[200px]">
            {positions.map((pos) => (
                <button
                    key={pos}
                    type="button"
                    onClick={() => onChange(pos)}
                    className={cn(
                        "w-full h-full rounded-md transition-all duration-200 border-2",
                        current === pos 
                            ? "bg-blue-600 border-blue-600 shadow-sm transform scale-105" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                    title={pos.replace('-', ' ')}
                />
            ))}
        </div>
    );
};

export default BrandingPage;
