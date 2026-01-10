
import React from 'react';
import { 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  HardDrive, 
  Settings, 
  Share2, 
  Trash2,
  UserPlus,
  ChevronRight,
  Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { EventData } from './EventCard';
import { useTranslation } from '../../../contexts/LanguageContext';

interface EventListItemProps {
  event: EventData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpload?: (id: string) => void;
  onShare?: (id: string) => void;
  onAddCollaborator?: (id: string) => void;
}

export const EventListItem: React.FC<EventListItemProps> = ({ event, onEdit, onDelete, onUpload, onShare, onAddCollaborator }) => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  const isPublished = event.status === 'Published';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(event.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event.id);
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpload?.(event.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(event.id);
  };

  const handleAddCollaborator = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddCollaborator?.(event.id);
  };

  const handleViewClick = () => {
    // Create a URL-friendly slug from the title
    const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    navigate(`/events/${slug}`);
  };

  return (
    <div 
      onClick={handleViewClick}
      className={cn("bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center gap-4 sm:gap-6 hover:border-slate-300 hover:shadow-sm transition-all duration-200 group cursor-pointer", isRTL && "flex-row-reverse")}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 relative shadow-inner">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      {/* Title & Date */}
      <div className={cn("flex-1 min-w-[150px] md:min-w-[200px] text-start", isRTL ? "text-right" : "text-left")}>
        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{event.title}</h3>
        <div className={cn("flex items-center text-xs text-slate-500 mt-1.5 font-medium", isRTL && "flex-row-reverse")}>
          <Calendar size={13} className={isRTL ? "ml-2 text-slate-400" : "mr-2 text-slate-400"} />
          {event.date}
        </div>
      </div>

      {/* Status (Hidden on mobile) */}
      <div className="hidden md:flex flex-col items-center w-[100px]">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">{t('status_header')}</span>
        <span className={cn(
          "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border",
          isPublished 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
            : "bg-amber-50 text-amber-600 border-amber-100"
        )}>
          {t(event.status.toLowerCase())}
        </span>
      </div>

      {/* Collaborators (Hidden on tablet) */}
      <div className={cn("hidden lg:flex items-center -space-x-2 w-[120px] justify-center", isRTL && "space-x-reverse")}>
         {event.collaborators.length > 0 ? (
             event.collaborators.slice(0, 3).map((url, i) => (
                <img key={i} src={url} className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-100 object-cover" alt="" />
             ))
         ) : (
             <div className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-100 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">-</div>
         )}
         {event.collaborators.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
            +{event.collaborators.length - 3}
            </div>
         )}
      </div>

      {/* Metrics (Hidden on smaller laptops) */}
      <div className={cn("hidden xl:flex items-center gap-6 px-6 border-l border-r border-slate-100 mx-2", isRTL && "flex-row-reverse")}>
         <div className={cn("flex items-center gap-2 text-slate-600 min-w-[60px]", isRTL && "flex-row-reverse")}>
            <div className="p-1.5 bg-slate-50 rounded text-slate-400 border border-slate-100"><ImageIcon size={13} strokeWidth={2.5} /></div>
            <span className="text-xs font-bold text-slate-700">{event.stats.photos}</span>
         </div>
         <div className={cn("flex items-center gap-2 text-slate-600 min-w-[60px]", isRTL && "flex-row-reverse")}>
            <div className="p-1.5 bg-slate-50 rounded text-slate-400 border border-slate-100"><Video size={13} strokeWidth={2.5} /></div>
            <span className="text-xs font-bold text-slate-700">{event.stats.videos}</span>
         </div>
         <div className={cn("flex items-center gap-2 text-slate-600 min-w-[80px]", isRTL && "flex-row-reverse")}>
            <div className="p-1.5 bg-slate-50 rounded text-slate-400 border border-slate-100"><HardDrive size={13} strokeWidth={2.5} /></div>
            <span className="text-xs font-bold text-slate-700">{event.stats.size}</span>
         </div>
      </div>

      {/* Actions */}
      <div className={cn("flex items-center gap-1 sm:gap-2 border-l border-slate-100 pl-4 sm:pl-6 md:border-none md:pl-0", isRTL && "flex-row-reverse border-l-0 border-r pr-4 sm:pr-6 md:pr-0")}>
        <div className={cn("hidden sm:flex items-center gap-1", isRTL ? "ml-2" : "mr-2")}>
            <button onClick={handleAddCollaborator} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors" title="Add Collaborator">
                <UserPlus size={16} />
            </button>
            <button 
                onClick={handleUpload}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors" 
                title="Upload"
            >
                <Upload size={16} />
            </button>
            <button 
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors" 
                title="Share"
            >
                <Share2 size={16} />
            </button>
            <button 
                onClick={handleEdit}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                title="Settings"
            >
                <Settings size={16} />
            </button>
            <button 
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
            >
                <Trash2 size={16} />
            </button>
        </div>

        {/* Mobile menu substitute could go here, but focusing on View Button */}
        <button 
            onClick={(e) => { e.stopPropagation(); handleViewClick(); }}
            className={cn("bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm flex items-center whitespace-nowrap", isRTL ? "mr-auto md:mr-2" : "ml-auto md:ml-2")}
        >
          {t('view_btn')}
          <ChevronRight size={14} className={cn("opacity-80", isRTL ? "mr-1 rotate-180" : "ml-1")} />
        </button>
      </div>
    </div>
  );
};
