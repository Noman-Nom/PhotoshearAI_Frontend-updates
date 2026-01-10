
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Heart, 
  FileVideo, 
  Image as ImageIcon, 
  Lock, 
  X, 
  Check, 
  Grid, 
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Paperclip,
  Smile,
  Send,
  MoreHorizontal,
  Search as SearchIcon,
  Filter,
  ArrowUpDown,
  Globe,
  ChevronDown,
  Scan,
  Maximize2,
  User as UserIcon,
  UserX,
  Sparkles,
  Film
} from 'lucide-react';
import { SHARED_EVENTS, SharedEvent, SharedMediaItem, SharedCollection, saveEventsToStorage } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatBytes } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { downloadMediaWithBranding } from '../../utils/imageProcessor';

interface FaceGroup {
  id: string;
  name: string;
  thumbnailUrl: string;
  items: SharedMediaItem[];
}

const ClientGalleryPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'full'; // 'selection' or 'full'

  const [event, setEvent] = useState<SharedEvent | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'people'>('grid');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
  
  // Face View State
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Selection State (Checkboxes - for downloading/actions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Favorites State (Hearts - for album selection)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [isDownloading, setIsDownloading] = useState(false);
  const [activeBranding, setActiveBranding] = useState<any>(null);
  
  // Create Collection State
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (eventId) {
      const found = SHARED_EVENTS.find(e => e.id === eventId);
      if (found) {
        setEvent(found);
      }
    }
  }, [eventId]);

  // Simulate AI Face Analysis when switching to people mode
  useEffect(() => {
    if (viewMode === 'people' && displayPhotos.length > 0) {
        setIsAnalyzing(true);
        const timer = setTimeout(() => setIsAnalyzing(false), 1500);
        return () => clearTimeout(timer);
    }
  }, [viewMode, activeTab]);

  // Load Branding
  useEffect(() => {
    if (event?.branding && event.brandingId) {
        try {
            const storedBranding = localStorage.getItem('photmo_branding_items_v1');
            if (storedBranding) {
                const items = JSON.parse(storedBranding);
                const brand = items.find((i: any) => i.id === event.brandingId);
                if (brand && brand.status === 'Active') {
                    setActiveBranding(brand);
                }
            }
        } catch (e) {
            console.error("Failed to load branding", e);
        }
    }
  }, [event?.branding, event?.brandingId]);

  // Filter Photos
  const displayPhotos = useMemo(() => {
      if (!event) return [];
      if (event.status !== 'Published') return [];

      let items: SharedMediaItem[] = [];
      if (activeTab === 'ALL') {
          // Flatten all collections
          items = event.collections.flatMap(c => c.items);
          // Remove duplicates if any item exists in multiple collections
          const uniqueMap = new Map();
          items.forEach(item => uniqueMap.set(item.id, item));
          items = Array.from(uniqueMap.values());
      } else {
          const collection = event.collections.find(c => c.id === activeTab);
          items = collection ? collection.items : [];
      }

      // Filter by media type
      if (mediaTypeFilter !== 'all') {
          items = items.filter(item => item.type === mediaTypeFilter);
      }

      return items;
  }, [event, activeTab, mediaTypeFilter]);

  // --- FACE GROUPING LOGIC (Simulated) ---
  const faceGroups = useMemo(() => {
    if (displayPhotos.length === 0) return [];
    
    const groups: Record<string, SharedMediaItem[]> = {};
    // Simulated grouping logic matching the management side
    displayPhotos.forEach((item, index) => {
        const faceId = (index % 5).toString(); 
        if (!groups[faceId]) groups[faceId] = [];
        groups[faceId].push(item);
    });

    return Object.entries(groups).map(([id, groupItems]) => ({
        id,
        name: `Person #${parseInt(id) + 1}`,
        thumbnailUrl: groupItems[0].url,
        items: groupItems
    }));
  }, [displayPhotos]);

  const selectedPerson = useMemo(() => {
    return faceGroups.find(g => g.id === selectedPersonId) || null;
  }, [faceGroups, selectedPersonId]);

  const handleDownload = (item: SharedMediaItem) => {
    downloadMediaWithBranding(item, activeBranding);
  };

  const handleDownloadAll = () => {
    if (displayPhotos.length === 0) return;
    setIsDownloading(true);
    
    // Download visible photos
    displayPhotos.forEach((item, index) => {
        setTimeout(() => {
            handleDownload(item);
            if (index === displayPhotos.length - 1) {
                setIsDownloading(false);
            }
        }, index * 500);
    });
  };

  const handleDownloadSelected = () => {
      const itemsToDownload = displayPhotos.filter(p => selectedIds.has(p.id));
      if (itemsToDownload.length === 0) return;
      
      setIsDownloading(true);
      itemsToDownload.forEach((item, index) => {
        setTimeout(() => {
            handleDownload(item);
            if (index === itemsToDownload.length - 1) {
                setIsDownloading(false);
            }
        }, index * 500);
    });
  };

  const handleCreateCollection = () => {
    if (isCreating) return; 
    if (!newCollectionName.trim() || !event) return;
    
    setIsCreating(true);

    const currentEventId = event.id;
    const currentSelectedIds = new Set(selectedIds);
    const collectionTitle = newCollectionName.trim();
    const newCollectionId = `col_client_${Date.now()}`;

    setTimeout(() => {
        const allItems: SharedMediaItem[] = event.collections.flatMap(c => c.items);
        const uniqueItems: SharedMediaItem[] = Array.from(new Map<string, SharedMediaItem>(allItems.map(item => [item.id, item])).values()); 
        const selectedItems = uniqueItems.filter(item => currentSelectedIds.has(item.id));
        
        if (selectedItems.length === 0) {
            setIsCreating(false);
            return;
        }

        const newCollection: SharedCollection = {
            id: newCollectionId,
            title: collectionTitle,
            photoCount: selectedItems.filter(i => i.type === 'photo').length,
            videoCount: selectedItems.filter(i => i.type === 'video').length,
            items: selectedItems, 
            thumbnailUrl: selectedItems.find(i => i.type === 'photo')?.url
        };

        const eventIndex = SHARED_EVENTS.findIndex(e => e.id === currentEventId);
        if (eventIndex !== -1) {
            const exists = SHARED_EVENTS[eventIndex].collections.some(c => c.id === newCollectionId);
            if (!exists) {
                SHARED_EVENTS[eventIndex].collections.push(newCollection);
                saveEventsToStorage();
            }
        }

        setEvent(prev => {
            if (!prev) return null;
            if (prev.collections.some(c => c.id === newCollectionId)) return prev;
            return {
                ...prev,
                collections: [...prev.collections, newCollection]
            };
        });

        setActiveTab(newCollectionId); 
        setSelectedIds(new Set()); 
        setNewCollectionName('');
        setIsCreateCollectionModalOpen(false);
        setIsCreating(false);
    }, 800);
  };

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setFavorites(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handlePreview = (item: SharedMediaItem) => {
      navigate(`/client-gallery/${eventId}/view/${item.id}?mode=${mode}`);
  };

  const getWatermarkPositionClass = (pos: string) => {
      switch (pos) {
        case 'top-left': return 'top-3 left-3';
        case 'top-center': return 'top-3 left-1/2 -translate-x-1/2';
        case 'top-right': return 'top-3 right-3';
        case 'center-left': return 'top-1/2 left-3 -translate-y-1/2';
        case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
        case 'center-right': return 'top-1/2 right-3 -translate-y-1/2';
        case 'bottom-left': return 'bottom-3 left-3';
        case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2';
        case 'bottom-right': return 'bottom-3 right-3';
        default: return 'top-3 right-3';
      }
  };

  if (!event && !eventId) return null;

  if (event?.status === 'Draft') {
    return (
        <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Event Not Yet Published</h2>
            <p className="text-slate-500 max-w-md">This gallery is currently in draft mode.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white shadow-sm">
            {/* Top Bar */}
            <header className="h-16 px-4 sm:px-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <button 
                        onClick={() => navigate(`/client-access/${eventId}?mode=${mode}`)} 
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500 flex-shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">{event?.title || 'Event Gallery'}</h1>
                        <p className="text-xs text-slate-500 truncate">Photo Results</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">
                        Total Photos {displayPhotos.length}
                    </span>
                    <Button 
                        onClick={handleDownloadAll}
                        isLoading={isDownloading}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg h-9 px-4 shadow-sm whitespace-nowrap"
                    >
                        <Download size={14} className="mr-2" />
                        Download All
                    </Button>
                </div>
            </header>

            {/* Navigation Bar */}
            <div className="h-14 px-4 sm:px-8 border-b border-slate-100 flex items-center justify-between bg-white">
                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-4 flex-1">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                            activeTab === 'ALL' 
                                ? "bg-[#0F172A] text-white" 
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        ALL
                    </button>
                    {event?.collections.map(col => (
                        <button
                            key={col.id}
                            onClick={() => setActiveTab(col.id)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all uppercase",
                                activeTab === col.id 
                                    ? "bg-[#0F172A] text-white" 
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {col.title}
                        </button>
                    ))}
                </div>

                {/* View Toggles & Filters */}
                <div className="flex items-center gap-4 flex-shrink-0 pl-4 border-l border-slate-100">
                    {/* Media Type Filter */}
                    <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setMediaTypeFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                                mediaTypeFilter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setMediaTypeFilter('photo')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                                mediaTypeFilter === 'photo' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ImageIcon size={12} />
                            Photos
                        </button>
                        <button 
                            onClick={() => setMediaTypeFilter('video')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                                mediaTypeFilter === 'video' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Film size={12} />
                            Videos
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap",
                                viewMode === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Grid size={14} />
                            <span className="hidden xl:inline">All Photos</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('people')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap",
                                viewMode === 'people' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Users size={14} />
                            <span className="hidden xl:inline">Group by Person</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Gallery Content */}
        <div className="flex-1 p-4 sm:p-6 bg-white">
            {displayPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <ImageIcon size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No results matching your filter</h3>
                    <p className="text-slate-500 text-sm max-w-md">Try switching tabs or adjusting your filters.</p>
                    <button 
                        onClick={() => { setMediaTypeFilter('all'); setActiveTab('ALL'); }}
                        className="mt-4 text-sm font-bold text-blue-600 hover:underline"
                    >
                        Reset Filters
                    </button>
                </div>
            ) : viewMode === 'people' ? (
                /* FACES VIEW */
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto w-full">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                <Scan className="absolute inset-0 m-auto text-blue-500" size={24} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Analyzing Guest Profiles</h3>
                            <p className="text-xs font-medium">Processing {displayPhotos.length} media items...</p>
                        </div>
                    ) : faceGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <UserX size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">No Faces Detected</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                            {faceGroups.map((group) => (
                                <div 
                                    key={group.id}
                                    onClick={() => setSelectedPersonId(group.id)}
                                    className="group flex flex-col items-center cursor-pointer"
                                >
                                    <div className="relative mb-4 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-slate-100 group-hover:ring-blue-500 group-hover:ring-offset-2 transition-all duration-300">
                                            <img 
                                                src={group.thumbnailUrl} 
                                                alt={group.name} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                        </div>
                                        <div className="absolute inset-0 border-2 border-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-105 pointer-events-none transition-all">
                                             <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-500"></div>
                                             <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-500"></div>
                                             <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-500"></div>
                                             <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-500"></div>
                                        </div>
                                        <div className="absolute -bottom-1 right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">
                                            {group.items.length}
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{group.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Recognized Presence</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayPhotos.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        const isFavorited = favorites.has(item.id);
                        
                        return (
                            <div 
                                key={item.id} 
                                className={cn(
                                    "relative group rounded-lg overflow-hidden cursor-pointer aspect-[3/4] bg-slate-100 transition-all duration-300",
                                    isSelected ? "ring-4 ring-slate-900 ring-offset-1" : "hover:shadow-lg"
                                )}
                                onClick={() => handlePreview(item)}
                            >
                                {item.type === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-900 relative">
                                        <FileVideo size={40} className="text-slate-600" />
                                        {item.url && <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white">VIDEO</div>
                                    </div>
                                ) : (
                                    <img 
                                        src={item.url} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                )}

                                {activeBranding && activeBranding.logo && (
                                    <div className={cn("absolute pointer-events-none z-0", getWatermarkPositionClass(activeBranding.watermarkPosition || 'top-right'))}>
                                        <img 
                                            src={activeBranding.logo} 
                                            alt="watermark" 
                                            className="h-5 object-contain opacity-70 grayscale-[20%] drop-shadow-sm" 
                                        />
                                    </div>
                                )}

                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-200 pointer-events-none",
                                    isSelected || isFavorited ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )} />

                                <div 
                                    className={cn(
                                        "absolute top-3 left-3 z-10 transition-opacity duration-200",
                                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    )}
                                    onClick={(e) => toggleSelection(item.id, e)}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shadow-sm",
                                        isSelected 
                                            ? "bg-slate-900 border-slate-900 text-white" 
                                            : "bg-black/20 border-white hover:bg-black/40"
                                    )}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                </div>

                                <div 
                                    className={cn(
                                        "absolute top-3 right-3 z-10 transition-opacity duration-200",
                                        isFavorited ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    )}
                                    onClick={(e) => toggleFavorite(item.id, e)}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90",
                                        isFavorited 
                                            ? "bg-white text-red-500" 
                                            : "bg-black/20 hover:bg-white/90 text-white hover:text-slate-900 backdrop-blur-sm"
                                    )}>
                                        <Heart size={16} className={cn(isFavorited && "fill-current")} />
                                    </div>
                                </div>

                                {/* ENHANCED HOVER DOWNLOAD BUTTON */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                                        className="pointer-events-auto bg-white text-slate-900 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-50 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 active:scale-95"
                                        title="Download"
                                    >
                                        <Download size={14} strokeWidth={3} />
                                        Download
                                    </button>
                                </div>
                                
                                <div className="absolute bottom-3 left-3 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none pr-12">
                                    <p className="text-[10px] font-bold truncate drop-shadow-md">{item.name}</p>
                                    <p className="text-[8px] opacity-70 font-medium drop-shadow-sm">{formatBytes(item.sizeBytes)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Floating Action Bar */}
        {(selectedIds.size > 0 || favorites.size > 0) && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A] text-white px-4 sm:px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom-6 duration-300 w-[90%] sm:w-auto max-w-lg justify-between sm:justify-center overflow-x-auto no-scrollbar">
                
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                        <span className="text-sm font-bold whitespace-nowrap">{selectedIds.size} Selected</span>
                        <div className="h-4 w-px bg-white/20"></div>
                        
                        <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap"
                        >
                            Clear
                        </button>

                        {mode === 'selection' && (
                            <>
                                <button 
                                    onClick={() => setIsCreateCollectionModalOpen(true)}
                                    className="bg-white text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Plus size={12} />
                                    Create Collection
                                </button>
                                <div className="h-4 w-px bg-white/20"></div>
                            </>
                        )}

                        <button 
                            onClick={handleDownloadSelected}
                            className={cn(
                                "text-xs font-bold hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap",
                                mode === 'selection' ? "text-slate-300 bg-transparent border border-white/20" : "bg-white text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            <Download size={12} />
                            Download
                        </button>
                    </div>
                )}

                {selectedIds.size > 0 && favorites.size > 0 && (
                    <div className="h-6 w-px bg-white/20 mx-2 hidden sm:block"></div>
                )}

                {favorites.size > 0 && (
                    <div className="flex items-center gap-3 flex-shrink-0 ml-auto sm:ml-0">
                        <Heart size={16} className="fill-red-500 text-red-500" />
                        <span className="text-sm font-bold whitespace-nowrap">{favorites.size} Favorites</span>
                    </div>
                )}
            </div>
        )}

        {/* --- MODALS --- */}

        {/* Person Detail Modal (Mirroring management side) */}
        <Modal
            isOpen={!!selectedPersonId}
            onClose={() => setSelectedPersonId(null)}
            title={selectedPerson?.name.toUpperCase() || 'PROFILE DETAILS'}
            className="max-w-6xl w-full h-[85vh]"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-slate-100">
                            <img src={selectedPerson?.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="text-start">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Guest Identity Profile</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Identified in <span className="text-blue-600">{selectedPerson?.items.length} Photos</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => {
                            const items = selectedPerson?.items || [];
                            items.forEach((item, idx) => {
                                setTimeout(() => downloadMediaWithBranding(item, activeBranding), idx * 300);
                            });
                        }} className="bg-[#0F172A] text-xs font-black uppercase tracking-widest h-10 px-6 rounded-xl">
                            <Download size={14} className="mr-2" /> Download Group Results
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {selectedPerson?.items.map((item) => (
                            <div 
                                key={item.id}
                                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm border border-slate-200 hover:border-blue-500 transition-all"
                                onClick={() => handlePreview(item)}
                            >
                                <img src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="p-2 bg-white rounded-lg text-slate-900 shadow-xl">
                                        <Maximize2 size={16} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>

        {/* Create Collection Modal */}
        <Modal 
            isOpen={isCreateCollectionModalOpen} 
            onClose={() => setIsCreateCollectionModalOpen(false)} 
            title="Create Collection"
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-500">
                    Create a new collection with the <span className="font-bold text-slate-900">{selectedIds.size}</span> selected photos.
                </p>
                <Input 
                    label="Collection Name" 
                    placeholder="e.g. My Favorites, Album Selection" 
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateCollectionModalOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCreateCollection} 
                        disabled={!newCollectionName.trim()} 
                        className="bg-[#0F172A] hover:bg-[#1E293B]"
                        isLoading={isCreating}
                    >
                        Create & View
                    </Button>
                </div>
            </div>
        </Modal>

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-50 mt-auto flex-shrink-0">
            <p>Powered by AI Photo Share Platform</p>
        </footer>
    </div>
  );
};

export default ClientGalleryPage;
