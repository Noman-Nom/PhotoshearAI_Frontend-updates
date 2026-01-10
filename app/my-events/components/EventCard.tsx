
import React from 'react';
import { 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  HardDrive, 
  Share2, 
  Trash2, 
  UserPlus,
  Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { useTranslation } from '../../../contexts/LanguageContext';

export interface EventData {
  id: string;
  title: string;
  date: string;
  status: 'Published' | 'Draft';
  imageUrl: string;
  stats: {
    photos: number;
    videos: number;
    size: string;
  };
  collaborators: string[];
}

interface EventCardProps {
  event: EventData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpload?: (id: string) => void;
  onShare?: (id: string) => void;
  onAddCollaborator?: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, onShare, onAddCollaborator, onUpload }) => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  const isPublished = event.status === 'Published';

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(event.id);
  };

  const handleViewClick = () => {
    const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    navigate(`/events/${slug}`);
  };

  return (
    <div 
      onClick={handleViewClick}
      className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer shadow-sm aspect-square"
    >
      {/* Image Section */}
      <div className="relative flex-1 w-full overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Status Badge */}
        <div className={cn("absolute top-4 z-10", isRTL ? "right-4" : "left-4")}>
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
            isPublished 
              ? "bg-[#10B981] text-white" 
              : "bg-amber-500 text-white"
          )}>
            {t(event.status.toLowerCase())}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        
        {/* Text over Image */}
        <div className={cn("absolute bottom-5 left-5 right-5 text-white text-start", isRTL ? "text-right" : "text-left")}>
          <h3 className="text-lg font-bold leading-tight mb-1 truncate">{event.title}</h3>
          <div className={cn("flex items-center text-[10px] font-semibold opacity-90", isRTL && "flex-row-reverse")}>
            <Calendar size={12} className={isRTL ? "ml-1.5" : "mr-1.5"} />
            {event.date}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={cn("px-4 py-3 border-b border-slate-50 flex items-center justify-between flex-shrink-0 bg-slate-50/30", isRTL && "flex-row-reverse")}>
        <div className={cn("flex -space-x-2 overflow-hidden", isRTL && "space-x-reverse")}>
           {event.collaborators.slice(0, 3).map((url, i) => (
             <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" alt="" />
           ))}
           {event.collaborators.length > 3 && (
             <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">+{event.collaborators.length - 3}</div>
           )}
           {event.collaborators.length === 0 && <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100" />}
        </div>

        <div className={cn("flex items-center gap-3 text-slate-400", isRTL && "flex-row-reverse")}>
           <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <ImageIcon size={14} className="text-slate-500/60" />
              <span className="text-[10px] font-bold text-slate-600">{event.stats.photos}</span>
           </div>
           <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <Video size={14} className="text-slate-500/60" />
              <span className="text-[10px] font-bold text-slate-600">{event.stats.videos}</span>
           </div>
           <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <HardDrive size={14} className="text-slate-500/60" />
              <span className="text-[10px] font-bold text-slate-600">{event.stats.size}</span>
           </div>
        </div>
      </div>

      {/* Action Row - Optimized to prevent overlapping */}
      <div className={cn("px-3 py-3 flex items-center gap-1.5 flex-shrink-0", isRTL && "flex-row-reverse")}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleViewClick(); }}
          className="flex-1 bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-black py-2.5 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          {t('view_btn')}
        </button>
        <button 
          onClick={handleEditClick}
          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black py-2.5 rounded-xl transition-all active:scale-95 whitespace-nowrap"
        >
          {t('edit_btn')}
        </button>
        
        <div className={cn("flex items-center gap-0", isRTL && "flex-row-reverse")}>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddCollaborator?.(event.id); }}
            className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
            title="Add Collaborator"
          >
            <UserPlus size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpload?.(event.id); }}
            className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
            title="Upload"
          >
            <Upload size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onShare?.(event.id); }}
            className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
            title="Share"
          >
            <Share2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(event.id); }}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete Event"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
