
import React, { useMemo } from 'react';
import { Sidebar } from '../../components/shared/Sidebar';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  HardDrive, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Layout,
  Clock,
  ChevronRight,
  Globe,
  Star,
  Eye,
  Download,
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { SHARED_EVENTS } from '../../constants';
import { formatBytes } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';

const AnalyticsPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const { t, isRTL } = useTranslation();

  // Aggregate Real Data
  const studioStats = useMemo(() => {
    if (!activeWorkspace) return { totalPhotos: 0, totalVideos: 0, totalSize: 0, events: [] };
    
    const events = SHARED_EVENTS.filter(e => e.workspaceId === activeWorkspace.id);
    const totalPhotos = events.reduce((acc, e) => acc + (e.totalPhotos || 0), 0);
    const totalVideos = events.reduce((acc, e) => acc + (e.totalVideos || 0), 0);
    const totalSize = events.reduce((acc, e) => acc + (e.totalSizeBytes || 0), 0);

    return { totalPhotos, totalVideos, totalSize, events };
  }, [activeWorkspace]);

  // Simulated Growth Data for Charts
  const growthData = [
    { day: 'Mon', views: 120, downloads: 45 },
    { day: 'Tue', views: 250, downloads: 88 },
    { day: 'Wed', views: 180, downloads: 62 },
    { day: 'Thu', views: 320, downloads: 140 },
    { day: 'Fri', views: 410, downloads: 210 },
    { day: 'Sat', views: 380, downloads: 185 },
    { day: 'Sun', views: 290, downloads: 110 },
  ];

  const maxVal = Math.max(...growthData.map(d => d.views));

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <header className="bg-white px-4 md:px-8 py-6 border-b border-slate-200 flex-shrink-0">
          <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
             <div className={cn("text-start", isRTL && "text-right")}>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Studio Intelligence</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Performance Metrics for <span className="text-slate-900">{activeWorkspace?.name || 'Selected Studio'}</span>
                </p>
             </div>
             <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                 <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 rounded-lg shadow-sm">Last 7 Days</button>
                 <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Monthly</button>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8">
            
            {/* Top KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Total Media" 
                    value={`${(studioStats.totalPhotos + studioStats.totalVideos).toLocaleString()}`} 
                    subtitle={`${studioStats.totalPhotos} Photos • ${studioStats.totalVideos} Videos`}
                    icon={<Zap className="text-blue-600" size={20} />}
                    trend="+12.5%"
                    trendUp={true}
                />
                <KPICard 
                    title="Storage Load" 
                    value={formatBytes(studioStats.totalSize, 1)} 
                    subtitle="of 1.0 GB limit"
                    icon={<HardDrive className="text-indigo-600" size={20} />}
                    trend="Normal"
                    trendUp={null}
                />
                <KPICard 
                    title="Studio Traffic" 
                    value="4,822" 
                    subtitle="Unique client views"
                    icon={<Eye className="text-emerald-600" size={20} />}
                    trend="+24%"
                    trendUp={true}
                />
                <KPICard 
                    title="Active Nodes" 
                    value={studioStats.events.length.toString()} 
                    subtitle="Published collections"
                    icon={<Globe className="text-fuchsia-600" size={20} />}
                    trend="Static"
                    trendUp={null}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Engagement Line Chart */}
                <Card className="lg:col-span-2 p-8 border-none shadow-sm rounded-[2.5rem] bg-white text-start">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Engagement Growth</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Daily views vs. direct downloads</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase">Views</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                <span className="text-[10px] font-black text-slate-400 uppercase">Downloads</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full relative flex items-end justify-between px-2">
                        {/* Simulated Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-px bg-slate-900" />)}
                        </div>

                        {growthData.map((d, i) => {
                            const viewHeight = (d.views / maxVal) * 100;
                            const downloadHeight = (d.downloads / maxVal) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    {/* Bar Hover Info */}
                                    <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-900 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                        {d.views} Views / {d.downloads} DL
                                    </div>
                                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                                        <div className="w-3 bg-blue-500 rounded-t-lg transition-all duration-700 group-hover:brightness-110" style={{ height: `${viewHeight}%` }} />
                                        <div className="w-3 bg-slate-100 rounded-t-lg transition-all duration-700 group-hover:bg-slate-200" style={{ height: `${downloadHeight}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-4 uppercase font-mono">{d.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Event Type Distribution */}
                <Card className="p-8 border-none shadow-sm rounded-[2.5rem] bg-white text-start flex flex-col">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Category Spread</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-8">Studio collection diversity</p>
                    
                    <div className="flex-1 space-y-6">
                        <DistributionBar label="Wedding" percentage={65} color="bg-rose-500" />
                        <DistributionBar label="Commercial" percentage={20} color="bg-blue-500" />
                        <DistributionBar label="Portrait" percentage={10} color="bg-emerald-500" />
                        <DistributionBar label="Event/Other" percentage={5} color="bg-amber-500" />
                    </div>

                    <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase">
                            Wedding collections generate 3x more engagement than other categories in this studio.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Bottom Row: Top Events Table */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden text-start">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Top Performing Nodes</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ranking by engagement & scale</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-5 text-left font-black">Event Identifier</th>
                                <th className="px-8 py-5 text-left font-black">Status</th>
                                <th className="px-8 py-5 text-left font-black">Payload</th>
                                <th className="px-8 py-5 text-left font-black">Engagement Score</th>
                                <th className="px-8 py-5 text-right font-black">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {studioStats.events.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-30">
                                            <Calendar size={48} className="text-slate-300 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">No active datasets detected</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                studioStats.events.slice(0, 5).map((event, i) => (
                                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100 flex-shrink-0">
                                                    <img src={event.coverUrl} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight truncate max-w-[180px]">{event.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{event.date.toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                event.status === 'Published' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-mono text-[10px] text-slate-500 font-bold">
                                            {event.totalPhotos}P • {event.totalVideos}V
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${80 - (i * 15)}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900">{80 - (i * 15)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {studioStats.events.length > 5 && (
                    <div className="p-6 text-center border-t border-slate-50">
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors">
                            Decrypt Full Repository ({studioStats.events.length} Nodes)
                        </button>
                    </div>
                )}
            </Card>

        </main>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon, trend, trendUp }: any) => (
    <Card className="p-8 border-none shadow-sm rounded-[2.5rem] bg-white group hover:shadow-xl transition-all duration-500 text-start">
        <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:scale-110 shadow-inner border border-slate-100">
                {icon}
            </div>
            {trend && (
                <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border",
                    trendUp === true ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    trendUp === false ? "bg-rose-50 text-rose-600 border-rose-100" : 
                    "bg-slate-50 text-slate-400 border-slate-100"
                )}>
                    {trendUp === true && <ArrowUpRight size={10} />}
                    {trendUp === false && <ArrowDownRight size={10} />}
                    {trend}
                </div>
            )}
        </div>
        <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase mt-1">{subtitle}</span>
            </div>
        </div>
    </Card>
);

const DistributionBar = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-[10px] font-bold text-slate-900 font-mono">{percentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)} style={{ width: `${percentage}%` }} />
        </div>
    </div>
);

export default AnalyticsPage;
