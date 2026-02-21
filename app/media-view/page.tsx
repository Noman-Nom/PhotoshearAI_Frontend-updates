
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Layout,
  Plus,
  Minus,
  Maximize2,
  Send,
  Paperclip,
  Smile,
  Globe,
  ChevronDown,
  Filter,
  Settings,
  User,
  Square,
  Sparkles,
  CheckCircle2,
  CornerDownRight,
  X,
  MessageSquare,
  Pencil,
  Trash2,
  AlertTriangle,
  Calendar,
  Download,
  FileText,
  File as FileIcon,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEvents } from '../../contexts/EventsContext';
import { collectionsApi, mediaApi, commentsApi, CommentResponse } from '../../services/eventsApi';
import { SHARED_EVENTS, SharedEvent, SharedMediaItem, saveEventsToStorage, incrementGuestDownloadCount } from '../../constants';
import { brandingApi } from '../../services/brandingApi';
import { formatBytes } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { downloadMediaWithBranding } from '../../utils/imageProcessor';
import { useToast } from '../../contexts/ToastContext';

// Helper to create consistent slugs
const createSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Comment {
  id: string;
  author: string;
  initials: string;
  text: string;
  time: string;
  timestamp: number;
  status: 'resolved' | 'unresolved';
  attachments?: Attachment[];
  replies?: Comment[];
  replyTo?: {
    author: string;
    text: string;
  };
}

interface MediaViewPageProps {
  viewContext: 'event' | 'guest' | 'client';
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '🔥', '✨', '🙌', '👍', '😮', '😍', '👏', '🎉', '💡', '✅', '❌', '📸', '📽️'];

const MediaViewPage: React.FC<MediaViewPageProps> = ({ viewContext }) => {
  const { slug, eventId, collectionSlug, mediaId } = useParams<{
    slug?: string;
    eventId?: string;
    collectionSlug?: string;
    mediaId: string
  }>();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events: apiEvents } = useEvents();
  const { success, error: toastError } = useToast();

  const [event, setEvent] = useState<SharedEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'fields'>(viewContext === 'guest' ? 'fields' : 'comments');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [activeBranding, setActiveBranding] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Comment State
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<{ file: File, preview: string }[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Search & Filter State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [commentSearchQuery, setCommentSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('All Authors');
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('oldest');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Delete Confirmation State (Comments)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, parentId?: string } | null>(null);

  // Delete Media State
  const [isDeleteMediaModalOpen, setIsDeleteMediaModalOpen] = useState(false);

  // Rename Media State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // Load Comments from API
  useEffect(() => {
    const loadComments = async () => {
      if (mediaId) {
        try {
          const apiComments = await commentsApi.list(mediaId);
          // Transform API response to local Comment format
          const transformedComments: Comment[] = apiComments.map(c => ({
            id: c.id,
            author: c.author_name,
            initials: c.author_initials,
            text: c.text,
            time: new Date(c.created_at).toLocaleString(),
            timestamp: new Date(c.created_at).getTime(),
            status: c.status,
            attachments: c.attachments?.map(a => ({
              name: a.name,
              url: a.url,
              type: a.type,
              size: a.size
            })),
            replies: c.replies?.map(r => ({
              id: r.id,
              author: r.author_name,
              initials: r.author_initials,
              text: r.text,
              time: new Date(r.created_at).toLocaleString(),
              timestamp: new Date(r.created_at).getTime(),
              status: r.status,
              replyTo: r.reply_to_author ? { author: r.reply_to_author, text: r.reply_to_text || '' } : undefined
            })) || [],
            replyTo: c.reply_to_author ? { author: c.reply_to_author, text: c.reply_to_text || '' } : undefined
          }));
          setComments(transformedComments);
        } catch (error) {
          console.error('Failed to load comments:', error);
          setComments([]);
        }
      }
    };
    loadComments();
  }, [mediaId]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to bottom on new comments
  useEffect(() => {
    if (activeTab === 'comments' && sortOrder === 'oldest') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab, sortOrder]);

  const { currentItems, activeItem, currentIndex, totalCount } = useMemo(() => {
    let items: SharedMediaItem[] = [];

    // Prioritize the 'event' state which we sync from API or use locally
    if (event) {
      if (viewContext === 'event') {
        const collection = event.collections.find(c =>
          createSlug(c.title) === collectionSlug || c.id === collectionSlug
        );
        items = collection ? collection.items : [];
      } else {
        // Guest or Client view
        items = event.collections.flatMap(c => c.items);
        const unique = new Map();
        items.forEach(i => unique.set(i.id, i));
        items = Array.from(unique.values());
      }
    } else {
      // Legacy fallback to SHARED_EVENTS if state not yet loaded
      let foundEvent: SharedEvent | undefined;
      if (viewContext === 'event') {
        foundEvent = SHARED_EVENTS.find(e => createSlug(e.title) === slug);
        if (foundEvent) {
          const collection = foundEvent.collections.find(c => createSlug(c.title) === collectionSlug);
          items = collection ? collection.items : [];
        }
      } else {
        foundEvent = SHARED_EVENTS.find(e => e.id === eventId);
        if (foundEvent) {
          items = foundEvent.collections.flatMap(c => c.items);
          const unique = new Map();
          items.forEach(i => unique.set(i.id, i));
          items = Array.from(unique.values());
        }
      }
    }

    const idx = items.findIndex(i => i.id === mediaId);
    return {
      currentItems: items,
      activeItem: items[idx] || null,
      currentIndex: idx,
      totalCount: items.length
    };
  }, [event, slug, eventId, collectionSlug, mediaId, viewContext]);

  // Unique Authors for filtering
  const uniqueAuthors = useMemo(() => {
    const authors = new Set<string>();
    comments.forEach(c => {
      authors.add(c.author);
      c.replies?.forEach(r => authors.add(r.author));
    });
    return Array.from(authors).sort();
  }, [comments]);

  // Filtered and Sorted Comments
  const filteredAndSortedComments = useMemo(() => {
    let result = [...comments];

    // Search Query
    if (commentSearchQuery) {
      const query = commentSearchQuery.toLowerCase();
      result = result.filter(c =>
        c.text.toLowerCase().includes(query) ||
        c.author.toLowerCase().includes(query) ||
        c.replies?.some(r => r.text.toLowerCase().includes(query) || r.author.toLowerCase().includes(query))
      );
    }

    // Author Filter
    if (authorFilter !== 'All Authors') {
      result = result.filter(c => c.author === authorFilter);
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Sorting - Chronological (Oldest at top, Newest at bottom)
    result.sort((a, b) => {
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return result;
  }, [comments, commentSearchQuery, authorFilter, statusFilter, sortOrder]);

  useEffect(() => {
    if (viewContext === 'event') {
      const apiEvent = apiEvents.find(e => createSlug(e.title) === slug);
      if (apiEvent) {
        setEvent({
          id: apiEvent.id,
          workspaceId: apiEvent.workspace_id,
          title: apiEvent.title,
          date: apiEvent.event_date,
          status: apiEvent.status === 'published' ? 'Published' : 'Draft',
          coverUrl: apiEvent.cover_url || '',
          totalPhotos: apiEvent.total_photos,
          totalVideos: apiEvent.total_videos,
          totalSizeBytes: apiEvent.total_size_bytes,
          collections: apiEvent.collections.map(c => ({
            id: c.id,
            title: c.title,
            photoCount: c.photo_count,
            videoCount: c.video_count,
            thumbnailUrl: c.thumbnail_url || undefined,
            isDefault: c.is_default,
            items: []
          })),
          collaborators: apiEvent.collaborators.map(c => c.team_member_id),
          description: apiEvent.description || '',
          type: apiEvent.event_type || 'conference',
          branding: apiEvent.branding_enabled,
          brandingId: apiEvent.branding_id || undefined
        });
      }
    } else {
      const found = SHARED_EVENTS.find(e => e.id === eventId);
      if (found) setEvent(found);
    }
  }, [slug, eventId, viewContext, apiEvents]);

  // Fetch Media Items for Active Collection if needed
  useEffect(() => {
    // Only fetch for event owners or if context allows
    if (!event || viewContext !== 'event' || !collectionSlug) return;

    const collection = event.collections.find(c => createSlug(c.title) === collectionSlug || c.id === collectionSlug);
    if (!collection || (collection.items.length > 0 && collection.photoCount > 0)) return;

    const fetchMedia = async () => {
      try {
        const response = await mediaApi.list(collection.id, { pageSize: 100 });
        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            collections: prev.collections.map(c => c.id === collection.id ? {
              ...c,
              items: response.items.map(m => ({
                id: m.id,
                type: m.media_type,
                url: m.url,
                thumbnailUrl: m.thumbnail_url,
                name: m.filename,
                sizeBytes: m.size_bytes,
                dateAdded: m.created_at
              }))
            } : c)
          };
        });
      } catch (e) {
        console.error("Failed to fetch media in MediaViewPage", e);
      }
    };
    fetchMedia();
  }, [event?.id, collectionSlug, viewContext]);

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

  const handleBack = () => {
    if (viewContext === 'event') {
      navigate(`/events/${slug}/${collectionSlug}`);
    } else if (viewContext === 'guest') {
      navigate(`/guest-gallery/${eventId}`);
    } else {
      const mode = searchParams.get('mode') || 'full';
      navigate(`/client-gallery/${eventId}?mode=${mode}`);
    }
  };

  const navigateMedia = (dir: 'next' | 'prev') => {
    const nextIdx = dir === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIdx >= 0 && nextIdx < totalCount) {
      const nextItem = currentItems[nextIdx];
      const baseUrl = viewContext === 'event'
        ? `/events/${slug}/${collectionSlug}/view`
        : viewContext === 'guest'
          ? `/guest-gallery/${eventId}/view`
          : `/client-gallery/${eventId}/view`;

      const params = viewContext === 'client' ? `?mode=${searchParams.get('mode') || 'full'}` : '';
      navigate(`${baseUrl}/${nextItem.id}${params}`);
    }
  };

  // Keyboard Navigation Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        navigateMedia('next');
      } else if (e.key === 'ArrowLeft') {
        navigateMedia('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalCount, currentItems, viewContext, slug, eventId, collectionSlug, searchParams]);

  const handleAddComment = async () => {
    if (viewContext === 'guest') return; // Strict gate
    if (!newComment.trim() && pendingAttachments.length === 0) return;
    if (!mediaId) return;

    let authorName = '';
    let initials = '';

    if (viewContext === 'client') {
      authorName = event?.customerName || 'Customer';
      const parts = authorName.split(' ');
      initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : (parts[0][0] + (parts[0][1] || ''));
    } else {
      authorName = user ? `${user.firstName} ${user.lastName}` : 'DANISH MUKHTAR';
      initials = user ? (user.firstName[0] + (user.lastName[0] || '')) : 'DM';
    }

    authorName = authorName.toUpperCase();
    initials = initials.toUpperCase();

    let targetParentId = replyingToId;

    if (replyingToId) {
      for (const c of comments) {
        if (c.id === replyingToId) {
          targetParentId = c.id;
          break;
        }
        if (c.replies) {
          const foundReply = c.replies.find(r => r.id === replyingToId);
          if (foundReply) {
            targetParentId = c.id;
            break;
          }
        }
      }
    }

    // Optimistic comment for immediate UI feedback
    const optimisticComment: Comment = {
      id: `temp_${Date.now()}`,
      author: authorName,
      initials: initials,
      text: newComment,
      time: 'Just now',
      timestamp: Date.now(),
      status: 'unresolved',
      attachments: pendingAttachments.map(pa => ({
        name: pa.file.name,
        url: pa.preview,
        type: pa.file.type,
        size: pa.file.size
      })),
      replies: [],
      replyTo: undefined
    };

    // Optimistic update
    if (targetParentId && replyingToId) {
      setComments(prev => prev.map(c => {
        if (c.id === targetParentId) {
          return { ...c, replies: [...(c.replies || []), optimisticComment] };
        }
        return c;
      }));
    } else {
      setComments(prev => [...prev, optimisticComment]);
    }

    setNewComment('');
    setPendingAttachments([]);
    setIsEmojiPickerOpen(false);
    setReplyingToId(null);

    // Call API
    try {
      const apiComment = await commentsApi.create(mediaId, {
        text: newComment,
        parent_id: targetParentId || undefined,
      });

      // Replace optimistic comment with real one
      const realComment: Comment = {
        id: apiComment.id,
        author: apiComment.author_name,
        initials: apiComment.author_initials,
        text: apiComment.text,
        time: new Date(apiComment.created_at).toLocaleString(),
        timestamp: new Date(apiComment.created_at).getTime(),
        status: apiComment.status,
        attachments: [],
        replies: [],
      };

      if (targetParentId) {
        setComments(prev => prev.map(c => {
          if (c.id === targetParentId) {
            // Find and replace the optimistic reply by its temp ID
            const existingReplies = c.replies || [];
            const optimisticIndex = existingReplies.findIndex(r => r.id === optimisticComment.id);
            if (optimisticIndex !== -1) {
              const updatedReplies = [...existingReplies];
              updatedReplies[optimisticIndex] = realComment;
              return { ...c, replies: updatedReplies };
            }
            // If not found (edge case), append
            return { ...c, replies: [...existingReplies, realComment] };
          }
          return c;
        }));
      } else {
        setComments(prev => prev.map(c => c.id === optimisticComment.id ? realComment : c));
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
      // Remove optimistic comment on failure
      if (targetParentId) {
        setComments(prev => prev.map(c => {
          if (c.id === targetParentId) {
            return { ...c, replies: c.replies?.filter(r => r.id !== optimisticComment.id) };
          }
          return c;
        }));
      } else {
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      }
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newPending = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    }));

    setPendingAttachments(prev => [...prev, ...newPending]);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => {
      const next = [...prev];
      if (next[index].preview) URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const addEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    commentInputRef.current?.focus();
  };

  const toggleResolve = async (id: string) => {
    if (!mediaId) return;
    const comment = comments.find(c => c.id === id);
    if (!comment) return;

    const newStatus = comment.status === 'resolved' ? 'unresolved' : 'resolved';

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: newStatus };
      }
      return c;
    }));

    try {
      await commentsApi.toggleResolved(mediaId, id, newStatus === 'resolved');
    } catch (error) {
      console.error('Failed to toggle resolve:', error);
      // Revert on failure
      setComments(prev => prev.map(c => {
        if (c.id === id) {
          return { ...c, status: comment.status };
        }
        return c;
      }));
    }
  };

  const initiateReply = (id: string) => {
    setReplyingToId(id);
    setEditingId(null);
    setTimeout(() => commentInputRef.current?.focus(), 10);
  };

  const getQuotedComment = () => {
    if (!replyingToId) return null;
    for (const c of comments) {
      if (c.id === replyingToId) return c;
      if (c.replies) {
        const r = c.replies.find(reply => reply.id === replyingToId);
        if (r) return r;
      }
    }
    return null;
  };

  const initiateEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
    setReplyingToId(null);
  };

  const handleSaveEdit = async (id: string, parentId?: string) => {
    if (!editingText.trim() || !mediaId) return;

    const originalText = parentId
      ? comments.find(c => c.id === parentId)?.replies?.find(r => r.id === id)?.text
      : comments.find(c => c.id === id)?.text;

    // Optimistic update
    if (parentId) {
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: c.replies?.map(r => r.id === id ? { ...r, text: editingText } : r)
          };
        }
        return c;
      }));
    } else {
      setComments(prev => prev.map(c => id === c.id ? { ...c, text: editingText } : c));
    }

    setEditingId(null);
    setEditingText('');

    try {
      await commentsApi.update(mediaId, id, { text: editingText });
    } catch (error) {
      console.error('Failed to update comment:', error);
      // Revert on failure
      if (parentId) {
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: c.replies?.map(r => r.id === id ? { ...r, text: originalText || '' } : r)
            };
          }
          return c;
        }));
      } else {
        setComments(prev => prev.map(c => id === c.id ? { ...c, text: originalText || '' } : c));
      }
    }
  };

  const initiateDelete = (id: string, parentId?: string) => {
    setItemToDelete({ id, parentId });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !mediaId) return;
    const { id, parentId } = itemToDelete;

    // Store for potential rollback
    const originalComments = [...comments];

    // Optimistic update
    if (parentId) {
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: c.replies?.filter(r => r.id !== id)
          };
        }
        return c;
      }));
    } else {
      setComments(prev => prev.filter(c => c.id !== id));
    }

    setIsDeleteModalOpen(false);
    setItemToDelete(null);

    try {
      await commentsApi.delete(mediaId, id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      // Revert on failure
      setComments(originalComments);
    }
  };

  const handleDeleteActiveMedia = async () => {
    if (!activeItem || !event) return;

    const itemToDelete = activeItem;
    const itemSize = itemToDelete.sizeBytes;
    const isVideo = itemToDelete.type === 'video';

    const originalEvent = JSON.parse(JSON.stringify(event));
    const deletedId = itemToDelete.id;

    const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
    if (dbEventIndex !== -1) {
      const ev = SHARED_EVENTS[dbEventIndex];
      ev.totalSizeBytes = Math.max(0, ev.totalSizeBytes - itemSize);
      if (isVideo) ev.totalVideos = Math.max(0, ev.totalVideos - 1);
      else ev.totalPhotos = Math.max(0, ev.totalPhotos - 1);

      ev.collections.forEach(col => {
        const itemIdx = col.items.findIndex(i => i.id === itemToDelete.id);
        if (itemIdx !== -1) {
          col.items.splice(itemIdx, 1);
          if (isVideo) col.videoCount = Math.max(0, col.videoCount - 1);
          else col.photoCount = Math.max(0, col.photoCount - 1);

          if (col.thumbnailUrl === itemToDelete.url) {
            const nextPhoto = col.items.find(i => i.type === 'photo');
            col.thumbnailUrl = nextPhoto ? nextPhoto.url : undefined;
          }
        }
      });
      saveEventsToStorage();
    }

    // Update local state event
    setEvent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        totalSizeBytes: Math.max(0, prev.totalSizeBytes - itemSize),
        totalPhotos: isVideo ? prev.totalPhotos : Math.max(0, prev.totalPhotos - 1),
        totalVideos: isVideo ? Math.max(0, prev.totalVideos - 1) : prev.totalVideos,
        collections: prev.collections.map(col => ({
          ...col,
          items: col.items.filter(i => i.id !== deletedId),
          photoCount: isVideo ? col.photoCount : Math.max(0, col.photoCount - (col.items.some(i => i.id === deletedId) ? 1 : 0)),
          videoCount: isVideo ? Math.max(0, col.videoCount - (col.items.some(i => i.id === deletedId) ? 1 : 0)) : col.videoCount
        }))
      };
    });

    setIsDeleteMediaModalOpen(false);

    // Call API
    try {
      await mediaApi.delete(deletedId);
      success('Media deleted successfully');

      if (totalCount > 1) {
        if (currentIndex < totalCount - 1) {
          navigateMedia('next');
        } else {
          navigateMedia('prev');
        }
      } else {
        handleBack();
      }
    } catch (error) {
      console.error('Failed to delete media from MediaViewPage:', error);
      toastError('Failed to delete media from server');
      // Revert local state
      setEvent(originalEvent);
    }
  };

  const handleRenameMedia = () => {
    if (!renameInput.trim() || !activeItem || !event) return;

    const dbEventIndex = SHARED_EVENTS.findIndex(e => e.id === event.id);
    if (dbEventIndex !== -1) {
      const ev = SHARED_EVENTS[dbEventIndex];
      ev.collections.forEach(col => {
        const item = col.items.find(i => i.id === activeItem.id);
        if (item) {
          item.name = renameInput.trim();
        }
      });
      saveEventsToStorage();

      // Update local state to reflect change immediately
      setEvent({ ...ev });
      setIsRenameModalOpen(false);
    }
  };

  const initiateRename = () => {
    if (viewContext !== 'event' || !activeItem) return;
    setRenameInput(activeItem.name);
    setIsRenameModalOpen(true);
  };

  const handleDownload = async () => {
    if (!activeItem) return;
    setIsDownloading(true);
    try {
      await downloadMediaWithBranding(activeItem, activeBranding);

      // Track guest download
      if (viewContext === 'guest') {
        const guestSessionId = sessionStorage.getItem('photmo_guest_session_id');
        if (guestSessionId) {
          incrementGuestDownloadCount(guestSessionId);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const getWatermarkPositionClass = (pos: string) => {
    // Return base absolute positions. Inset is handled by padding [4%].
    switch (pos) {
      case 'top-left': return 'top-0 left-0';
      case 'top-center': return 'top-0 left-1/2 -translate-x-1/2';
      case 'top-right': return 'top-0 right-0';
      case 'center-left': return 'top-1/2 left-0 -translate-y-1/2';
      case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'center-right': return 'top-1/2 right-0 -translate-y-1/2';
      case 'bottom-left': return 'bottom-0 left-0';
      case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2';
      case 'bottom-right': return 'bottom-0 right-0';
      // Legacy compatibility
      case 'top-8 left-8': return 'top-0 left-0';
      case 'top-8 right-8': return 'top-0 right-0';
      case 'bottom-8 left-8': return 'bottom-0 left-0';
      case 'bottom-8 right-8': return 'bottom-0 right-0';
      default: return 'top-0 right-0';
    }
  };

  const getTextAlignmentClass = (pos: string) => {
    if (pos.includes('left')) return 'text-left items-start';
    if (pos.includes('right')) return 'text-right items-end';
    return 'text-center items-center';
  };

  if (!activeItem || !event) return null;

  // Tabs logic based on viewContext
  const availableTabs = viewContext === 'guest'
    ? (['fields'] as const)
    : (['comments', 'fields'] as const);

  return (
    <div className="h-screen w-screen bg-white flex flex-col font-sans overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        ref={attachmentInputRef}
        className="hidden"
        onChange={handleAttachmentChange}
      />

      {/* Header */}
      <header className="h-16 flex-shrink-0 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-5">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2.5 text-xs font-black tracking-tight">
            <span className="text-slate-400 hover:text-slate-600 cursor-pointer uppercase">SF</span>
            <span className="text-slate-300 font-light">/</span>
            <div
              onClick={initiateRename}
              className={cn(
                "flex items-center gap-1.5 group transition-colors",
                viewContext === 'event' ? "cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg" : ""
              )}
            >
              <span className="text-slate-900 uppercase truncate max-w-[200px]">{activeItem.name}</span>
              {viewContext === 'event' && (
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => navigateMedia('prev')}
              disabled={currentIndex === 0}
              className="p-2.5 hover:bg-white disabled:opacity-20 transition-all border-r border-slate-200"
            >
              <ChevronLeft size={16} className="text-slate-900" strokeWidth={3} />
            </button>
            <span className="px-5 text-[11px] font-black text-slate-900 min-w-[80px] text-center uppercase tracking-tighter">
              {currentIndex + 1} OF {totalCount}
            </span>
            <button
              onClick={() => navigateMedia('next')}
              disabled={currentIndex === totalCount - 1}
              className="p-2.5 hover:bg-white disabled:opacity-20 transition-all border-l border-slate-200"
            >
              <ChevronRight size={16} className="text-slate-900" strokeWidth={3} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-xl disabled:opacity-50"
              title="Download Media"
            >
              <Download size={20} className={isDownloading ? "animate-bounce" : ""} />
            </button>

            {viewContext === 'event' && (
              <button
                onClick={() => setIsDeleteMediaModalOpen(true)}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl border border-transparent hover:border-red-100"
                title="Delete Media"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          <div className="w-px h-8 bg-slate-100 mx-2" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn("p-2.5 rounded-lg transition-all", isSidebarOpen ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50")}
            >
              <Layout size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewer Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 bg-[#090B10] relative flex items-center justify-center overflow-hidden">
          {activeItem.type === 'video' ? (
            <video key={activeItem.id} src={activeItem.url} controls autoPlay className="max-w-full max-h-full" />
          ) : (
            <div className="relative flex items-center justify-center h-full w-full">
              {/* Image and Overlay Container - Scaled by Zoom */}
              <div
                className="relative flex items-center justify-center transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <img
                  src={activeItem.url}
                  alt={activeItem.name}
                  className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl z-0"
                />

                {/* Branding Watermark Overlay on Viewer - Relative to Image Bounds */}
                {activeBranding && activeBranding.logo && (
                  <div
                    className={cn(
                      "absolute pointer-events-none transition-all duration-300 z-10 p-[4%]",
                      getWatermarkPositionClass(activeBranding.watermarkPosition || 'top-right')
                    )}
                    style={{
                      opacity: (activeBranding.logoOpacity ?? 90) / 100,
                      // Use percentage-based sizing for center positions, fixed pixels for corners
                      width: (activeBranding.watermarkPosition || 'top-right').includes('center')
                        ? `${(activeBranding.logoSize ?? 15) / 2}%`  // 1-100% slider maps to 0.5-50% of container
                        : `${(activeBranding.logoSize ?? 15) * 5}px`  // Fixed pixel for corners
                    }}
                  >
                    <img
                      src={activeBranding.logo}
                      alt="watermark"
                      className="w-full h-auto object-contain grayscale-[30%] brightness-110 drop-shadow-md"
                    />
                  </div>
                )}

                {/* Branding Details (Name & Website) Overlay on Viewer - Relative to Image Bounds */}
                {activeBranding && (activeBranding.name || activeBranding.website) && (
                  <div
                    className={cn(
                      "absolute p-[4%] text-white space-y-2 transition-all duration-300 flex flex-col w-full max-w-[90%] pointer-events-none z-10",
                      getWatermarkPositionClass(activeBranding.detailsPosition || 'bottom-left'),
                      getTextAlignmentClass(activeBranding.detailsPosition || 'bottom-left')
                    )}
                    style={{ opacity: (activeBranding.brandOpacity ?? 100) / 100 }}
                  >
                    <div className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                      {activeBranding.name && (
                        <h4 className="font-bold leading-tight uppercase tracking-tight" style={{ fontSize: `${((activeBranding.brandSize ?? 100) / 100) * 1.5}rem` }}>
                          {activeBranding.name}
                        </h4>
                      )}
                      {activeBranding.website && activeBranding.website !== 'N/A' && (
                        <p className="text-white/90 font-medium tracking-wide mt-1 lowercase" style={{ fontSize: `${((activeBranding.brandSize ?? 100) / 100) * 0.875}rem` }}>
                          {activeBranding.website}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-8 left-8 flex items-center bg-white/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl border border-white/20 z-30">
            <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <Square size={18} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center">
              <button onClick={() => setZoom(Math.max(10, zoom - 10))} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500">
                <Minus size={18} strokeWidth={3} />
              </button>
              <span className="w-16 text-center text-[12px] font-black text-slate-900 font-mono tracking-tight">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(400, zoom + 10))} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500">
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 flex items-center bg-white/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl border border-white/20 z-30">
            <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 group transition-all">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-dashed group-hover:rotate-45 transition-transform" />
            </button>
            <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400"><Settings size={18} /></button>
            <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400"><Maximize2 size={18} /></button>
          </div>
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-l border-slate-100 flex flex-col h-full flex-shrink-0 transition-all duration-500 ease-in-out relative",
            isSidebarOpen ? "w-[420px]" : "w-0 overflow-hidden border-l-0"
          )}
        >
          <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10">
            {availableTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-5 text-[11px] font-black uppercase tracking-[0.25em] transition-all relative",
                  activeTab === tab ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 animate-in fade-in duration-300" />}
              </button>
            ))}
          </div>

          {activeTab === 'comments' ? (
            <>
              {/* Comment Controls Section */}
              <div className="px-6 py-4 flex flex-col border-b border-slate-50 bg-slate-50/30 gap-4">
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <button
                      onClick={() => setAuthorFilter(prev => prev === 'All Authors' ? uniqueAuthors[0] || 'All Authors' : 'All Authors')}
                      className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                      {authorFilter} <ChevronDown size={14} className="text-slate-300" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-slate-300">
                    <button
                      onClick={() => setIsSearchActive(!isSearchActive)}
                      className={cn("transition-colors", isSearchActive ? "text-blue-600" : "hover:text-slate-900")}
                    >
                      <Search size={18} />
                    </button>
                    <div className="relative group/filter">
                      <button className="hover:text-slate-900 transition-colors">
                        <Filter size={18} />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50 hidden group-hover/filter:block">
                        {(['all', 'resolved', 'unresolved'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={cn(
                              "w-full px-4 py-2 text-start text-[10px] font-black uppercase tracking-wider",
                              statusFilter === f ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {isSearchActive && (
                  <div className="relative animate-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      placeholder="Search within comments..."
                      value={commentSearchQuery}
                      onChange={(e) => setCommentSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      autoFocus
                    />
                    {commentSearchQuery && (
                      <button
                        onClick={() => setCommentSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar scroll-smooth">
                {filteredAndSortedComments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                    <MessageSquare size={48} className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-center">
                      {commentSearchQuery ? "No matches found" : "No comments yet"}
                    </p>
                  </div>
                ) : filteredAndSortedComments.map(comment => (
                  <div key={comment.id} className="space-y-6">
                    <div className={cn("flex gap-4 group transition-opacity", comment.status === 'resolved' && "opacity-60")}>
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-[13px] font-black flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        {comment.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-[12px] font-black text-slate-900 truncate uppercase tracking-tight">{comment.author}</span>
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{comment.time}</span>
                            {comment.status === 'resolved' && (
                              <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle2 size={10} strokeWidth={3} /> Resolved
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-300 font-bold flex items-center gap-1.5">
                            #{comments.indexOf(comment) + 1} <Globe size={11} className="opacity-40" />
                          </span>
                        </div>

                        {editingId === comment.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full bg-slate-50 border border-blue-300 rounded-xl p-4 text-[13px] focus:ring-0 resize-none min-h-[100px]"
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase hover:bg-slate-100 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(comment.id)}
                                className="px-3 py-1.5 text-[10px] font-black bg-blue-600 text-white uppercase rounded-lg shadow-sm"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={cn(
                              "p-5 rounded-[1.5rem] rounded-tl-none transition-all shadow-sm border",
                              comment.status === 'resolved' ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100 group-hover:bg-blue-50/30 group-hover:border-blue-100/50"
                            )}>
                              <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{comment.text}</p>

                              {/* Comment Attachments */}
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {comment.attachments.map((at, idx) => (
                                    <div key={idx} className="group/at relative rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                      {at.type.startsWith('image/') ? (
                                        <div className="w-32 h-32 relative cursor-pointer" onClick={() => setPreviewAttachment(at)}>
                                          <img src={at.url} className="w-full h-full object-contain bg-slate-50" alt={at.name} />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/at:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                                            <Maximize2 size={16} />
                                          </div>
                                        </div>
                                      ) : (
                                        <a href={at.url} download={at.name} className="flex items-center gap-3 p-3 text-[12px] font-bold text-slate-700 hover:text-blue-600">
                                          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover/at:text-blue-500 transition-colors">
                                            <FileIcon size={16} />
                                          </div>
                                          <div className="min-w-0 max-w-[120px]">
                                            <p className="truncate">{at.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{formatBytes(at.size)}</p>
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex items-center gap-5 transition-all">
                              <button
                                onClick={() => initiateReply(comment.id)}
                                className="text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 tracking-widest flex items-center gap-1 transition-colors"
                              >
                                REPLY
                              </button>
                              <button
                                onClick={() => toggleResolve(comment.id)}
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest transition-colors",
                                  comment.status === 'resolved' ? "text-emerald-600" : "text-slate-400 hover:text-blue-600"
                                )}
                              >
                                {comment.status === 'resolved' ? 'UNRESOLVE' : 'RESOLVE'}
                              </button>
                              <div className="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => initiateEdit(comment.id, comment.text)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={12} /></button>
                                <button onClick={() => initiateDelete(comment.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-12 space-y-6 relative">
                        <div className="absolute left-[-24px] top-[-10px] bottom-[20px] w-px bg-slate-100" />
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex gap-4 group relative">
                            <div className="absolute left-[-24px] top-[20px] w-4 h-px bg-slate-100" />
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm">
                              {reply.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                <span className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{reply.author}</span>
                                <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">{reply.time}</span>
                              </div>

                              {editingId === reply.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full bg-slate-50 border border-blue-300 rounded-xl p-4 text-[12px] focus:ring-0 resize-none min-h-[100px]"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-100 rounded">Cancel</button>
                                    <button onClick={() => handleSaveEdit(reply.id, comment.id)} className="px-2 py-1 text-[9px] font-black bg-blue-600 text-white uppercase rounded shadow-sm">Save</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl rounded-tl-none relative space-y-3 overflow-hidden">
                                  {reply.replyTo && (
                                    <div className="bg-slate-200/50 rounded-lg p-3 border-l-4 border-blue-500 relative overflow-hidden group/quote">
                                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight mb-1">{reply.replyTo.author}</p>
                                      <p className="text-[11px] text-slate-500 italic truncate">{reply.replyTo.text}</p>
                                    </div>
                                  )}
                                  <p className="text-[12px] text-slate-600 font-medium leading-relaxed">{reply.text}</p>

                                  {/* Reply Attachments */}
                                  {reply.attachments && reply.attachments.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {reply.attachments.map((at, idx) => (
                                        <div key={idx} className="group/at relative rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                                          {at.type.startsWith('image/') ? (
                                            <div className="w-24 h-24 relative cursor-pointer" onClick={() => setPreviewAttachment(at)}>
                                              <img src={at.url} className="w-full h-full object-contain bg-slate-50" alt={at.name} />
                                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/at:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Maximize2 size={12} />
                                              </div>
                                            </div>
                                          ) : (
                                            <a href={at.url} download={at.name} className="flex items-center gap-2 p-2 text-[10px] font-bold text-slate-700">
                                              <FileIcon size={14} className="text-slate-400" />
                                              <span className="truncate max-w-[100px]">{at.name}</span>
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="mt-2 flex items-center gap-4">
                                    <button
                                      onClick={() => initiateReply(reply.id)}
                                      className="text-[9px] font-black text-slate-400 uppercase hover:text-blue-600 tracking-widest flex items-center gap-1 transition-colors"
                                    >
                                      REPLY
                                    </button>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                      <button onClick={() => initiateEdit(reply.id, reply.text)} className="p-1 text-slate-300 hover:text-blue-500"><Pencil size={10} /></button>
                                      <button onClick={() => initiateDelete(reply.id, comment.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={10} /></button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input Area */}
              <div className="p-6 border-t border-slate-100 bg-white relative">
                {replyingToId && (
                  <div className="mb-4 flex flex-col bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-2 duration-300 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-100/50">
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        <CornerDownRight size={12} strokeWidth={3} /> Replying to message
                      </div>
                      <button onClick={() => setReplyingToId(null)} className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-3 border-l-4 border-blue-500 bg-white/50">
                      <p className="text-[11px] font-black text-slate-900 uppercase mb-1">
                        {getQuotedComment()?.author}
                      </p>
                      <p className="text-[12px] text-slate-500 truncate italic leading-relaxed">
                        {getQuotedComment()?.text}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending Attachments List */}
                {pendingAttachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
                    {pendingAttachments.map((pa, idx) => (
                      <div key={idx} className="group relative w-16 h-16 rounded-xl border border-blue-200 bg-blue-50/30 overflow-hidden">
                        {pa.preview ? (
                          <img src={pa.preview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-blue-400">
                            <FileIcon size={20} />
                            <span className="text-[8px] font-bold uppercase mt-1 truncate px-1 w-full text-center">{pa.file.name}</span>
                          </div>
                        )}
                        <button
                          onClick={() => removePendingAttachment(idx)}
                          className="absolute -top-1 -right-1 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simple Emoji Picker */}
                {isEmojiPickerOpen && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-full mb-4 left-6 z-[60] bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-4 w-[280px] animate-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Emojis</span>
                      <button onClick={() => setIsEmojiPickerOpen(false)} className="text-slate-300 hover:text-slate-600"><X size={12} /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {COMMON_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-slate-50 rounded-2xl transition-all hover:scale-110 active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-8 focus-within:ring-blue-500/5 transition-all shadow-inner">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingToId ? "Write a reply..." : "Leave your comment..."}
                    className="w-full bg-transparent border-none text-[14px] text-slate-900 p-4 pb-2 resize-none focus:ring-0 min-h-[80px] placeholder-slate-400 font-medium leading-relaxed"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <div className="px-4 py-2.5 flex items-center justify-between border-t border-slate-100/50">
                    <div className="flex items-center gap-4 text-slate-400">
                      <button
                        onClick={() => attachmentInputRef.current?.click()}
                        className="hover:text-blue-600 transition-colors"
                      >
                        <Paperclip size={18} />
                      </button>
                      <button
                        onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                        className={cn("transition-colors", isEmojiPickerOpen ? "text-blue-600" : "hover:text-blue-600")}
                      >
                        <Smile size={18} />
                      </button>
                      <button className="hover:text-blue-600 transition-colors"><User size={18} /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() && pendingAttachments.length === 0}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 text-white rounded-xl flex items-center justify-center transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                      >
                        <Send size={18} className="ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 p-10 space-y-12 overflow-y-auto bg-slate-50/10">
              <div className="space-y-8 text-start">
                <div className="flex items-center gap-3 ml-1">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Sparkles size={16} /></div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Metadata & Info</h4>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <FieldItem
                    label="File Name"
                    value={activeItem.name}
                    onEdit={viewContext === 'event' ? initiateRename : undefined}
                  />
                  <FieldItem label="Size" value={formatBytes(activeItem.sizeBytes)} />
                  <FieldItem label="Resolution" value="4800 x 3200 PX" />
                  <FieldItem label="Format" value={activeItem.url.split('.').pop()?.toUpperCase() || 'JPEG'} />
                  <FieldItem label="Uploaded" value={activeItem.dateAdded || 'DEC 25, 2025'} />
                  <FieldItem label="Added By" value={user ? `${user.firstName} ${user.lastName}` : 'System'} />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Attachment Preview Modal */}
      <Modal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        title={previewAttachment?.name || 'Preview'}
        className="max-w-4xl w-full"
      >
        <div className="flex flex-col items-center py-2">
          <div className="relative w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center min-h-[300px]">
            <img src={previewAttachment?.url} className="max-w-full max-h-[70vh] object-contain" alt={previewAttachment?.name} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 w-full">
            <Button variant="outline" className="flex-1 min-w-[140px] font-bold" onClick={() => window.open(previewAttachment?.url, '_blank')}>
              <ExternalLink size={16} className="mr-2" /> Open Original
            </Button>
            <Button className="flex-1 min-w-[140px] bg-[#0F172A] font-bold" onClick={() => {
              const link = document.createElement('a');
              link.href = previewAttachment?.url || '';
              link.download = previewAttachment?.name || 'download';
              link.click();
            }}>
              <Download size={16} className="mr-2" /> Download File
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-400 font-medium">
            {previewAttachment?.type} • {formatBytes(previewAttachment?.size || 0)}
          </p>
        </div>
      </Modal>

      {/* Rename Media Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename File"
      >
        <div className="space-y-5 py-2">
          <Input
            label="File Name"
            placeholder="Enter new file name"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameMedia();
            }}
          />
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)} className="w-full">
              Cancel
            </Button>
            <Button onClick={handleRenameMedia} disabled={!renameInput.trim()} className="w-full bg-[#0F172A]">
              Rename
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Comment Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Comment"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">Are you sure?</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold border-transparent"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Media Confirmation Modal */}
      <Modal
        isOpen={isDeleteMediaModalOpen}
        onClose={() => setIsDeleteMediaModalOpen(false)}
        title="Delete Media"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
            <Trash2 className="text-red-600 w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">Delete this file?</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              You are about to permanently remove <span className="font-bold text-slate-900">{activeItem?.name}</span> from this collection. This cannot be undone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteMediaModalOpen(false)}
              className="w-full font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteActiveMedia}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold border-transparent"
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

const FieldItem = ({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group relative">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {label === 'Uploaded' && <Calendar size={12} className="text-slate-400 group-hover:text-blue-50" />}
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors">{label}</p>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Pencil size={12} />
        </button>
      )}
    </div>
    <p className="text-[15px] text-slate-900 font-black truncate uppercase tracking-tight leading-tight">{value}</p>
  </div>
);

export default MediaViewPage;
