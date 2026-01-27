import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    Share2,
    CheckCircle2,
    Check,
    FileVideo,
    Play,
    Image as ImageIcon,
    Lock,
    X,
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
    ChevronDown
} from 'lucide-react';
import { incrementGuestDownloadCount } from '../../constants';
import { useEvents } from '../../contexts/EventsContext';
import { Button } from '../../components/ui/Button';
import { formatBytes } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { downloadMediaWithBranding } from '../../utils/imageProcessor';
import { brandingApi } from '../../services/brandingApi';
import { mediaApi } from '../../services/mediaApi';

// Local types for gallery
interface LocalMediaItem {
    id: string;
    url: string;
    type: 'photo' | 'video';
    name: string;
    size: number;
    thumbnailUrl?: string;
}

interface LocalEvent {
    id: string;
    title: string;
    status: string;
    coverUrl: string;
    branding?: boolean;
    brandingId?: string;
    items: LocalMediaItem[];
}

const GuestGalleryPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { matches, guestName: stateGuestName } = location.state || {};

    const { getEventById } = useEvents();
    const [event, setEvent] = useState<LocalEvent | null>(null);
    const [foundPhotos, setFoundPhotos] = useState<LocalMediaItem[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeBranding, setActiveBranding] = useState<any>(null);

    // Mock User Data
    const GUEST_NAME = stateGuestName || "Guest";
    const GUEST_AVATAR = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

    useEffect(() => {
        const loadEvent = async () => {
            if (eventId) {
                const found = await getEventById(eventId);
                if (found) {
                    // Transform API event to local format
                    const localEvent: LocalEvent = {
                        id: found.id,
                        title: found.title,
                        status: found.status === 'published' ? 'Published' : 'Draft',
                        coverUrl: found.cover_url || '',
                        branding: found.branding_enabled,
                        brandingId: found.branding_id || undefined,
                        items: [] // Will be populated from collections API
                    };
                    setEvent(localEvent);

                    // Load photos from matches if available
                    if (localEvent.status === 'Published') {
                        if (matches && matches.length > 0) {
                            const photos: LocalMediaItem[] = [];
                            const seen = new Set();

                            // Matches structure: [ { matches: [ { media_id, media_url ... } ] } ]
                            matches.forEach((faceResult: any) => {
                                (faceResult.matches || []).forEach((match: any) => {
                                    if (match.media_id && !seen.has(match.media_id)) {
                                        seen.add(match.media_id);
                                        photos.push({
                                            id: match.media_id,
                                            url: match.media_url,
                                            thumbnailUrl: match.thumbnail_url || match.media_url, // Fallback
                                            type: match.mime_type?.startsWith('video') ? 'video' : 'photo',
                                            name: 'Matched Photo',
                                            size: 0 // Size might not be available in match result
                                        });
                                    }
                                });
                            });
                            setFoundPhotos(photos);
                        } else {
                            // If no matches passed, maybe we should fetch all photos?
                            // For Guest Gallery, we typically show *their* photos. 
                            // If they arrived without search (e.g. direct link), we might check session.
                            // For now, leave empty if no matches.
                            setFoundPhotos([]);
                        }
                    } else {
                        setFoundPhotos([]);
                    }
                }
            }
        };
        loadEvent();
    }, [eventId, getEventById, matches]);

    // Load Branding Configuration
    useEffect(() => {
        const fetchBranding = async () => {
            if (event?.branding && event.brandingId) {
                try {
                    // Try fetching from API
                    const brand = await brandingApi.getById(event.brandingId);
                    if (brand && brand.status === 'active') {
                        setActiveBranding(brand);
                    } else {
                        setActiveBranding(null);
                    }
                } catch (e) {
                    console.error("Failed to load branding", e);
                    setActiveBranding(null);
                }
            } else {
                setActiveBranding(null);
            }
        };

        fetchBranding();
    }, [event?.branding, event?.brandingId]);

    const handleDownload = (item: LocalMediaItem) => {
        downloadMediaWithBranding(item as any, activeBranding);

        // Track download for Guest Registry
        const guestSessionId = sessionStorage.getItem('photmo_guest_session_id');
        if (guestSessionId) {
            incrementGuestDownloadCount(guestSessionId);
        }
    };

    const handleBatchDownload = async () => {
        setIsDownloading(true);

        const itemsToDownload = selectedIds.size > 0
            ? foundPhotos.filter(item => selectedIds.has(item.id))
            : foundPhotos;

        if (itemsToDownload.length === 0) {
            setIsDownloading(false);
            return;
        }

        // Sequential individual downloads with branding using frontend fetch
        itemsToDownload.forEach((item, index) => {
            setTimeout(() => {
                handleDownload(item);

                if (index === itemsToDownload.length - 1) {
                    setIsDownloading(false);
                }
            }, index * 800);
        });
    };

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === foundPhotos.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(foundPhotos.map(p => p.id)));
        }
    };

    const handlePreview = (item: LocalMediaItem) => {
        navigate(`/guest-gallery/${eventId}/view/${item.id}`);
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
            case 'bottom-center': return 'bottom-3 left-1/2 -translate-x-1/2';
            case 'bottom-right': return 'bottom-3 right-3';
            default: return 'top-3 right-3';
        }
    };

    if (!event && !eventId) return null;

    // Check if draft
    if (event?.status === 'Draft') {
        return (
            <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <Lock size={32} className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Event Not Yet Published</h2>
                <p className="text-slate-500 max-w-md">
                    This gallery is currently in draft mode and is not visible to guests.
                    Please contact the photographer or administrator.
                </p>
            </div>
        );
    }

    const isAllSelected = foundPhotos.length > 0 && selectedIds.size === foundPhotos.length;

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Header */}
            <header className="h-16 px-4 md:px-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <button
                        onClick={() => navigate(`/guest-access/${eventId}`)}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500 flex-shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wide truncate">{event?.title || 'Event Gallery'}</h1>
                        <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", foundPhotos.length > 0 ? "bg-emerald-500" : "bg-slate-300")}></div>
                            <span className="text-xs text-slate-500 truncate">Guest Gallery • {foundPhotos.length} Photos</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pl-2 flex-shrink-0">
                    {foundPhotos.length > 0 && (
                        <>
                            <button
                                onClick={toggleSelectAll}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mr-1 hidden sm:block whitespace-nowrap"
                            >
                                {isAllSelected ? "Deselect All" : "Select All"}
                            </button>
                            <Button
                                onClick={handleBatchDownload}
                                isLoading={isDownloading}
                                className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg h-9 px-3 sm:px-4 shadow-sm whitespace-nowrap"
                            >
                                <Download size={14} className="mr-2" />
                                {selectedIds.size > 0 ? `Download (${selectedIds.size})` : 'Download All'}
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center pt-12 pb-10 px-4 text-center bg-white">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500">
                        <img
                            src={GUEST_AVATAR}
                            alt={GUEST_NAME}
                            className="w-full h-full rounded-full object-cover border-4 border-white"
                        />
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm">
                        <CheckCircle2 size={16} />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {GUEST_NAME}!</h2>
                {foundPhotos.length > 0 ? (
                    <p className="text-slate-500 flex items-center gap-1.5 justify-center">
                        We found <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-sm">{foundPhotos.length} photos</span> of you using AI.
                    </p>
                ) : (
                    <p className="text-slate-500">
                        We couldn't find any photos of you yet.
                    </p>
                )}
            </div>

            {/* Gallery Content */}
            <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
                {foundPhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <ImageIcon size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Media Has not been Added for this Event</h3>
                        <p className="text-slate-500 text-sm max-w-md">
                            It looks like the gallery is empty right now. Please check back later once photos and videos have been uploaded.
                        </p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                        {foundPhotos.map((item) => {
                            const isSelected = selectedIds.has(item.id);
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "break-inside-avoid relative group rounded-xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer",
                                        isSelected ? "ring-4 ring-slate-900 ring-offset-2" : "bg-slate-100 hover:shadow-xl"
                                    )}
                                    onClick={() => handlePreview(item)}
                                >
                                    {item.type === 'video' ? (
                                        <div className="w-full aspect-[4/5] bg-slate-800 flex items-center justify-center relative">
                                            <FileVideo size={48} className="text-slate-600" />
                                            {item.thumbnailUrl ? (
                                                <img src={item.thumbnailUrl} className="absolute inset-0 w-full h-full object-contain opacity-60 bg-slate-900" alt="" />
                                            ) : item.url ? (
                                                <video src={item.url} className="absolute inset-0 w-full h-full object-contain opacity-60 bg-slate-900" />
                                            ) : null}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/50">
                                                    <Play size={20} className="text-white fill-white ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-bold text-white">
                                                VIDEO
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={item.thumbnailUrl || item.url}
                                            alt={item.name}
                                            className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    )}

                                    {/* Branding Watermark Overlay */}
                                    {activeBranding && activeBranding.logo && (
                                        <div className={cn("absolute pointer-events-none transition-all duration-200 z-0", getWatermarkPositionClass(activeBranding.watermarkPosition || 'top-right'))}>
                                            <img
                                                src={activeBranding.logo}
                                                alt="watermark"
                                                className="h-6 object-contain opacity-70 grayscale-[20%] drop-shadow-sm"
                                            />
                                        </div>
                                    )}

                                    {/* Selection Radio/Check Circle (Top Left) */}
                                    <div
                                        className={cn(
                                            "absolute top-3 left-3 z-10 p-1 rounded-full transition-opacity duration-200",
                                            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}
                                        onClick={(e) => toggleSelection(item.id, e)}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors",
                                            isSelected
                                                ? "bg-white border-white text-slate-900"
                                                : "bg-transparent border-white/80 hover:bg-black/40 hover:border-white"
                                        )}>
                                            {isSelected && <Check size={14} className="stroke-[3]" />}
                                        </div>
                                    </div>

                                    {/* Overlay (Bottom) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-white">
                                                <p className="text-[10px] opacity-80 font-medium">{formatBytes(item.sizeBytes)}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-colors">
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(item);
                                            }}
                                            className="w-full mt-3 bg-white text-slate-900 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors shadow-lg active:scale-95"
                                        >
                                            <Download size={14} />
                                            Download {item.type === 'video' ? 'Video' : 'Photo'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-50">
                <p>Powered by FotoShareAI Technology</p>
            </footer>
        </div>
    );
};

export default GuestGalleryPage;
