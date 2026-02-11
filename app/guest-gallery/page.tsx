import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    CheckCircle2,
    Check,
    FileVideo,
    Play,
    Image as ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { incrementGuestDownloadCount } from '../../constants';
import { Button } from '../../components/ui/Button';
import { formatBytes } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { facesApi } from '../../services/facesApi';
import { downloadMediaWithBranding } from '../../utils/imageProcessor';
import JSZip from 'jszip';

interface LocalMediaItem {
    id: string;
    url: string;
    type: 'photo' | 'video';
    name: string;
    size: number;
    thumbnailUrl?: string;
}

const GuestGalleryPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const {
        matches: stateMatches,
        guestName: stateGuestName,
        guestToken: stateGuestToken,
        eventTitle: stateEventTitle,
        profilePhotoUrl: stateProfilePhotoUrl,
    } = location.state || {};

    const urlJobId = searchParams.get('job_id');

    const [foundPhotos, setFoundPhotos] = useState<LocalMediaItem[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const [guestName] = useState(stateGuestName || 'Guest');
    const [eventTitle] = useState(stateEventTitle || 'Event Gallery');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(stateProfilePhotoUrl || null);

    const parseMatchesToPhotos = (matchData: any[]): LocalMediaItem[] => {
        const photos: LocalMediaItem[] = [];
        const seen = new Set();

        const isNested = matchData[0]?.matches !== undefined;

        const processMatch = (match: any) => {
            if (match.media_id && !seen.has(match.media_id)) {
                seen.add(match.media_id);
                const originalName = match.filename || `photo_${match.media_id.substring(0, 8)}.jpg`;
                photos.push({
                    id: match.media_id,
                    url: match.media_url || match.original_url || '',
                    thumbnailUrl: match.thumbnail_url || match.media_url || match.original_url || '',
                    type: match.mime_type?.startsWith('video') ? 'video' : 'photo',
                    name: originalName,
                    size: match.size_bytes || 0,
                });
            }
        };

        if (isNested) {
            matchData.forEach((faceResult: any) => {
                (faceResult.matches || []).forEach(processMatch);
            });
        } else {
            matchData.forEach(processMatch);
        }
        return photos;
    };

    useEffect(() => {
        if (stateMatches && stateMatches.length > 0) {
            setFoundPhotos(parseMatchesToPhotos(stateMatches));
        }
    }, [stateMatches]);

    useEffect(() => {
        if (!stateMatches && urlJobId && eventId) {
            setIsLoadingFromUrl(true);
            const token = stateGuestToken || sessionStorage.getItem('fotoshare_guest_token') || undefined;

            const loadFromJob = async () => {
                try {
                    const jobStatus = await facesApi.getJobStatus(urlJobId, token);
                    if (jobStatus.status === 'processed' && jobStatus.result) {
                        const matches = (jobStatus.result as any)?.matches || [];
                        const profile = (jobStatus.result as any)?.profile_photo_url || null;
                        setFoundPhotos(parseMatchesToPhotos(matches));
                        if (profile) setProfilePhotoUrl(profile);
                    }
                } catch (e) {
                    console.error('Failed to load job results from URL:', e);
                } finally {
                    setIsLoadingFromUrl(false);
                }
            };
            loadFromJob();
        }
    }, [urlJobId, eventId, stateMatches]);

    // Use same download utility as client-gallery (proven to work)
    const handleDownload = (item: LocalMediaItem) => {
        downloadMediaWithBranding(
            { id: item.id, url: item.url, name: item.name, type: item.type },
            null // no branding for guest gallery
        );
        const guestSessionId = sessionStorage.getItem('photmo_guest_session_id');
        if (guestSessionId) {
            incrementGuestDownloadCount(guestSessionId);
        }
    };

    const handleBatchDownload = async () => {
        setIsDownloading(true);
        setDownloadProgress('Preparing...');

        const itemsToDownload = selectedIds.size > 0
            ? foundPhotos.filter(item => selectedIds.has(item.id))
            : foundPhotos;

        if (itemsToDownload.length === 0) {
            setIsDownloading(false);
            setDownloadProgress(null);
            return;
        }

        // Single item: use direct download
        if (itemsToDownload.length === 1) {
            handleDownload(itemsToDownload[0]);
            setIsDownloading(false);
            setDownloadProgress(null);
            return;
        }

        try {
            const zip = new JSZip();
            let completed = 0;

            for (const item of itemsToDownload) {
                setDownloadProgress(`Downloading ${completed + 1}/${itemsToDownload.length}`);

                try {
                    // Use fetch (same as downloadBlob in imageProcessor.ts)
                    const response = await fetch(item.url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    zip.file(item.name, blob);
                } catch (e) {
                    console.error(`Failed to download ${item.name}:`, e);
                }
                completed++;
            }

            setDownloadProgress('Creating zip...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const safeName = eventTitle.replace(/[^a-zA-Z0-9]/g, '_');
            const zipUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = `${safeName}_photos.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);

            const guestSessionId = sessionStorage.getItem('photmo_guest_session_id');
            if (guestSessionId) {
                incrementGuestDownloadCount(guestSessionId);
            }
        } catch (err) {
            console.error('Batch download failed:', err);
        } finally {
            setIsDownloading(false);
            setDownloadProgress(null);
        }
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

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const goToPrev = useCallback(() => {
        if (lightboxIndex !== null && lightboxIndex > 0) {
            setLightboxIndex(lightboxIndex - 1);
        }
    }, [lightboxIndex]);

    const goToNext = useCallback(() => {
        if (lightboxIndex !== null && lightboxIndex < foundPhotos.length - 1) {
            setLightboxIndex(lightboxIndex + 1);
        }
    }, [lightboxIndex, foundPhotos.length]);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') goToPrev();
            else if (e.key === 'ArrowRight') goToNext();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxIndex, goToPrev, goToNext]);

    if (!eventId) return null;

    if (isLoadingFromUrl) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-500 font-medium">Loading your photos...</p>
                </div>
            </div>
        );
    }

    const isAllSelected = foundPhotos.length > 0 && selectedIds.size === foundPhotos.length;
    const lightboxItem = lightboxIndex !== null ? foundPhotos[lightboxIndex] : null;

    const renderProfileAvatar = () => {
        if (profilePhotoUrl) {
            return (
                <img
                    src={profilePhotoUrl}
                    alt={guestName}
                    className="w-full h-full rounded-full object-cover border-4 border-white"
                />
            );
        }
        const initials = guestName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        return (
            <div className="w-full h-full rounded-full bg-slate-200 border-4 border-white flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-500">{initials}</span>
            </div>
        );
    };

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
                        <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wide truncate">{eventTitle}</h1>
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
                                {downloadProgress || (selectedIds.size > 0 ? `Download (${selectedIds.size})` : 'Download All')}
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center pt-12 pb-10 px-4 text-center bg-white">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-emerald-500">
                        {renderProfileAvatar()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm">
                        <CheckCircle2 size={16} />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {guestName}!</h2>
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
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Matching Photos Found</h3>
                        <p className="text-slate-500 text-sm max-w-md">
                            We couldn't find any photos matching your face. This may happen if photos haven't been uploaded yet or processing is still in progress.
                        </p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                        {foundPhotos.map((item, index) => {
                            const isSelected = selectedIds.has(item.id);
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "break-inside-avoid relative group rounded-xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer",
                                        isSelected ? "ring-4 ring-slate-900 ring-offset-2" : "bg-slate-100 hover:shadow-xl"
                                    )}
                                    onClick={() => openLightbox(index)}
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

                                    {/* Selection Check Circle */}
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

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-white">
                                                <p className="text-[10px] opacity-80 font-medium truncate max-w-[120px]">{item.name}</p>
                                                {item.size > 0 && <p className="text-[10px] opacity-60">{formatBytes(item.size)}</p>}
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

            {/* Lightbox */}
            {lightboxItem && lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    <button
                        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={closeLightbox}
                    >
                        <X size={24} />
                    </button>

                    <div className="absolute top-4 left-4 z-50 text-white/70 text-sm font-medium">
                        {lightboxIndex + 1} / {foundPhotos.length}
                    </div>

                    <button
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-semibold transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(lightboxItem);
                        }}
                    >
                        <Download size={16} />
                        Download
                    </button>

                    {lightboxIndex > 0 && (
                        <button
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                        >
                            <ChevronLeft size={28} />
                        </button>
                    )}

                    {lightboxIndex < foundPhotos.length - 1 && (
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        >
                            <ChevronRight size={28} />
                        </button>
                    )}

                    <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {lightboxItem.type === 'video' ? (
                            <video
                                src={lightboxItem.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[85vh] rounded-lg"
                            />
                        ) : (
                            <img
                                src={lightboxItem.url}
                                alt={lightboxItem.name}
                                className="max-w-full max-h-[85vh] rounded-lg object-contain"
                            />
                        )}
                    </div>

                    {/* Filename below image */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white/50 text-xs font-medium">
                        {lightboxItem.name} {lightboxItem.size > 0 && `• ${formatBytes(lightboxItem.size)}`}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-50">
                <p>Powered by FotoShareAI Technology</p>
            </footer>
        </div>
    );
};

export default GuestGalleryPage;
