
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    Star,
    Shield,
    Copy,
    QrCode,
    Lock,
    Eye,
    Send,
    Save,
    Check,
    Download,
    Pencil
} from 'lucide-react';
import { Sidebar } from '../../components/shared/Sidebar';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { Modal } from '../../components/ui/Modal';
import { useEvents } from '../../contexts/EventsContext';
import { addSimulatedEmail } from '../../constants';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../contexts/LanguageContext';
import eventsApi from '../../services/eventsApi';

// Local event type for this page
interface LocalEvent {
    id: string;
    title: string;
    customerEmail?: string;
    customerName?: string;
}

const ShareEventPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();
    const { getEventById } = useEvents();
    const [event, setEvent] = useState<LocalEvent | null>(null);

    // Real event data state
    const [pinCode, setPinCode] = useState('0000');

    // Toggles for PIN requirements
    const [guestPinRequired, setGuestPinRequired] = useState(false);
    // These might not be separate in backend yet, using shared settings for now
    const [selectionPinRequired, setSelectionPinRequired] = useState(false);
    const [fullPinRequired, setFullPinRequired] = useState(false);

    // Loading state for "Save Changes"
    const [isSaving, setIsSaving] = useState(false);

    // QR Modal State
    const [qrModalState, setQrModalState] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false,
        url: '',
        title: ''
    });

    useEffect(() => {
        const loadEvent = async () => {
            if (eventId) {
                const found = await getEventById(eventId);
                if (found) {
                    setEvent({
                        id: found.id,
                        title: found.title,
                        customerEmail: found.customer_email || undefined,
                        customerName: found.customer_name || undefined
                    });

                    // In a real app, we would fetch share settings specifically
                    // For now, assuming event object has them or defaults
                    // @ts-ignore - The type definition in frontend might be missing these fields but API returns them
                    if (found.pin_code) setPinCode(found.pin_code);
                    // @ts-ignore
                    if (found.pin_required !== undefined) {
                        // @ts-ignore
                        setGuestPinRequired(found.pin_required);
                        // @ts-ignore
                        setSelectionPinRequired(found.pin_required);
                        // @ts-ignore
                        setFullPinRequired(found.pin_required);
                    }
                }
            }
        };
        loadEvent();
    }, [eventId, getEventById]);

    const handleResendEmail = () => {
        if (event && event.customerEmail) {
            const subject = t('email_subject_template').replace('{title}', event.title);
            const domain = window.location.origin;
            const body = t('email_body_template')
                .replace('{name}', event.customerName || t('customer_fallback'))
                .replace('{url}', `${domain}/guest-access/${event.id}`)
                .replace('{pin}', pinCode);

            addSimulatedEmail({
                to: event.customerEmail,
                subject,
                body
            });
            alert(t('email_sent_to_success').replace('{email}', event.customerEmail));
        } else {
            alert(t('no_customer_email_error'));
        }
    };

    const handleSave = async () => {
        if (!eventId) return;
        setIsSaving(true);
        try {
            await eventsApi.updateShareSettings(eventId, {
                pin_required: guestPinRequired, // Assuming uniform setting for now
                pin_code: pinCode
            });
            // Update local state if needed
            // Also update others if we want consistency
            setSelectionPinRequired(guestPinRequired);
            setFullPinRequired(guestPinRequired);

            // Show success ? useToast is not imported but alert uses basic alert
            // alert(t('changes_saved_success')); 
        } catch (error) {
            console.error("Failed to update share settings", error);
            alert("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const openQrModal = (url: string, title: string) => {
        setQrModalState({ isOpen: true, url, title });
    };

    const closeQrModal = () => {
        setQrModalState(prev => ({ ...prev, isOpen: false }));
    };

    const handleDownloadQr = async () => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrModalState.url)}`;
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const localUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = localUrl;
            link.download = `qrcode-${qrModalState.title.toLowerCase().replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(localUrl);
        } catch (error) {
            console.error('Failed to download QR', error);
            window.open(qrUrl, '_blank');
        }
    };

    const handlePreviewGuest = () => {
        navigate(`/guest-access/${eventId}`);
    };

    const handlePreviewSelection = () => {
        navigate(`/client-access/${eventId}?mode=selection`);
    };

    const handlePreviewFull = () => {
        navigate(`/client-access/${eventId}?mode=full`);
    };

    if (!event) return null;

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/30">
                {/* Header */}
                <header className="flex-shrink-0 bg-white border-b border-slate-200 z-10">
                    <div className="w-full px-6 py-4 sm:px-8">
                        <div className={cn("flex flex-col lg:flex-row lg:items-center justify-between gap-4", isRTL && "lg:flex-row-reverse")}>
                            <div className={cn("flex items-center gap-5 min-w-0", isRTL && "flex-row-reverse")}>
                                <button
                                    onClick={() => navigate('/my-events')}
                                    className={cn("flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group flex-shrink-0", isRTL && "flex-row-reverse")}
                                >
                                    <div className={cn("p-2 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors", isRTL ? "ml-2" : "mr-2")}>
                                        <ArrowLeft size={16} className={cn("text-slate-600", isRTL && "rotate-180")} />
                                    </div>
                                    <span className="hidden sm:inline">{t('back_to_events')}</span>
                                </button>

                                <div className="h-10 w-px bg-slate-200 hidden sm:block flex-shrink-0"></div>

                                <div className="min-w-0 text-start">
                                    <h1 className={cn("text-xl sm:text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2 truncate", isRTL && "text-right")}>
                                        {t('share_event_title')} <span className="text-slate-300 font-light hidden sm:inline">|</span> <span className="text-slate-600 font-normal truncate">{event.title}</span>
                                    </h1>
                                    <p className={cn("text-sm text-slate-500 mt-1 truncate", isRTL && "text-right")}>
                                        {t('share_event_subtitle')}
                                    </p>
                                </div>
                            </div>

                            <div className={cn("flex items-center gap-3 flex-shrink-0 w-full lg:w-auto", isRTL && "flex-row-reverse")}>
                                <Button
                                    variant="outline"
                                    onClick={handleResendEmail}
                                    className="gap-2 h-9 text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50 text-slate-700 flex-1 lg:flex-none justify-center whitespace-nowrap"
                                >
                                    <Send size={14} />
                                    {t('resend_email_btn')}
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="gap-2 h-9 text-xs font-semibold bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-sm flex-1 lg:flex-none justify-center whitespace-nowrap"
                                    isLoading={isSaving}
                                >
                                    {isSaving ? t('saving_label') : t('save_changes')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="w-full px-6 py-6 sm:px-8 space-y-4 pb-32 md:pb-6">

                        {/* Guest Access Card */}
                        <ShareCard
                            icon={<Users size={20} />}
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                            title={t('guest_access_title')}
                            description={t('guest_access_desc')}
                            url={`${window.location.origin}/#/guest-access/${event.id}`}
                            pin={pinCode}
                            isPinRequired={guestPinRequired}
                            onTogglePin={setGuestPinRequired}
                            onQrClick={() => openQrModal(`${window.location.origin}/#/guest-access/${event.id}`, t('guest_access_title'))}
                            onPreview={handlePreviewGuest}
                            onPinChange={setPinCode}
                        />

                        {/* Selection Mode Card */}
                        <ShareCard
                            icon={<Star size={20} />}
                            iconBg="bg-purple-50"
                            iconColor="text-purple-600"
                            title={t('selection_mode_title')}
                            description={t('selection_mode_desc')}
                            url={`${window.location.origin}/#/client-access/${event.id}?mode=selection`}
                            pin={pinCode}
                            isPinRequired={selectionPinRequired}
                            onTogglePin={setSelectionPinRequired}
                            onQrClick={() => openQrModal(`${window.location.origin}/#/client-access/${event.id}?mode=selection`, t('selection_mode_title'))}
                            onPreview={handlePreviewSelection}
                            onPinChange={setPinCode}
                        />

                        {/* Full Gallery Access Card */}
                        <ShareCard
                            icon={<Shield size={20} />}
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-600"
                            title={t('full_access_title')}
                            description={t('full_access_desc')}
                            url={`${window.location.origin}/#/client-access/${event.id}?mode=full`}
                            pin={pinCode}
                            isPinRequired={fullPinRequired}
                            onTogglePin={setFullPinRequired}
                            onQrClick={() => openQrModal(`${window.location.origin}/#/client-access/${event.id}?mode=full`, t('full_access_title'))}
                            onPreview={handlePreviewFull}
                            onPinChange={setPinCode}
                        />

                    </div>
                </main>
            </div>

            {/* QR Code Modal */}
            <Modal
                isOpen={qrModalState.isOpen}
                onClose={closeQrModal}
                title={qrModalState.title}
                className="max-w-[480px] w-full"
            >
                <div className="flex flex-col items-center justify-center p-6 pb-2">
                    <p className="text-sm text-slate-500 mb-6 text-center">{t('scan_qr_desc')}</p>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 inline-block">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(qrModalState.url)}`}
                            alt="QR Code"
                            className="w-[350px] h-[350px] object-contain block"
                        />
                    </div>

                    <Button
                        onClick={handleDownloadQr}
                        className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white h-12 text-sm font-semibold"
                    >
                        <Download size={18} className={isRTL ? "ml-2" : "mr-2"} />
                        {t('download_qr_btn')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// Reusable Share Card Component
interface ShareCardProps {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    url: string;
    pin: string;
    isPinRequired: boolean;
    onTogglePin: (val: boolean) => void;
    onQrClick: () => void;
    onPreview?: () => void;
    onPinChange?: (pin: string) => void;
}

const ShareCard: React.FC<ShareCardProps> = ({
    icon,
    iconBg,
    iconColor,
    title,
    description,
    url,
    pin,
    isPinRequired,
    onTogglePin,
    onQrClick,
    onPreview,
    onPinChange
}) => {
    const [isEditingPin, setIsEditingPin] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pinCopied, setPinCopied] = useState(false);
    const { t, isRTL } = useTranslation();

    const handleCopy = (text: string, setCopiedState: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6">
                {/* Header Row */}
                <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between mb-5 gap-4", isRTL && "sm:flex-row-reverse")}>
                    <div className={cn("flex items-start gap-4", isRTL && "flex-row-reverse")}>
                        <div className={cn("p-2.5 rounded-lg flex-shrink-0", iconBg, iconColor)}>
                            {icon}
                        </div>
                        <div className="text-start">
                            <h3 className={cn("text-base font-bold text-slate-900", isRTL && "text-right")}>{title}</h3>
                            <p className={cn("text-xs text-slate-500 mt-1 max-w-md leading-relaxed", isRTL && "text-right")}>{description}</p>
                        </div>
                    </div>
                    {onPreview && (
                        <button
                            onClick={onPreview}
                            className={cn(
                                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wide w-full sm:w-auto",
                                isRTL && "flex-row-reverse"
                            )}
                        >
                            <Eye size={12} />
                            {t('preview_label')}
                        </button>
                    )}
                </div>

                {/* URL Input Row */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="relative flex-1">
                        <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </div>
                        <input
                            type="text"
                            readOnly
                            value={url}
                            className={cn(
                                "w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300",
                                isRTL ? "pr-10 pl-32 text-right" : "pl-10 pr-32 text-left"
                            )}
                        />
                        <div className={cn("absolute top-1 flex items-center gap-1", isRTL ? "left-1" : "right-1")}>
                            <button
                                onClick={() => handleCopy(url, setCopied)}
                                className={cn("flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm", isRTL && "flex-row-reverse")}
                            >
                                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                {copied ? t('copied_label') : t('copy_label')}
                            </button>
                            <button
                                onClick={onQrClick}
                                className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <QrCode size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer / Security Row */}
                <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-slate-100", isRTL && "sm:flex-row-reverse")}>
                    <div className={cn("flex items-center gap-3 sm:gap-6 w-full sm:w-auto", isRTL && "flex-row-reverse")}>
                        <div className="text-slate-300 flex-shrink-0">
                            <Lock size={16} />
                        </div>
                        <div className={cn("flex items-center gap-3 flex-1 sm:flex-auto", isRTL && "flex-row-reverse")}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('access_pin_label')}</span>

                            {isEditingPin && onPinChange ? (
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => onPinChange(e.target.value)}
                                    className="w-20 px-2 py-0.5 text-sm font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    maxLength={8}
                                    autoFocus
                                    onBlur={() => setIsEditingPin(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingPin(false)}
                                />
                            ) : (
                                <span className="text-sm font-bold text-slate-900 font-mono tracking-wide px-1">{pin}</span>
                            )}

                            {onPinChange && (
                                <button
                                    onClick={() => setIsEditingPin(!isEditingPin)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title={isEditingPin ? "Save PIN" : "Edit PIN"}
                                >
                                    {isEditingPin ? <Check size={12} strokeWidth={3} /> : <Pencil size={12} />}
                                </button>
                            )}

                            <button
                                onClick={() => handleCopy(pin, setPinCopied)}
                                className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded hover:bg-slate-200 transition-colors"
                            >
                                {pinCopied ? t('copied_label') : t('copy_label')}
                            </button>
                        </div>
                    </div>

                    <div className={cn("flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pl-9 sm:pl-0", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200", isRTL && "flex-row-reverse")}>
                            <Lock size={10} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('active_status')}</span>
                        </div>
                        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                            <span className="text-xs font-medium text-slate-600">{t('require_pin_label')}</span>
                            <Switch checked={isPinRequired} onCheckedChange={onTogglePin} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShareEventPage;
