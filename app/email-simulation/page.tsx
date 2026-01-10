
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/shared/Sidebar';
import { SIMULATED_EMAILS, SimulatedEmail } from '../../constants';
import { Mail, Search, Clock, CheckCircle2, User, RefreshCw, Trash2, ArrowLeft, UserPlus, Info, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

// Special component for Invitations
const InvitationEmailBody = ({ bodyStr }: { bodyStr: string }) => {
    const navigate = useNavigate();
    let data;
    try {
        data = JSON.parse(bodyStr);
    } catch (e) {
        return <div className="p-8 min-h-[300px] text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">{bodyStr}</div>;
    }

    if (data.type === 'INVITATION') {
        const handleAcceptClick = () => {
            const params = new URLSearchParams({
                recipient: data.recipient,
                accessLevel: Array.isArray(data.accessLevel) ? data.accessLevel.join(', ') : data.accessLevel,
                org: data.org
            });
            navigate(`/accept-invitation?${params.toString()}`);
        };

        const renderAccessScope = () => {
            if (Array.isArray(data.accessLevel)) {
                return (
                    <ul className="mt-1 space-y-1">
                        {data.accessLevel.map((ws: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-slate-900 font-semibold">
                                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                {ws}
                            </li>
                        ))}
                    </ul>
                );
            }
            return <span className="text-slate-900 font-semibold">{data.accessLevel}</span>;
        };

        return (
            <div className="p-8 text-sm text-slate-800 font-sans leading-relaxed">
                <p className="mb-4">Hello,</p>
                <p className="mb-6">
                    You have been invited to join the <span className="font-bold text-slate-900">{data.org} Workspace</span>. 
                    The team would love to have you on board to collaborate on events and manage brandings.
                </p>

                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 mb-8 max-w-lg shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3 mb-5">Invitation Details</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-start text-sm">
                            <span className="text-slate-500 font-medium whitespace-nowrap mr-4">Invited as:</span>
                            <span className="text-slate-900 font-semibold truncate">{data.recipient}</span>
                        </div>
                        <div className="flex justify-between items-start text-sm">
                            <span className="text-slate-500 font-medium whitespace-nowrap mr-4">Platform Role:</span>
                            <span className="text-slate-900 font-semibold">{data.role || 'Collaborator'}</span>
                        </div>
                        <div className="flex justify-between items-start text-sm">
                            <span className="text-slate-500 font-medium whitespace-nowrap mr-4">Access Scope:</span>
                            <div className="text-right">
                                {renderAccessScope()}
                            </div>
                        </div>
                         <div className="flex justify-between items-start text-sm">
                            <span className="text-slate-500 font-medium whitespace-nowrap mr-4">Organization:</span>
                            <span className="text-slate-900 font-semibold">{data.org}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleAcceptClick}
                        className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-black uppercase tracking-[0.1em] text-xs py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] mb-4"
                    >
                        <UserPlus size={16} />
                        Accept Invitation
                    </button>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                        <Info size={12} />
                        <span>Simulated acceptance link for development</span>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-8 mt-4 flex flex-col items-center sm:items-start">
                    <p className="mb-4">
                        Best regards,<br/>
                        <span className="font-bold text-slate-900">The {data.org} Team</span>
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-6 gap-4">
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                            Powered By AI Photo Share
                        </div>
                        <a href="#" className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors">
                            Contact Us <ExternalLink size={10} />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return <div className="p-8 min-h-[300px] text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">{bodyStr}</div>;
};

const EmailSimulationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [emails, setEmails] = useState<SimulatedEmail[]>(SIMULATED_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(emails[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Explicit back handler using state origin
  const handleBack = () => {
      const from = (location.state as any)?.from;
      if (from) {
          navigate(from);
      } else {
          // Robust fallbacks if history/state is lost
          if (isAuthenticated) {
              navigate('/dashboard');
          } else {
              navigate('/login');
          }
      }
  };

  useEffect(() => {
    const interval = setInterval(() => {
       const freshEmails = JSON.parse(localStorage.getItem('simulated_emails_v1') || '[]');
       if (freshEmails.length !== emails.length) {
           setEmails(freshEmails);
           if (!selectedEmail && freshEmails.length > 0) {
               setSelectedEmail(freshEmails[0]);
           }
       }
    }, 2000);
    return () => clearInterval(interval);
  }, [emails.length, selectedEmail]);

  const refreshEmails = () => {
      const freshEmails = JSON.parse(localStorage.getItem('simulated_emails_v1') || '[]');
      setEmails(freshEmails);
      if (!selectedEmail && freshEmails.length > 0) {
        setSelectedEmail(freshEmails[0]);
      }
  };

  const handleClear = () => {
      localStorage.removeItem('simulated_emails_v1');
      setEmails([]);
      setSelectedEmail(null);
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const hasEmails = emails.length > 0;
  
  const filteredEmails = emails.filter(email => 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) || 
      email.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {isAuthenticated && <Sidebar />}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header with Back Button */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
                <button 
                  onClick={handleBack}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                  title="Go Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Mail size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Email Simulation</h1>
                        <p className="text-xs text-slate-500">Monitor outbound simulated notifications</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button onClick={refreshEmails} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Refresh">
                    <RefreshCw size={18} />
                 </button>
                 <button onClick={handleClear} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full text-slate-400" title="Clear History">
                    <Trash2 size={18} />
                 </button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search emails..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {!hasEmails ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 p-6 text-center">
                            <Mail size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">No emails sent yet.</p>
                            <p className="text-xs mt-1">Simulate emails by triggering actions in the app.</p>
                        </div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 p-6 text-center">
                            <Search size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">No emails match your search.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredEmails.map(email => (
                                <div 
                                    key={email.id}
                                    onClick={() => setSelectedEmail(email)}
                                    className={cn(
                                        "p-4 cursor-pointer transition-colors hover:bg-slate-50 text-start",
                                        selectedEmail?.id === email.id ? "bg-indigo-50/50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn("text-sm font-bold truncate pr-2", selectedEmail?.id === email.id ? "text-indigo-900" : "text-slate-900")}>
                                            {email.to}
                                        </span>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(email.date)}</span>
                                    </div>
                                    <div className="text-xs font-medium text-slate-700 mb-1 truncate">{email.subject}</div>
                                    <div className="text-[11px] text-slate-400 line-clamp-2">
                                        {email.body.startsWith('{') ? "Interactive Invitation Content" : email.body}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
                {selectedEmail ? (
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/30 text-start">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                            <CheckCircle2 size={12} />
                                            Sent
                                        </div>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatDate(selectedEmail.date)}
                                        </span>
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedEmail.subject}</h2>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                        {selectedEmail.subject.includes('invit') ? (
                                            <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white text-xs font-bold uppercase">i</div>
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-bold text-slate-900">
                                                {selectedEmail.subject.includes('invit') ? 'invites@photmo.com' : 'System Notification'}
                                            </span>
                                            <span className="text-xs text-slate-500">&lt;no-reply@photmo.com&gt;</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            To: <span className="text-slate-900 font-medium">{selectedEmail.to}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-start">
                              <InvitationEmailBody bodyStr={selectedEmail.body} />
                            </div>
                            
                            <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
                                <p className="text-[10px] text-slate-400">
                                    This is an automated simulation message for testing purposes.
                                    <br/>
                                    &copy; 2025 Photmo Inc.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Mail size={32} className="opacity-20" />
                        </div>
                        <p className="text-sm font-medium">Select an email to view details</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSimulationPage;
