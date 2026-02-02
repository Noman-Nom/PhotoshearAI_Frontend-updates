import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, User, AlertCircle, Mail, ScanFace } from 'lucide-react';
import { saveGuestToRegistry } from '../../constants';
import { useEvents } from '../../contexts/EventsContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTranslation } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import { clientAccessApi } from '../../services/clientAccessApi';
import { facesApi } from '../../services/facesApi';

type Step = 'INFO' | 'SCAN';

const GuestAccessPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();
    const { getEventById } = useEvents();

    // Event data state
    const [eventData, setEventData] = useState<{ id: string; title: string; workspaceId: string } | null>(null);
    const [guestToken, setGuestToken] = useState<string | null>(null);

    // State - Simplified: only name (required) and email (optional)
    const [step, setStep] = useState<Step>('INFO');
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Camera State
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState('Align Your Face Within The Frame');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState('');
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Load event data on mount
    useEffect(() => {
        const loadEvent = async () => {
            if (eventId) {
                const event = await getEventById(eventId);
                if (event) {
                    setEventData({
                        id: event.id,
                        title: event.title,
                        workspaceId: event.workspace_id
                    });
                }
            }
        };
        loadEvent();
    }, [eventId, getEventById]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleContinue = async () => {
        // Validation - only name is required
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        if (!eventId) return;

        setIsLoading(true);

        try {
            // Register guest and get token (no PIN/OTP required)
            const response = await clientAccessApi.registerGuest(
                eventId,
                formData.name.trim(),
                formData.email.trim() || undefined
            );

            setGuestToken(response.guest_token);

            // Save to guest registry
            saveGuestToRegistry({
                id: response.guest_id,
                name: formData.name.trim(),
                email: formData.email.trim() || '',
                phone: '',
                workspaceId: eventData?.workspaceId || 'unknown',
                workspaceName: 'Studio',
                eventId: eventId,
                eventName: response.event_title || eventData?.title || 'Event',
                accessDate: new Date().toLocaleDateString(),
                downloadCount: 0
            });

            sessionStorage.setItem('fotoshare_guest_token', response.guest_token);

            setStep('SCAN');
            setError('');
        } catch (err: any) {
            console.error("Guest registration failed", err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = formData.name.trim().length > 0;

    const startCamera = async () => {
        try {
            setIsScanning(true);
            setCameraError('');
            setScanStatus('Initializing Camera...');

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCameraReady(true);
            setScanStatus('Ready to Scan');
        } catch (err) {
            console.error("Camera error:", err);
            setIsScanning(false);
            setCameraError('Camera access denied. Please allow camera permissions to continue.');
        }
    };

    const captureAndSearch = async () => {
        if (!videoRef.current || !eventId || !guestToken) return;

        setIsScanning(true);
        setScanStatus('Scanning Face...');

        try {
            // 1. Capture Image
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);

            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (!blob) throw new Error("Failed to capture image");

            // 2. Create Search Job
            setScanStatus('Processing Biometrics...');
            const uploadInfo = await facesApi.createSearch(eventId, guestToken);

            // 3. Upload Image to presigned URL
            await facesApi.uploadImage(uploadInfo.upload_url, blob);

            // 4. Start Search
            setScanStatus('Searching Gallery...');
            await facesApi.startSearch(uploadInfo.job_id, guestToken);

            // 5. Poll for Results
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds timeout

            const pollInterval = setInterval(async () => {
                try {
                    attempts++;
                    const jobStatus = await facesApi.getJobStatus(uploadInfo.job_id, guestToken);

                    if (jobStatus.status === 'processed') {
                        clearInterval(pollInterval);
                        setScanStatus('Match Found!');

                        // Extract matches from result
                        const matches = jobStatus.result?.matches || [];

                        stopCamera();
                        navigate(`/guest-gallery/${eventId}`, {
                            state: {
                                matches,
                                guestName: formData.name,
                                guestToken,
                                eventTitle: eventData?.title || 'Event Gallery'
                            }
                        });
                    } else if (jobStatus.status === 'failed') {
                        clearInterval(pollInterval);
                        setScanStatus('Search Failed');
                        setCameraError(jobStatus.error || 'Face search failed. Please try again.');
                        setIsScanning(false);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        setScanStatus('Timeout');
                        setCameraError('Search timed out. Please try again.');
                        setIsScanning(false);
                    }
                } catch (e) {
                    clearInterval(pollInterval);
                    setIsScanning(false);
                    setCameraError('Network error during search.');
                }
            }, 1000);

        } catch (err: any) {
            console.error("Search flow error", err);
            setIsScanning(false);
            setCameraError(err.message || 'Failed to process face search');
            setScanStatus('Error');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsScanning(false);
        setIsCameraReady(false);
    };

    // SCAN STEP
    if (step === 'SCAN') {
        return (
            <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 font-sans text-white relative overflow-hidden">

                <style>{`
                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                    70% { transform: scale(1); opacity: 0; box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { transform: scale(0.95); opacity: 0; }
                }
                @keyframes blink-text {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
             `}</style>

                <div className="text-center mb-8 z-10">
                    <h1 className="text-2xl font-bold mb-2">Hello {formData.name}!</h1>
                    <p className="text-slate-400 text-sm">Scanning your face to find your memories</p>
                </div>

                <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-3xl overflow-hidden bg-slate-900 mb-8 border border-slate-700 shadow-2xl">
                    {isScanning ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 opacity-50"></div>
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-4 z-10">
                                <User size={48} className="text-slate-600" />
                            </div>
                            <p className="z-10 text-xs font-medium opacity-50">Click start to begin</p>
                        </div>
                    )}

                    {isScanning && scanStatus !== 'Ready to Scan' && (
                        <>
                            <div className="absolute inset-0 pointer-events-none opacity-20"
                                style={{
                                    backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                                    backgroundSize: '40px 40px'
                                }}>
                            </div>

                            <div className="absolute left-0 right-0 h-[2px] bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)] z-20"
                                style={{ animation: 'scan-line 2s linear infinite' }}>
                                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-500/20 to-transparent"></div>
                            </div>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-blue-500/30 rounded-[3rem] z-10">
                                <div className="absolute inset-0 border-2 border-blue-400 rounded-[3rem] opacity-50"
                                    style={{ animation: 'pulse-ring 2s ease-out infinite' }}>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="text-center z-10 space-y-6 w-full max-w-[320px]">
                    <p className={isScanning && scanStatus !== 'Ready to Scan' ? "text-sm font-bold text-blue-300 tracking-wider uppercase animate-[blink-text_1s_infinite]" : "text-sm font-medium text-slate-300"}>
                        {scanStatus}
                    </p>

                    {cameraError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-left">
                            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-300">{cameraError}</p>
                        </div>
                    )}

                    <Button
                        onClick={!isScanning ? startCamera : captureAndSearch}
                        disabled={isScanning && !isCameraReady}
                        className={`w-full h-12 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-blue-900/20 ${isScanning
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        {isScanning ? (
                            isCameraReady ? (
                                scanStatus === 'Ready to Scan' ? 'Scan My Face' : (
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                        Processing...
                                    </span>
                                )
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                    Starting Camera...
                                </span>
                            )
                        ) : (cameraError ? 'Retry Camera' : 'Start Camera & Scan')}
                    </Button>

                    <button
                        onClick={() => {
                            stopCamera();
                            setStep('INFO');
                        }}
                        className={cn("flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mx-auto", isRTL && "flex-row-reverse")}
                    >
                        <ArrowLeft size={12} className={cn(isRTL && "rotate-180")} />
                        Back to details
                    </button>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
        );
    }

    // INFO STEP - Simplified form
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white w-full max-w-[440px] rounded-[2rem] shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-100">

                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                <div className="w-16 h-16 bg-blue-50 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6 mt-2 shadow-inner">
                    <ScanFace className="text-blue-500 w-7 h-7 stroke-[2]" />
                </div>

                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">{t('guest_access')}</h1>
                <p className="text-sm text-slate-500 mb-8 font-medium px-4">
                    Enter your name to find photos of you from the event
                </p>

                <div className="space-y-4 mb-8 text-start">
                    <Input
                        label="Your Name *"
                        name="name"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        leftIcon={<User size={16} />}
                        className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                    />

                    <Input
                        label="Email (Optional)"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        leftIcon={<Mail size={16} />}
                        className="bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                    />
                    <p className="text-xs text-slate-400 text-center">
                        We'll send you a link to your photos if provided
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-600 text-[13px] py-3 px-4 rounded-xl font-bold border border-red-100 animate-in fade-in slide-in-from-top-1 flex items-center justify-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button
                    onClick={handleContinue}
                    disabled={!isFormValid || isLoading}
                    className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center shadow-xl uppercase tracking-[0.1em] text-sm active:scale-[0.98] ${isFormValid
                        ? 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-slate-900/10'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                        }`}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Camera size={16} className="mr-2" />
                            Continue to Face Scan
                        </>
                    )}
                </button>

                {eventData && (
                    <p className="mt-8 text-xs text-slate-400">
                        Event: <span className="font-semibold text-slate-600">{eventData.title}</span>
                    </p>
                )}
            </div>
        </div>
    );
};

export default GuestAccessPage;
