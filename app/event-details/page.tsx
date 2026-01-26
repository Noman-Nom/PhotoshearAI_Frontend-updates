
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Upload,
    Download,
    Plus,
    ChevronRight,
    ChevronLeft,
    FolderOpen,
    Pencil,
    Trash2,
    AlertTriangle,
    Play,
    FileVideo,
    Grid,
    Users,
    Check,
    X,
    Image as ImageIcon,
    Share2,
    Globe,
    Lock,
    ArrowUpDown,
    Menu,
    Eye,
    EyeOff,
    Film,
    MessageSquare,
    Paperclip,
    Smile,
    Send,
    MoreHorizontal,
    Search as SearchIcon,
    Filter,
    ChevronDown,
    Sparkles,
    Scan,
    User as UserIcon,
    UserX,
    Maximize2,
    Move
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils/cn';
import { Sidebar } from '../../components/shared/Sidebar';
import { useEvents } from '../../contexts/EventsContext';
import { collectionsApi, mediaApi } from '../../services/eventsApi';
import { SHARED_EVENTS, SharedEvent, SharedCollection, SharedMediaItem, saveEventsToStorage } from '../../constants';
import { formatBytes } from '../../utils/formatters';
import { downloadMediaWithBranding } from '../../utils/imageProcessor';
import { useAuth } from '../../contexts/AuthContext';

import { brandingApi } from '../../services/brandingApi';
import { uploadEventMedia } from '../../utils/api';

// Helper to match slug to title
const createSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

interface FaceGroup {
    id: string;
    name: string;
    thumbnailUrl: string;
    items: SharedMediaItem[];
}

const EventDetailsPage: React.FC = () => {
    const { slug, collectionSlug } = useParams<{ slug: string; collectionSlug?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { events, publishEvent, unpublishEvent } = useEvents();
    const [event, setEvent] = useState<SharedEvent | null>(null);
    const [activeCollectionId, setActiveCollectionId] = useState<string>('');
    const [activeBranding, setActiveBranding] = useState<any>(null);

    // Responsive sidebar toggle
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Media Type Filter State
    const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'photo' | 'video'>('all');

    // Sort State
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

    // Drag and Drop State
    const [isDragging, setIsDragging] = useState(false);

    // Add Collection State
    const [isAddCollectionModalOpen, setIsAddCollectionModalOpen] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    // Edit/Delete Collection State
    const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState(false);
    const [isDeleteCollectionModalOpen, setIsDeleteCollectionModalOpen] = useState(false);

    // Unpublish Confirmation Modal State
    const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);

    // Bulk Delete State
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // Move Media Modal State
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [moveSearchQuery, setMoveSearchQuery] = useState('');
    const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
    const [isCreatingInMove, setIsCreatingInMove] = useState(false);
    const [newMoveCollectionName, setNewMoveCollectionName] = useState('');

    // Track which collection is being acted upon
    const [targetCollectionId, setTargetCollectionId] = useState<string | null>(null);

    const [editingName, setEditingName] = useState('');

    // View Mode
    const [viewMode, setViewMode] = useState<'grid' | 'face'>('grid');

    // Face View State
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Media Selection & Actions
    const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
    const [mediaToDelete, setMediaToDelete] = useState<SharedMediaItem | null>(null);

    // Upload Logic
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Computed Values
    const activeCollection = event?.collections.find(c => c.id === activeCollectionId);
    const targetCollection = event?.collections.find(c => c.id === targetCollectionId);

    useEffect(() => {
        if (!slug) return;
        const apiEvent = events.find(e => createSlug(e.title) === slug);

        if (apiEvent) {
            const mappedCollections: SharedCollection[] = apiEvent.collections.map(c => ({
                id: c.id,
                title: c.title,
                photoCount: c.photo_count,
                videoCount: c.video_count,
                thumbnailUrl: c.thumbnail_url || undefined,
                isDefault: c.is_default,
                items: []
            }));

            const mappedEvent: SharedEvent = {
                id: apiEvent.id,
                workspaceId: apiEvent.workspace_id,
                title: apiEvent.title,
                date: apiEvent.event_date,
                status: apiEvent.status === 'published' ? 'Published' : 'Draft',
                coverUrl: apiEvent.cover_url || '',
                totalPhotos: apiEvent.total_photos,
                totalVideos: apiEvent.total_videos,
                totalSizeBytes: apiEvent.total_size_bytes,
                collections: mappedCollections,
                collaborators: apiEvent.collaborators.map(c => c.team_member_id),
                description: apiEvent.description || '',
                type: apiEvent.event_type || 'conference'
            };

            setEvent(mappedEvent);

            if (mappedCollections.length > 0) {
                const defaultCollection = mappedCollections.find(c => c.isDefault) || mappedCollections[0];
                const defaultSlug = createSlug(defaultCollection.title);

                if (!collectionSlug) {
                    navigate(`/events/${slug}/${defaultSlug}`, { replace: true });
                } else {
                    const match = mappedCollections.find(c => createSlug(c.title) === collectionSlug);
                    if (match) {
                        setActiveCollectionId(match.id);
                    } else {
                        navigate(`/events/${slug}/${defaultSlug}`, { replace: true });
                    }
                }
            } else {
                setActiveCollectionId('');
            }
        }
    }, [slug, events, collectionSlug, navigate]);

    // Fetch Media Items for Active Collection
    useEffect(() => {
        if (!activeCollectionId) return;

        const fetchMedia = async () => {
            try {
                const response = await mediaApi.list(activeCollectionId, { pageSize: 100 });
                setEvent(prev => {
                    if (!prev) return null;
                    const newCollections = prev.collections.map(c => {
                        if (c.id === activeCollectionId) {
                            return {
                                ...c,
                                items: response.items.map(m => ({
                                    id: m.id,
                                    type: m.media_type,
                                    url: m.url,
                                    name: m.filename,
                                    sizeBytes: m.size_bytes,
                                    dateAdded: m.created_at
                                }))
                            };
                        }
                        return c;
                    });
                    return { ...prev, collections: newCollections };
                });
            } catch (e) {
                console.error("Failed to fetch media", e);
            }
        };
        fetchMedia();
    }, [activeCollectionId]);

    // Simulate AI Face Analysis when switching to face mode
    useEffect(() => {
        if (viewMode === 'face' && activeCollection?.items.length && activeCollection.items.length > 0) {
            setIsAnalyzing(true);
            const timer = setTimeout(() => setIsAnalyzing(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [viewMode, activeCollectionId]);

    // Load Branding Configuration
    useEffect(() => {
        const fetchBranding = async () => {
            if (event?.branding && event.brandingId) {
                try {
                    // Try fetching from API
                    const brand = await brandingApi.getById(event.brandingId);
                    if (brand && brand.status === 'Active') {
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

    // Reset selection when changing collection
    useEffect(() => {
        setSelectedMediaIds(new Set());
        setSearchQuery('');
        setIsMobileSidebarOpen(false);
        setSelectedPersonId(null);
    }, [activeCollectionId]);

    const navigateToCollection = (collection: SharedCollection) => {
        if (slug) {
            const cSlug = createSlug(collection.title);
            navigate(`/events/${slug}/${cSlug}`);
        }
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

    const getProcessedItems = () => {
        if (!activeCollection) return [];

        // Filter by search AND media type
        let items = activeCollection.items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = mediaTypeFilter === 'all' ? true : item.type === mediaTypeFilter;
            return matchesSearch && matchesType;
        });

        switch (sortOrder) {
            case 'newest':
                items.sort((a, b) => {
                    const getTs = (id: string) => {
                        const parts = id.split('_');
                        return parts.length >= 2 ? parseInt(parts[1]) : 0;
                    };
                    return getTs(b.id) - getTs(a.id);
                });
                break;
            case 'oldest':
                items.sort((a, b) => {
                    const getTs = (id: string) => {
                        const parts = id.split('_');
                        return parts.length >= 2 ? parseInt(parts[1]) : 0;
                    };
                    return getTs(a.id) - getTs(b.id);
                });
                break;
            case 'az':
                items.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'za':
                items.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
        return items;
    };

    // --- FACE GROUPING LOGIC (Simulated) ---
    const faceGroups = useMemo(() => {
        if (!activeCollection || activeCollection.items.length === 0) return [];

        const items = activeCollection.items;
        const groups: Record<string, SharedMediaItem[]> = {};

        // For simulation, we'll assign items to 3-5 hypothetical persons
        // using a simple modulo on the index or hash of the ID
        items.forEach((item, index) => {
            const faceId = (index % 5).toString(); // Deterministic assignment for simulation
            if (!groups[faceId]) groups[faceId] = [];
            groups[faceId].push(item);
        });

        return Object.entries(groups).map(([id, groupItems]) => ({
            id,
            name: `Person #${parseInt(id) + 1}`,
            thumbnailUrl: groupItems[0].url, // Use first item as representative
            items: groupItems
        }));
    }, [activeCollection]);

    const selectedPerson = useMemo(() => {
        return faceGroups.find(g => g.id === selectedPersonId) || null;
    }, [faceGroups, selectedPersonId]);

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim() || !event || !slug) return;

        const tempId = `temp_${Date.now()}`;
        const newCollection: SharedCollection = {
            id: tempId,
            title: newCollectionName.trim(),
            photoCount: 0,
            videoCount: 0,
            items: []
        };

        // Optimistic update - add to local state immediately
        setEvent(prev => {
            if (!prev) return null;
            return { ...prev, collections: [...prev.collections, newCollection] };
        });

        // Also update SHARED_EVENTS for backwards compatibility
        const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
        if (dbEventIndex !== -1) {
            SHARED_EVENTS[dbEventIndex].collections.push(newCollection);
            saveEventsToStorage();
        }

        setNewCollectionName('');
        setIsAddCollectionModalOpen(false);

        const cSlug = createSlug(newCollection.title);
        navigate(`/events/${slug}/${cSlug}`);

        // Call API
        try {
            const apiCollection = await collectionsApi.create(event.id, {
                title: newCollectionName.trim(),
            });

            // Replace temp ID with real ID
            setEvent(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    collections: prev.collections.map(c =>
                        c.id === tempId ? { ...c, id: apiCollection.id } : c
                    )
                };
            });

            // Update SHARED_EVENTS with real ID
            if (dbEventIndex !== -1) {
                const colIndex = SHARED_EVENTS[dbEventIndex].collections.findIndex(c => c.id === tempId);
                if (colIndex !== -1) {
                    SHARED_EVENTS[dbEventIndex].collections[colIndex].id = apiCollection.id;
                    saveEventsToStorage();
                }
            }
        } catch (error) {
            console.error('Failed to create collection:', error);
            // Revert on failure
            setEvent(prev => {
                if (!prev) return null;
                return { ...prev, collections: prev.collections.filter(c => c.id !== tempId) };
            });
            if (dbEventIndex !== -1) {
                SHARED_EVENTS[dbEventIndex].collections = SHARED_EVENTS[dbEventIndex].collections.filter(c => c.id !== tempId);
                saveEventsToStorage();
            }
        }
    };

    const initiateEdit = (collection: SharedCollection, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setTargetCollectionId(collection.id);
        setEditingName(collection.title);
        setIsEditCollectionModalOpen(true);
    };

    const initiateDelete = (collection: SharedCollection, e?: React.MouseEvent) => {
        if (collection.isDefault) return;
        e?.stopPropagation();
        setTargetCollectionId(collection.id);
        setIsDeleteCollectionModalOpen(true);
    };

    const handleEditCollection = async () => {
        if (!event || !targetCollectionId || !editingName.trim()) return;

        const originalTitle = event.collections.find(c => c.id === targetCollectionId)?.title;

        // Optimistic update
        const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
        if (dbEventIndex !== -1) {
            const colIndex = SHARED_EVENTS[dbEventIndex].collections.findIndex(c => c.id === targetCollectionId);
            if (colIndex !== -1) {
                SHARED_EVENTS[dbEventIndex].collections[colIndex].title = editingName.trim();
                saveEventsToStorage();
            }
        }

        const newSlug = createSlug(editingName.trim());

        setEvent(prev => {
            if (!prev) return null;
            return {
                ...prev,
                collections: prev.collections.map(c =>
                    c.id === targetCollectionId ? { ...c, title: editingName.trim() } : c
                )
            };
        });

        setIsEditCollectionModalOpen(false);
        if (targetCollectionId === activeCollectionId && slug) {
            navigate(`/events/${slug}/${newSlug}`, { replace: true });
        }
        setTargetCollectionId(null);

        // Call API
        try {
            await collectionsApi.update(event.id, targetCollectionId, { title: editingName.trim() });
        } catch (error) {
            console.error('Failed to update collection:', error);
            // Revert on failure
            setEvent(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    collections: prev.collections.map(c =>
                        c.id === targetCollectionId ? { ...c, title: originalTitle || '' } : c
                    )
                };
            });
            if (dbEventIndex !== -1) {
                const colIndex = SHARED_EVENTS[dbEventIndex].collections.findIndex(c => c.id === targetCollectionId);
                if (colIndex !== -1) {
                    SHARED_EVENTS[dbEventIndex].collections[colIndex].title = originalTitle || '';
                    saveEventsToStorage();
                }
            }
        }
    };

    const handleDeleteCollection = async () => {
        if (!event || !targetCollectionId || !slug) return;

        const collectionToDelete = event.collections.find(c => c.id === targetCollectionId);
        if (!collectionToDelete || collectionToDelete.isDefault) return;

        const photosToRemove = collectionToDelete.photoCount;
        const videosToRemove = collectionToDelete.videoCount;
        const sizeToRemove = collectionToDelete.items.reduce((acc, item) => acc + item.sizeBytes, 0);

        const newTotalPhotos = Math.max(0, event.totalPhotos - photosToRemove);
        const newTotalVideos = Math.max(0, event.totalVideos - videosToRemove);
        const newTotalSize = Math.max(0, event.totalSizeBytes - sizeToRemove);

        // Store for potential rollback
        const originalCollections = [...event.collections];
        const originalStats = { totalPhotos: event.totalPhotos, totalVideos: event.totalVideos, totalSizeBytes: event.totalSizeBytes };

        // Optimistic update
        const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
        if (dbEventIndex !== -1) {
            SHARED_EVENTS[dbEventIndex].totalPhotos = newTotalPhotos;
            SHARED_EVENTS[dbEventIndex].totalVideos = newTotalVideos;
            SHARED_EVENTS[dbEventIndex].totalSizeBytes = newTotalSize;
            SHARED_EVENTS[dbEventIndex].collections = SHARED_EVENTS[dbEventIndex].collections.filter(c => c.id !== targetCollectionId);
            saveEventsToStorage();
        }

        const newCollections = event.collections.filter(c => c.id !== targetCollectionId);

        setEvent(prev => {
            if (!prev) return null;
            return {
                ...prev,
                collections: newCollections,
                totalPhotos: newTotalPhotos,
                totalVideos: newTotalVideos,
                totalSizeBytes: newTotalSize
            };
        });

        if (targetCollectionId === activeCollectionId) {
            const defaultCol = newCollections.find(c => c.isDefault) || newCollections[0];
            if (defaultCol) {
                navigate(`/events/${slug}/${createSlug(defaultCol.title)}`);
            } else {
                navigate(`/events/${slug}`);
            }
        }

        setIsDeleteCollectionModalOpen(false);
        const deletedCollectionId = targetCollectionId;
        setTargetCollectionId(null);

        // Call API
        try {
            await collectionsApi.delete(event.id, deletedCollectionId);
        } catch (error) {
            console.error('Failed to delete collection:', error);
            // Revert on failure
            setEvent(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    collections: originalCollections,
                    ...originalStats
                };
            });
            if (dbEventIndex !== -1) {
                SHARED_EVENTS[dbEventIndex].collections = originalCollections;
                SHARED_EVENTS[dbEventIndex].totalPhotos = originalStats.totalPhotos;
                SHARED_EVENTS[dbEventIndex].totalVideos = originalStats.totalVideos;
                SHARED_EVENTS[dbEventIndex].totalSizeBytes = originalStats.totalSizeBytes;
                saveEventsToStorage();
            }
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePublishEvent = async () => {
        if (!event) return;
        try {
            await publishEvent(event.id);
            // Update local state
            setEvent(prev => prev ? ({ ...prev, status: 'Published' }) : null);
            // Also update SHARED_EVENTS for backwards compatibility with collections
            const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
            if (dbEventIndex !== -1) {
                SHARED_EVENTS[dbEventIndex].status = 'Published';
                saveEventsToStorage();
            }
        } catch (error) {
            console.error('Failed to publish event:', error);
        }
    };

    const handleUnpublishEvent = () => {
        setIsUnpublishModalOpen(true);
    };

    const confirmUnpublish = async () => {
        if (!event) return;
        try {
            await unpublishEvent(event.id);
            // Update local state
            setEvent(prev => prev ? ({ ...prev, status: 'Draft' }) : null);
            // Also update SHARED_EVENTS for backwards compatibility with collections
            const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
            if (dbEventIndex !== -1) {
                SHARED_EVENTS[dbEventIndex].status = 'Draft';
                saveEventsToStorage();
            }
            setIsUnpublishModalOpen(false);
        } catch (error) {
            console.error('Failed to unpublish event:', error);
        }
    };

    const processFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0 || !event || !activeCollectionId) return;

        const newFiles = Array.from(files);
        const uploadedItems: SharedMediaItem[] = [];
        let batchPhotos = 0;
        let batchVideos = 0;
        let batchSize = 0;

        await Promise.all(newFiles.map(async (file) => {
            try {
                const isVideo = file.type.startsWith('video');
                const result = await uploadEventMedia(event.id, activeCollectionId, file);

                uploadedItems.push({
                    id: result.media_id, // Use real ID from API
                    type: isVideo ? 'video' : 'photo',
                    url: result.media_url,
                    name: file.name,
                    sizeBytes: file.size,
                    dateAdded: new Date().toLocaleDateString()
                });

                if (isVideo) batchVideos++;
                else batchPhotos++;
                batchSize += file.size;

            } catch (error) {
                console.error("Failed to upload", file.name, error);
                // Optionally show toast error here
            }
        }));

        if (uploadedItems.length === 0) return;

        setEvent(prev => {
            if (!prev) return null;
            const currentCollection = prev.collections.find(c => c.id === activeCollectionId);
            if (!currentCollection) return prev;

            const updatedItems = [...uploadedItems, ...currentCollection.items];

            const newCollectionPhotoCount = currentCollection.photoCount + batchPhotos;
            const newCollectionVideoCount = currentCollection.videoCount + batchVideos;

            const newEventTotalPhotos = prev.totalPhotos + batchPhotos;
            const newEventTotalVideos = prev.totalVideos + batchVideos;
            const newEventTotalSize = prev.totalSizeBytes + batchSize;

            let newThumbnailUrl = currentCollection.thumbnailUrl;
            if (!newThumbnailUrl && uploadedItems.some(i => i.type === 'photo')) {
                const firstPhoto = uploadedItems.find(i => i.type === 'photo');
                if (firstPhoto) newThumbnailUrl = firstPhoto.url;
            }

            return {
                ...prev,
                totalPhotos: newEventTotalPhotos,
                totalVideos: newEventTotalVideos,
                totalSizeBytes: newEventTotalSize,
                collections: prev.collections.map(c => {
                    if (c.id === activeCollectionId) {
                        return {
                            ...c,
                            items: updatedItems,
                            photoCount: newCollectionPhotoCount,
                            videoCount: newCollectionVideoCount,
                            thumbnailUrl: newThumbnailUrl
                        };
                    }
                    return c;
                })
            };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
        }
    };

    const toggleMediaSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMediaIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        const activeCollection = event?.collections.find(c => c.id === activeCollectionId);
        if (!activeCollection) return;

        if (selectedMediaIds.size === activeCollection.items.length) {
            setSelectedMediaIds(new Set());
        } else {
            setSelectedMediaIds(new Set(activeCollection.items.map(i => i.id)));
        }
    };

    const handleDownloadMedia = (item: SharedMediaItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        downloadMediaWithBranding(item, activeBranding);
    };

    const handleHeaderDownload = () => {
        const currentCollection = event?.collections.find(c => c.id === activeCollectionId);
        if (!currentCollection) return;

        const itemsToDownload = selectedMediaIds.size > 0
            ? currentCollection.items.filter(i => selectedMediaIds.has(i.id))
            : currentCollection.items;

        if (itemsToDownload.length === 0) {
            alert("No items to download.");
            return;
        }

        itemsToDownload.forEach((item, index) => {
            setTimeout(() => {
                downloadMediaWithBranding(item, activeBranding);
            }, index * 500);
        });
    };

    const confirmDeleteMedia = (item: SharedMediaItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMediaToDelete(item);
    };

    const handlePreview = (item: SharedMediaItem) => {
        const cSlug = collectionSlug || createSlug(activeCollection?.title || 'default-collection');
        navigate(`/events/${slug}/${cSlug}/view/${item.id}`);
    };

    const handleDeleteMedia = () => {
        if (!mediaToDelete || !event || !activeCollectionId) return;

        const itemSize = mediaToDelete.sizeBytes;
        const isVideo = mediaToDelete.type === 'video';

        const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
        if (dbEventIndex !== -1) {
            const ev = SHARED_EVENTS[dbEventIndex];
            ev.totalSizeBytes = Math.max(0, ev.totalSizeBytes - itemSize);
            if (isVideo) ev.totalVideos = Math.max(0, ev.totalVideos - 1);
            else ev.totalPhotos = Math.max(0, ev.totalPhotos - 1);

            const colIndex = ev.collections.findIndex(c => c.id === activeCollectionId);
            if (colIndex !== -1) {
                const col = ev.collections[colIndex];
                col.items = col.items.filter(i => i.id !== mediaToDelete.id);
                if (isVideo) col.videoCount = Math.max(0, col.videoCount - 1);
                else col.photoCount = Math.max(0, col.photoCount - 1);
                if (col.thumbnailUrl === mediaToDelete.url) {
                    const nextPhoto = col.items.find(i => i.type === 'photo');
                    col.thumbnailUrl = nextPhoto ? nextPhoto.url : undefined;
                }
            }
            saveEventsToStorage();
        }

        setEvent(prev => {
            if (!prev) return null;
            const currentCollection = prev.collections.find(c => c.id === activeCollectionId);
            if (!currentCollection) return prev;
            const newItems = currentCollection.items.filter(i => i.id !== mediaToDelete.id);
            const newPhotoCount = isVideo ? currentCollection.photoCount : Math.max(0, currentCollection.photoCount - 1);
            const newVideoCount = isVideo ? Math.max(0, currentCollection.videoCount - 1) : currentCollection.videoCount;
            let newThumbnail = currentCollection.thumbnailUrl;
            if (currentCollection.thumbnailUrl === mediaToDelete.url) {
                const nextPhoto = newItems.find(i => i.type === 'photo');
                newThumbnail = nextPhoto ? nextPhoto.url : undefined;
            }
            return {
                ...prev,
                totalPhotos: isVideo ? prev.totalPhotos : Math.max(0, prev.totalPhotos - 1),
                totalVideos: isVideo ? Math.max(0, prev.totalVideos - 1) : prev.totalVideos,
                totalSizeBytes: Math.max(0, prev.totalSizeBytes - itemSize),
                collections: prev.collections.map(c => {
                    if (c.id === activeCollectionId) {
                        return {
                            ...c,
                            items: newItems,
                            photoCount: newPhotoCount,
                            videoCount: newVideoCount,
                            thumbnailUrl: newThumbnail
                        };
                    }
                    return c;
                })
            };
        });

        if (selectedMediaIds.has(mediaToDelete.id)) {
            setSelectedMediaIds(prev => {
                const next = new Set(prev);
                next.delete(mediaToDelete.id);
                return next;
            });
        }

        setMediaToDelete(null);
    };

    const handleBulkDelete = () => {
        if (!event || !activeCollectionId || selectedMediaIds.size === 0) return;

        const currentCollection = event.collections.find(c => c.id === activeCollectionId);
        if (!currentCollection) return;

        let photosRemoved = 0; let videosRemoved = 0;
        let sizeRemoved = 0;

        const itemsToRemove = currentCollection.items.filter(i => selectedMediaIds.has(i.id));
        itemsToRemove.forEach(item => {
            if (item.type === 'video') videosRemoved++;
            else photosRemoved++;
            sizeRemoved += item.sizeBytes;
        });

        const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
        if (dbEventIndex !== -1) {
            const ev = SHARED_EVENTS[dbEventIndex];
            ev.totalPhotos = Math.max(0, ev.totalPhotos - photosRemoved);
            ev.totalVideos = Math.max(0, ev.totalVideos - videosRemoved);
            ev.totalSizeBytes = Math.max(0, ev.totalSizeBytes - sizeRemoved);
            const colIndex = ev.collections.findIndex(c => c.id === activeCollectionId);
            if (colIndex !== -1) {
                const col = ev.collections[colIndex];
                col.items = col.items.filter(i => !selectedMediaIds.has(i.id));
                col.photoCount = Math.max(0, col.photoCount - photosRemoved);
                col.videoCount = Math.max(0, col.videoCount - videosRemoved);
                if (itemsToRemove.some(i => i.url === col.thumbnailUrl)) {
                    const nextPhoto = col.items.find(i => i.type === 'photo');
                    col.thumbnailUrl = nextPhoto ? nextPhoto.url : undefined;
                }
            }
            saveEventsToStorage();
        }

        setEvent(prev => {
            if (!prev) return null;
            const curCol = prev.collections.find(c => c.id === activeCollectionId);
            if (!curCol) return prev;
            const remainingItems = curCol.items.filter(i => !selectedMediaIds.has(i.id));
            let newThumbnail = curCol.thumbnailUrl;
            if (itemsToRemove.some(i => i.url === curCol.thumbnailUrl)) {
                const nextPhoto = remainingItems.find(i => i.type === 'photo');
                newThumbnail = nextPhoto ? nextPhoto.url : undefined;
            }
            return {
                ...prev,
                totalPhotos: Math.max(0, prev.totalPhotos - photosRemoved),
                totalVideos: Math.max(0, prev.totalVideos - videosRemoved),
                totalSizeBytes: Math.max(0, prev.totalSizeBytes - sizeRemoved),
                collections: prev.collections.map(c => {
                    if (c.id === activeCollectionId) {
                        return {
                            ...c,
                            items: remainingItems,
                            photoCount: Math.max(0, c.photoCount - photosRemoved),
                            videoCount: Math.max(0, c.videoCount - videosRemoved),
                            thumbnailUrl: newThumbnail
                        };
                    }
                    return c;
                })
            };
        });

        setSelectedMediaIds(new Set());
        setIsBulkDeleteModalOpen(false);
    };

    const handleMoveMedia = (targetId?: string) => {
        const destinationId = targetId || selectedDestinationId;
        if (!event || !activeCollectionId || !destinationId || destinationId === activeCollectionId || selectedMediaIds.size === 0) return;

        const sourceCollection = event.collections.find(c => c.id === activeCollectionId);
        let targetCollection = event.collections.find(c => c.id === destinationId);

        // Support creating new collection if destinationId is 'NEW'
        if (destinationId === 'NEW') {
            const newTitle = newMoveCollectionName.trim() || 'New Collection';
            const newCol: SharedCollection = {
                id: `move_new_${Date.now()}`,
                title: newTitle,
                photoCount: 0,
                videoCount: 0,
                items: []
            };
            const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
            if (dbEventIndex !== -1) {
                SHARED_EVENTS[dbEventIndex].collections.push(newCol);
            }
            targetCollection = newCol;
        }

        if (!sourceCollection || !targetCollection) return;

        const itemsToMove = sourceCollection.items.filter(i => selectedMediaIds.has(i.id));
        if (itemsToMove.length === 0) return;

        const movedPhotos = itemsToMove.filter(i => i.type === 'photo').length;
        const movedVideos = itemsToMove.filter(i => i.type === 'video').length;

        const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
        if (dbEventIndex !== -1) {
            const ev = SHARED_EVENTS[dbEventIndex];

            // Update Source Collection
            const srcCol = ev.collections.find(c => c.id === activeCollectionId);
            if (srcCol) {
                srcCol.items = srcCol.items.filter(i => !selectedMediaIds.has(i.id));
                srcCol.photoCount = Math.max(0, srcCol.photoCount - movedPhotos);
                srcCol.videoCount = Math.max(0, srcCol.videoCount - movedVideos);

                // Thumbnail adjustment
                if (itemsToMove.some(i => i.url === srcCol.thumbnailUrl)) {
                    const nextPhoto = srcCol.items.find(i => i.type === 'photo');
                    srcCol.thumbnailUrl = nextPhoto ? nextPhoto.url : undefined;
                }
            }

            // Update Target Collection
            const tgtCol = ev.collections.find(c => c.id === targetCollection?.id);
            if (tgtCol) {
                tgtCol.items = [...itemsToMove, ...tgtCol.items];
                tgtCol.photoCount += movedPhotos;
                tgtCol.videoCount += movedVideos;

                // Set thumbnail if empty
                if (!tgtCol.thumbnailUrl && itemsToMove.some(i => i.type === 'photo')) {
                    tgtCol.thumbnailUrl = itemsToMove.find(i => i.type === 'photo')?.url;
                }
            }

            saveEventsToStorage();
            setEvent({ ...ev });
        }

        setSelectedMediaIds(new Set());
        setIsMoveModalOpen(false);
        setSelectedDestinationId(null);
        setIsCreatingInMove(false);
        setNewMoveCollectionName('');
    };

    const moveModalDestinations = useMemo(() => {
        if (!event) return [];
        return event.collections
            .filter(c => c.id !== activeCollectionId)
            .filter(c => c.title.toLowerCase().includes(moveSearchQuery.toLowerCase()));
    }, [event, activeCollectionId, moveSearchQuery]);

    if (!event) return null;

    const hasMediaInTarget = targetCollection ? targetCollection.items.length > 0 : false;
    const allSelected = activeCollection && activeCollection.items.length > 0 && selectedMediaIds.size === activeCollection.items.length;

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*,video/*"
                className="hidden"
            />

            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative pb-16 md:pb-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <button
                            onClick={() => navigate('/my-events')}
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors flex-shrink-0"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                            <h1 className="text-sm md:text-lg font-bold text-slate-900 truncate">{event.title}</h1>
                            <span className="text-sm text-slate-400 font-light hidden lg:inline-block">|</span>
                            <span className="text-sm text-slate-500 hidden lg:inline-block">{event.date}</span>
                            <span className="text-sm text-slate-400 font-light hidden lg:inline-block">|</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border hidden md:inline-block",
                                event.status === 'Published'
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                                {event.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative hidden xl:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search media..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 w-64"
                            />
                        </div>

                        <button
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        >
                            <FolderOpen size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            {event.status === 'Draft' ? (
                                <Button onClick={handlePublishEvent} className="h-9 px-3 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                                    <Eye size={14} /> <span className="hidden md:inline">Publish Event</span>
                                </Button>
                            ) : (
                                <Button onClick={handleUnpublishEvent} className="h-9 px-3 text-xs gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
                                    <EyeOff size={14} /> <span className="hidden md:inline">Unpublish</span>
                                </Button>
                            )}

                            <Button
                                onClick={() => { setIsCreatingInMove(false); setIsMoveModalOpen(true); }}
                                disabled={selectedMediaIds.size === 0}
                                className="h-9 w-9 p-0 md:w-auto md:px-3 text-xs gap-2 bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                                title="Move"
                            >
                                <Move size={14} />
                                <span className="hidden md:inline">
                                    Move {selectedMediaIds.size > 0 ? `(${selectedMediaIds.size})` : ''}
                                </span>
                            </Button>

                            <Button onClick={() => navigate(`/share-event/${event.id}`)} className="h-9 w-9 p-0 md:w-auto md:px-3 text-xs gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900" title="Share">
                                <Share2 size={14} /> <span className="hidden md:inline">Share</span>
                            </Button>
                            <Button onClick={handleUploadClick} className="h-9 w-9 p-0 md:w-auto md:px-3 text-xs gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900" title="Upload">
                                <Upload size={14} /> <span className="hidden md:inline">Upload</span>
                            </Button>
                            <Button onClick={handleHeaderDownload} className="h-9 w-9 p-0 md:w-auto md:px-3 text-xs bg-[#0F172A] hover:bg-[#1E293B] gap-2" title="Download">
                                <Download size={14} /> <span className="hidden md:inline">{selectedMediaIds.size > 0 ? `Download (${selectedMediaIds.size})` : 'Download All'}</span>
                            </Button>
                            {selectedMediaIds.size > 0 && (
                                <Button onClick={() => setIsBulkDeleteModalOpen(true)} className="h-9 w-9 p-0 bg-red-600 hover:bg-red-700 text-white border-transparent" title="Delete Selected">
                                    <Trash2 size={14} />
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden relative">
                    <aside className={cn(
                        "w-72 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 z-30 transition-transform duration-300 absolute md:relative top-0 bottom-0 left-0",
                        isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
                    )}>
                        <div className="md:hidden absolute top-2 right-2 z-10">
                            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 pb-0">
                            <div className="aspect-video w-full rounded-lg overflow-hidden relative shadow-sm border border-slate-100 mb-4">
                                <img src={event.coverUrl} className="w-full h-full object-cover" alt="Event Cover" />
                            </div>
                            <div className="flex items-center justify-center gap-10 border-b border-slate-100 pb-5">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-slate-900 text-lg leading-none">{event.totalPhotos}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Photos</span>
                                </div>
                                <div className="w-px h-8 bg-slate-100" />
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-slate-900 text-lg leading-none">{event.totalVideos}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Videos</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-5">
                            <button onClick={() => setIsAddCollectionModalOpen(true)} className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold shadow-sm transition-all">
                                <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center"><Plus size={10} /></div>
                                Add Collection
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-6">
                            <div className="space-y-1">
                                {event.collections.map(collection => (
                                    <div key={collection.id} role="button" tabIndex={0} onClick={() => navigateToCollection(collection)} className={cn("w-full flex items-center p-2 rounded-lg transition-all group relative cursor-pointer border", activeCollectionId === collection.id ? "bg-blue-50 border-blue-100" : "bg-white border-transparent hover:bg-slate-50")}>
                                        <div className={cn("w-10 h-10 rounded-md flex-shrink-0 overflow-hidden border mr-3 flex items-center justify-center transition-colors", activeCollectionId === collection.id ? "border-blue-200 bg-white" : "border-slate-100 bg-slate-50")}>
                                            {collection.thumbnailUrl ? (
                                                <img src={collection.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <FolderOpen size={16} className={cn(activeCollectionId === collection.id ? "text-blue-500" : "text-slate-400")} />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <h4 className={cn("text-xs font-bold truncate", activeCollectionId === collection.id ? "text-blue-700" : "text-slate-700")}>{collection.title}</h4>
                                            <p className={cn("text-[10px] mt-0.5 font-medium", activeCollectionId === collection.id ? "text-blue-400" : "text-slate-400")}>{collection.photoCount} Photos, {collection.videoCount} Videos</p>
                                        </div>
                                        <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 flex items-center bg-white shadow-sm border border-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10", activeCollectionId === collection.id && "bg-blue-50 border-blue-200")}>
                                            <button onClick={(e) => initiateEdit(collection, e)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Rename"><Pencil size={12} /></button>
                                            {!collection.isDefault && (
                                                <button onClick={(e) => initiateDelete(collection, e)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                        {activeCollectionId === collection.id && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 group-hover:opacity-0 transition-opacity"><ChevronRight size={14} className="text-blue-500" /></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {isMobileSidebarOpen && <div className="md:hidden absolute inset-0 bg-black/50 z-20 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />}

                    <main
                        className="flex-1 flex flex-col h-full overflow-hidden bg-white w-full relative"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Drag and Drop Overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 z-50 bg-blue-600/10 backdrop-blur-[2px] border-4 border-dashed border-blue-500 m-4 rounded-[2rem] flex flex-col items-center justify-center p-8 pointer-events-none animate-in fade-in duration-200">
                                <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 border border-slate-100">
                                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-bounce">
                                        <Upload size={48} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Drop to Upload</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-2">
                                            Adding files to <span className="font-bold text-blue-600">"{activeCollection?.title}"</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Media Header with Enhanced Filtering */}
                        <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-base md:text-lg font-bold text-slate-900 whitespace-nowrap">All Media</h2>
                                    <button onClick={handleSelectAll} className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {/* TYPE FILTER TOGGLE */}
                                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setMediaTypeFilter('all')}
                                        className={cn(
                                            "flex items-center justify-center px-3 py-1 rounded-md text-[10px] font-bold transition-all gap-1.5 uppercase tracking-wide",
                                            mediaTypeFilter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setMediaTypeFilter('photo')}
                                        className={cn(
                                            "flex items-center justify-center px-3 py-1 rounded-md text-[10px] font-bold transition-all gap-1.5 uppercase tracking-wide",
                                            mediaTypeFilter === 'photo' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <ImageIcon size={12} />
                                        <span className="hidden lg:inline">Photos</span>
                                    </button>
                                    <button
                                        onClick={() => setMediaTypeFilter('video')}
                                        className={cn(
                                            "flex items-center justify-center px-3 py-1 rounded-md text-[10px] font-bold transition-all gap-1.5 uppercase tracking-wide",
                                            mediaTypeFilter === 'video' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <Film size={12} />
                                        <span className="hidden lg:inline">Videos</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "flex items-center px-2 md:px-3 py-1.5 rounded-md text-xs font-semibold transition-all gap-2",
                                        viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Grid size={14} />
                                    <span className="hidden sm:inline">Grid</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('face')}
                                    className={cn(
                                        "flex items-center px-2 md:px-3 py-1.5 rounded-md text-xs font-semibold transition-all gap-2",
                                        viewMode === 'face' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Users size={14} />
                                    <span className="hidden sm:inline">Faces</span>
                                </button>

                                <div className="h-8 w-px bg-slate-200 mx-1 md:mx-2 hidden sm:block"></div>

                                <div className="relative hidden sm:block">
                                    <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as any)}
                                        className="pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 appearance-none cursor-pointer hover:bg-white transition-colors h-full"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="az">Name (A-Z)</option>
                                        <option value="za">Name (Z-A)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Media Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
                            {viewMode === 'face' ? (
                                /* FACES VIEW */
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                            <div className="relative mb-6">
                                                <div className="w-16 h-16 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                                <Scan className="absolute inset-0 m-auto text-blue-500" size={24} />
                                            </div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Analyzing Facial Recognition</h3>
                                            <p className="text-xs font-medium">Scanning {activeCollection?.items.length} media items...</p>
                                        </div>
                                    ) : faceGroups.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                            <UserX size={48} className="mb-4 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No Faces Detected</p>
                                            <p className="text-xs mt-2">AI could not identify unique people in this collection.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                                            {faceGroups.map((group) => (
                                                <div
                                                    key={group.id}
                                                    onClick={() => setSelectedPersonId(group.id)}
                                                    className="group flex flex-col items-center cursor-pointer"
                                                >
                                                    <div className="relative mb-4 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                                                        {/* Circular Avatar */}
                                                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-slate-100 group-hover:ring-blue-500 group-hover:ring-offset-2 transition-all duration-300">
                                                            <img
                                                                src={group.thumbnailUrl}
                                                                alt={group.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        </div>
                                                        {/* AI Face Box Simulated Overlay on Hover */}
                                                        <div className="absolute inset-0 border-2 border-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-105 pointer-events-none transition-all">
                                                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-500"></div>
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-500"></div>
                                                            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-500"></div>
                                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-500"></div>
                                                        </div>
                                                        {/* Count Badge */}
                                                        <div className="absolute -bottom-1 right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">
                                                            {group.items.length}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{group.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1">SIMILAR FACES</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* STANDARD GRID VIEW */
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 w-full content-start pb-24 md:pb-0">

                                    <div
                                        onClick={handleUploadClick}
                                        className="group aspect-square border-2 border-dashed border-slate-200 rounded-xl md:rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300"
                                    >
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 group-hover:shadow-sm transition-all duration-300 mb-2 md:mb-3">
                                            <Plus size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-[10px] md:text-xs font-bold text-slate-500 group-hover:text-blue-600">Add Files</span>
                                    </div>

                                    {getProcessedItems().map((item) => {
                                        const isSelected = selectedMediaIds.has(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer shadow-sm border transition-all duration-200",
                                                    isSelected ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2" : "border-slate-200 hover:border-slate-300"
                                                )}
                                                onClick={() => handlePreview(item)}
                                            >
                                                {item.type === 'photo' ? (
                                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 relative">
                                                        <FileVideo size={32} className="text-slate-600 absolute" />
                                                        {item.url && <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/50 shadow-sm"><Play size={16} className="text-white fill-white ml-0.5" /></div>
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-bold text-white">VIDEO</div>
                                                    </div>
                                                )}
                                                {activeBranding && activeBranding.logo && (
                                                    <div className={cn("absolute pointer-events-none transition-all duration-200 z-0", getWatermarkPositionClass(activeBranding.watermarkPosition || 'top-right'))}>
                                                        <img src={activeBranding.logo} alt="watermark" className="h-6 object-contain opacity-70 grayscale-[20%] drop-shadow-sm" />
                                                    </div>
                                                )}
                                                <div className={cn("absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 transition-opacity duration-200 pointer-events-none", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
                                                <div className={cn("absolute top-3 left-3 transition-all duration-200 z-10 cursor-pointer", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")} onClick={(e) => toggleMediaSelection(item.id, e)}>
                                                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm", isSelected ? "bg-white border-white text-slate-900" : "bg-transparent border-white/80 hover:border-white hover:bg-black/40")}>
                                                        {isSelected && <Check size={12} className="stroke-[3]" />}
                                                    </div>
                                                </div>
                                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                                    <button onClick={(e) => confirmDeleteMedia(item, e)} className="p-1.5 bg-black/40 hover:bg-red-600 backdrop-blur-sm rounded-lg text-white transition-colors border border-white/20 shadow-sm" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 w-max hidden sm:block">
                                                    <button onClick={(e) => handleDownloadMedia(item, e)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-md text-[10px] font-bold shadow-lg hover:bg-slate-100 transition-colors transform translate-y-2 group-hover:translate-y-0"><Download size={12} /> Download</button>
                                                </div>
                                                <div className={cn("absolute bottom-0 left-0 right-0 p-3 text-white transition-all duration-200 pointer-events-none", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                                    <p className="text-[10px] font-semibold truncate leading-tight drop-shadow-sm pr-2">{item.name}</p>
                                                    <p className="text-[9px] text-slate-300 font-medium mt-0.5">{formatBytes(item.sizeBytes)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Empty results message */}
                                    {getProcessedItems().length === 0 && searchQuery && (
                                        <div className="col-span-full py-12 text-center text-slate-400">
                                            <ImageIcon size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No results matching your filter</p>
                                            <button onClick={() => { setSearchQuery(''); setMediaTypeFilter('all'); }} className="mt-2 text-xs text-blue-600 hover:underline">Clear all filters</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Move Media Modal */}
            <Modal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                title={`Move ${selectedMediaIds.size} ${selectedMediaIds.size === 1 ? 'file' : 'files'}`}
                className="max-w-md w-full"
                contentClassName="p-0 overflow-hidden flex flex-col"
            >
                <div className="bg-white flex flex-col max-h-[70vh]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative group">
                            <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search destination collection..."
                                value={moveSearchQuery}
                                onChange={e => setMoveSearchQuery(e.target.value)}
                                className="w-full ps-11 pe-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-start shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        <button
                            onClick={() => { setIsCreatingInMove(true); setSelectedDestinationId('NEW'); }}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all border",
                                selectedDestinationId === 'NEW' ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-transparent hover:bg-slate-50"
                            )}
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md flex-shrink-0">
                                <Plus size={18} strokeWidth={3} />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="text-xs font-black uppercase text-slate-900">Create New Collection</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Move to a new folder</p>
                            </div>
                            {selectedDestinationId === 'NEW' && <Check size={16} className="text-blue-600" strokeWidth={3} />}
                        </button>

                        {isCreatingInMove && selectedDestinationId === 'NEW' && (
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 mx-1 mb-2 animate-in slide-in-from-top-2">
                                <Input
                                    placeholder="New Collection Title"
                                    value={newMoveCollectionName}
                                    onChange={e => setNewMoveCollectionName(e.target.value)}
                                    autoFocus
                                    className="text-xs h-10 bg-white"
                                />
                            </div>
                        )}

                        <div className="h-px bg-slate-100 mx-2 my-2" />

                        {moveModalDestinations.length === 0 ? (
                            <div className="py-12 text-center text-slate-300">
                                <p className="text-[10px] font-black uppercase tracking-widest">No other collections found</p>
                            </div>
                        ) : (
                            moveModalDestinations.map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => { setIsCreatingInMove(false); setSelectedDestinationId(col.id); }}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all border",
                                        selectedDestinationId === col.id ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-transparent hover:bg-slate-50"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-white flex-shrink-0">
                                        {col.thumbnailUrl ? (
                                            <img src={col.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                <FolderOpen size={16} className="text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="text-xs font-bold text-slate-900 truncate">{col.title}</h4>
                                        <p className="text-[10px] text-slate-400 font-medium">{col.photoCount} Photos • {col.videoCount} Videos</p>
                                    </div>
                                    {selectedDestinationId === col.id && <Check size={16} className="text-blue-600" strokeWidth={3} />}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsMoveModalOpen(false)}
                            className="flex-1 bg-white h-11 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleMoveMedia()}
                            disabled={!selectedDestinationId || (selectedDestinationId === 'NEW' && !newMoveCollectionName.trim())}
                            className="flex-1 bg-[#0F172A] h-11 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg"
                        >
                            Move ({selectedMediaIds.size})
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Person Detail Modal (Face Group Result) */}
            <Modal
                isOpen={!!selectedPersonId}
                onClose={() => setSelectedPersonId(null)}
                title={selectedPerson?.name.toUpperCase() || 'PERSON DETAILS'}
                className="max-w-6xl w-full h-[85vh]"
                contentClassName="p-0 overflow-hidden flex flex-col"
            >
                <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                    {/* Header / Info Strip */}
                    <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-slate-100">
                                <img src={selectedPerson?.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="text-start">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">AI Identified Profile</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Detected in <span className="text-blue-600">{selectedPerson?.items.length} Files</span>
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
                                <Download size={14} className="mr-2" /> Download All Result
                            </Button>
                        </div>
                    </div>

                    {/* Content Area - Filtered Media Grid */}
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

            <Modal isOpen={isAddCollectionModalOpen} onClose={() => setIsAddCollectionModalOpen(false)} title="Create New Collection">
                <div className="space-y-4">
                    <Input label="Collection Name" placeholder="e.g. Reception, Pre-wedding Shoot" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} autoFocus />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsAddCollectionModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()} className="bg-[#0F172A]">Create</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEditCollectionModalOpen} onClose={() => setIsEditCollectionModalOpen(false)} title="Rename Collection">
                <div className="space-y-4">
                    <Input label="Collection Name" placeholder="Enter new name" value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsEditCollectionModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditCollection} disabled={!editingName.trim()} className="bg-[#0F172A]">Save</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDeleteCollectionModalOpen} onClose={() => setIsDeleteCollectionModalOpen(false)} title="Delete Collection">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2"><AlertTriangle className="text-red-600 w-8 h-8" /></div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">{hasMediaInTarget ? 'Contains Media' : 'Delete this collection?'}</h4>
                        <div className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                            {hasMediaInTarget ? (
                                <>This collection has <span className="font-bold text-slate-900">{targetCollection?.photoCount} photos</span> and <span className="font-bold text-slate-900">{targetCollection?.videoCount} videos</span>.<br />Are you sure you want to delete <span className="font-semibold text-slate-900">{targetCollection?.title}</span>? All items inside will be permanently lost.</>
                            ) : (<>Are you sure you want to delete <span className="font-semibold text-slate-900">{targetCollection?.title}</span>? </>)}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteCollectionModalOpen(false)} className="w-full">Cancel</Button>
                        <Button onClick={handleDeleteCollection} className="w-full bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-600">{hasMediaInTarget ? 'Delete Anyway' : 'Delete'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isUnpublishModalOpen} onClose={() => setIsUnpublishModalOpen(false)} title="Unpublish Event">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-2"><Lock className="text-amber-600 w-8 h-8" /></div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">Unpublish Event?</h4>
                        <div className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">Are you sure you want to unpublish this event? It will become unavailable for your client.</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                        <Button variant="outline" onClick={() => setIsUnpublishModalOpen(false)} className="w-full">Cancel</Button>
                        <Button onClick={confirmUnpublish} className="w-full bg-amber-600 hover:bg-amber-700 text-white border-transparent focus:ring-amber-600">Unpublish</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!mediaToDelete} onClose={() => setMediaToDelete(null)} title="Delete Media">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2"><Trash2 className="text-red-600 w-8 h-8" /></div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">Delete this item?</h4>
                        <div className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">Are you sure you want to delete <span className="font-semibold text-slate-900">{mediaToDelete?.name}</span>? This action cannot be undone.</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                        <Button variant="outline" onClick={() => setMediaToDelete(null)} className="w-full">Cancel</Button>
                        <Button onClick={handleDeleteMedia} className="w-full bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-600">Delete</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} title={`Delete ${selectedMediaIds.size} Items`}>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2"><Trash2 className="text-red-600 w-8 h-8" /></div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">Are you sure?</h4>
                        <div className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">You are about to delete <span className="font-bold text-slate-900">{selectedMediaIds.size} items</span>. This action cannot be undone and these files will be permanently removed.</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                        <Button variant="outline" onClick={() => setIsBulkDeleteModalOpen(false)} className="w-full">Cancel</Button>
                        <Button onClick={handleBulkDelete} className="w-full bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-600">Delete All</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EventDetailsPage;
