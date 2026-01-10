
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  // Add missing ChevronDown import
  ChevronDown,
  Calendar as CalendarIcon,
  Search,
  Clock,
  MapPin,
  ExternalLink,
  Filter,
  Users,
  MoreHorizontal,
  Plus,
  Building
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { SharedEvent, Workspace } from '../../constants';
import { useNavigate } from 'react-router-dom';

interface CalendarViewProps {
  events: SharedEvent[];
  workspaces: Workspace[];
  title?: string;
  isGlobal?: boolean;
}

const THEME_COLORS: Record<string, string> = {
  ocean: 'bg-indigo-500',
  forest: 'bg-emerald-500',
  sunset: 'bg-orange-600',
  bloom: 'bg-fuchsia-500',
};

const THEME_TEXT: Record<string, string> = {
  ocean: 'text-indigo-600',
  forest: 'text-emerald-600',
  sunset: 'text-orange-600',
  bloom: 'text-fuchsia-600',
};

export const CalendarView: React.FC<CalendarViewProps> = ({ events, workspaces, title, isGlobal }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStudioId, setSelectedStudioId] = useState<string>('all');

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter events based on selected studio if in global mode
  const filteredEvents = useMemo(() => {
    if (!isGlobal || selectedStudioId === 'all') return events;
    return events.filter(event => event.workspaceId === selectedStudioId);
  }, [events, selectedStudioId, isGlobal]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: currentMonth - 1,
        year: currentYear,
        isCurrentMonth: false
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: currentMonth + 1,
        year: currentYear,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const getEventsForDay = (day: number, month: number, year: number) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === month && 
             eventDate.getFullYear() === year;
    });
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (d: number, m: number, y: number) => {
    const today = new Date();
    return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
  };

  const isSelected = (d: number, m: number, y: number) => {
    return selectedDate && d === selectedDate.getDate() && m === selectedDate.getMonth() && y === selectedDate.getFullYear();
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear());
  }, [selectedDate, filteredEvents]);

  const handleEventClick = (event: SharedEvent) => {
    const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    navigate(`/events/${slug}`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
      {/* Main Calendar Grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-100 min-h-0">
        {/* Calendar Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
               {monthNames[currentMonth]} <span className="text-slate-400 font-medium">{currentYear}</span>
            </h2>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-slate-900">
                <ChevronLeft size={18} />
              </button>
              <button onClick={handleToday} className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Today</button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-slate-900">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Studio Filter Dropdown - Only for Global View */}
             {isGlobal && (
                <div className="relative group">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={selectedStudioId}
                    onChange={(e) => setSelectedStudioId(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all appearance-none cursor-pointer hover:bg-slate-100 min-w-[160px]"
                  >
                    <option value="all">ALL STUDIOS</option>
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
             )}

             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search schedule..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all w-48 text-start"
                />
             </div>
             <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                <Filter size={18} />
             </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 h-full overflow-hidden group/grid min-h-0">
          {/* Days of week labels */}
          {daysOfWeek.map(day => (
            <div key={day} className="px-4 py-3 border-b border-slate-50 text-center">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{day}</span>
            </div>
          ))}

          {/* Actual Days */}
          {calendarDays.map((dateObj, i) => {
            const dayEvents = getEventsForDay(dateObj.day, dateObj.month, dateObj.year);
            const active = isSelected(dateObj.day, dateObj.month, dateObj.year);
            const current = isToday(dateObj.day, dateObj.month, dateObj.year);

            return (
              <div 
                key={i} 
                onClick={() => setSelectedDate(new Date(dateObj.year, dateObj.month, dateObj.day))}
                className={cn(
                  "p-2 border-r border-b border-slate-50 flex flex-col gap-1 transition-all cursor-pointer relative min-h-[100px]",
                  !dateObj.isCurrentMonth ? "bg-slate-50/30 opacity-40 grayscale" : "bg-white hover:bg-slate-50/50",
                  active && "bg-blue-50/20"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                    current ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : 
                    active ? "bg-slate-900 text-white" : "text-slate-500"
                  )}>
                    {dateObj.day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>

                <div className="flex flex-col gap-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map(event => {
                    const ws = workspaces.find(w => w.id === event.workspaceId);
                    const colorClass = THEME_COLORS[ws?.colorTheme || 'ocean'];
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "px-2 py-1 rounded-md text-[9px] font-black text-white truncate shadow-sm transform transition-all hover:scale-[1.02]",
                          colorClass
                        )}
                      >
                        {isGlobal && ws && <span className="opacity-60 mr-1">[{ws.name.split(' ')[0]}]</span>}
                        {event.title.toUpperCase()}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="px-2 py-0.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                       + {dayEvents.length - 3} More
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <aside className="w-full lg:w-96 flex flex-col bg-slate-50/30 min-h-0">
        <div className="p-8 border-b border-slate-100 bg-white flex-shrink-0">
           <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={16} /></div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Agenda Details</h3>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-11">
             {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
           </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar min-h-0">
           {selectedDayEvents.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <CalendarIcon size={32} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Events Scheduled</p>
             </div>
           ) : (
             selectedDayEvents.map(event => {
                const ws = workspaces.find(w => w.id === event.workspaceId);
                const textTheme = THEME_TEXT[ws?.colorTheme || 'ocean'];
                const bgTheme = THEME_COLORS[ws?.colorTheme || 'ocean'];
                
                return (
                  <div 
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className={cn("absolute top-0 right-0 w-1.5 h-full", bgTheme)}></div>
                    <div className="flex items-start justify-between mb-4">
                       <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", textTheme)}>
                          {event.type}
                       </span>
                       <span className={cn(
                         "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border",
                         event.status === 'Published' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                       )}>
                         {event.status}
                       </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-tight truncate">
                      {event.title}
                    </h4>
                    
                    {isGlobal && ws && (
                       <div className="flex items-center gap-1.5 mb-4">
                          <MapPin size={10} className="text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{ws.name} Studio</span>
                       </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4">
                        <div className="flex -space-x-2">
                            {event.collaborators.slice(0, 3).map((src, i) => (
                                <img key={i} src={src} className="w-6 h-6 rounded-full border-2 border-white object-cover" alt="" />
                            ))}
                            {event.collaborators.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">+{event.collaborators.length-3}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-blue-500 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest">Manage</span>
                            <ExternalLink size={12} />
                        </div>
                    </div>
                  </div>
                );
             })
           )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex-shrink-0">
           <button 
             onClick={() => navigate('/create-event')}
             className="w-full h-12 bg-[#0F172A] hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
           >
              <Plus size={16} strokeWidth={3} /> Create Event
           </button>
        </div>
      </aside>
    </div>
  );
};
