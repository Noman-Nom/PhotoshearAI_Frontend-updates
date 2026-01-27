
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Upload,
  Image as ImageIcon,
  Globe,
  Smartphone,
  Lock,
  Copy,
  Shield,
  X,
  Save,
  User,
  Mail,
  Layout,
  Check,
  Instagram,
  Facebook,
  Youtube,
  Plus,
  Info
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { Switch } from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { Sidebar } from '../../components/shared/Sidebar';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useBranding } from '../../contexts/BrandingContext';
import { useEvents } from '../../contexts/EventsContext';
import { addSimulatedEmail } from '../../constants';
import { EMAIL_REGEX } from '../../utils/validators';
import { uploadAsset } from '../../utils/api';
import { GridPosition, getAbsolutePosition, getGradientClass, getTextAlignment } from '../../utils/positionHelpers';
import { BrandingItem } from '../../services/brandingApi';
import { PositionSelector } from '../../components/shared/PositionSelector';
import { useFileUpload } from '../../hooks/useFileUpload';
import { ModernInput } from '../../components/ui/ModernInput';

const FieldLabel = ({ children, optional }: { children?: React.ReactNode, optional?: boolean }) => {
  const { t } = useTranslation();
  return (
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
      {children}
      {optional && <span className="text-slate-400 font-normal normal-case ml-1">({t('draft')})</span>}
    </label>
  );
};





const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { t, isRTL } = useTranslation();
  const { createEvent, updateEvent, getEventById, isLoading: isSaving } = useEvents();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const isEditMode = !!eventId;

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('conference');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Switch State
  const [isBrandingEnabled, setIsBrandingEnabled] = useState(false);
  const [isPublicVisible, setIsPublicVisible] = useState(true);
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const [pinCode, setPinCode] = useState('');

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { activeItems: availableBranding, createItem } = useBranding();
  // const [availableBranding, setAvailableBranding] = useState<BrandingItem[]>([]);
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const [selectedBrandingId, setSelectedBrandingId] = useState<string>('');

  // Add Branding Modal State
  const [isAddBrandingModalOpen, setIsAddBrandingModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandWebsite, setNewBrandWebsite] = useState('');
  const [newBrandInstagram, setNewBrandInstagram] = useState('');
  const [newBrandFacebook, setNewBrandFacebook] = useState('');
  const [newBrandYoutube, setNewBrandYoutube] = useState('');
  // Branding Logo Upload Hook
  const logoUpload = useFileUpload({ accept: ['image/*'] });

  const [watermarkPosition, setWatermarkPosition] = useState<GridPosition>('top-right');
  const [detailsPosition, setDetailsPosition] = useState<GridPosition>('bottom-left');
  const [logoOpacity, setLogoOpacity] = useState(90);
  const [logoSize, setLogoSize] = useState(15);
  const [brandOpacity, setBrandOpacity] = useState(100);
  const [brandSize, setBrandSize] = useState(100);

  // File Upload State
  // Event Cover Upload Hook
  const coverUpload = useFileUpload({ accept: ['image/*'] });

  // Removed local storage loading effect
  /*
  useEffect(() => {
    loadBrandingItems();
  }, [loadBrandingItems]);
  */

  useEffect(() => {
    const loadEventData = async () => {
      if (isEditMode && eventId) {
        const data = await getEventById(eventId);
        if (data) {
          setTitle(data.title);
          // Parse date from API format (YYYY-MM-DD)
          if (data.event_date) {
            setDate(data.event_date);
          }
          setType(data.event_type || 'conference');
          setDescription(data.description || '');
          setCustomerName(data.customer_name || '');
          setCustomerEmail(data.customer_email || '');
          coverUpload.setPreview(data.cover_url || null);
          if (data.branding_enabled && data.branding_id) {
            setIsBrandingEnabled(true);
            setSelectedBrandingId(data.branding_id);
          } else {
            setIsBrandingEnabled(false);
            setSelectedBrandingId('');
          }
          if (data.pin_required) {
            setIsSecurityEnabled(true);
            setPinCode(data.pin_code || '');
          } else {
            setIsSecurityEnabled(false);
            setPinCode('');
          }
        }
      }
    };
    loadEventData();
  }, [isEditMode, eventId, getEventById]);



  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };







  const handleSaveBranding = async () => {
    if (!newBrandName.trim()) return;

    try {
      let finalLogoUrl = logoUpload.preview || undefined;

      if (logoUpload.file) {
        try {
          const uploadResult = await uploadAsset({
            filename: (logoUpload.file as File).name,
            content_type: (logoUpload.file as File).type || undefined,
            asset_type: 'logo',
            workspace_id: activeWorkspace?.id || null
          }, logoUpload.file as File);
          if (uploadResult?.asset_url) {
            finalLogoUrl = uploadResult.asset_url;
          }
        } catch (e) {
          console.error("Failed to upload branding logo", e);
          return;
        }
      }

      const newItem = await createItem({
        name: newBrandName,
        website: newBrandWebsite || undefined,
        instagram: newBrandInstagram || undefined,
        facebook: newBrandFacebook || undefined,
        youtube: newBrandYoutube || undefined,
        logo: finalLogoUrl,
        logoUrl: finalLogoUrl,
        watermarkPosition,
        detailsPosition,
        logoOpacity,
        logoSize,
        brandOpacity,
        brandSize
      });

      setSelectedBrandingId(newItem.id);
      clearError('branding');
      setIsAddBrandingModalOpen(false);
      resetBrandingForm();
    } catch (e) {
      console.error("Failed to save branding", e);
    }
  };

  const resetBrandingForm = () => {
    setNewBrandName('');
    setNewBrandWebsite('');
    setNewBrandInstagram('');
    setNewBrandFacebook('');
    setNewBrandYoutube('');
    setNewBrandYoutube('');
    logoUpload.removeFile();
    setWatermarkPosition('top-right');
    setDetailsPosition('bottom-left');
    setLogoOpacity(90);
    setLogoSize(15);
    setBrandOpacity(100);
    setBrandSize(100);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Event name is required";
    }

    if (!customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!customerEmail.trim()) {
      newErrors.customerEmail = "Customer email is required";
    } else if (!EMAIL_REGEX.test(customerEmail.trim())) {
      newErrors.customerEmail = "Please enter a valid email address";
    }

    if (isBrandingEnabled && !selectedBrandingId) {
      newErrors.branding = "Please select a Brand Identity";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Find first error and scroll to it if possible (optional enhancement)
      return;
    }

    let finalCoverUrl = coverUpload.preview || 'https://images.unsplash.com/photo-1519225448526-0a0295155809?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    if (coverUpload.file) {
      try {
        const uploadResult = await uploadAsset({
          filename: coverUpload.file.name,
          content_type: coverUpload.file.type || 'image/jpeg',
          asset_type: 'banner',
          workspace_id: activeWorkspace?.id
        }, coverUpload.file);
        finalCoverUrl = uploadResult.asset_url;
      } catch (error) {
        console.error('Error uploading cover:', error);
        setErrors({ submit: 'Failed to upload cover image. Please try again.' });
        return;
      }
    }

    try {
      if (isEditMode && eventId) {
        // Update existing event via API
        await updateEvent(eventId, {
          title,
          event_date: date,
          event_type: type,
          description,
          branding_enabled: isBrandingEnabled,
          branding_id: isBrandingEnabled ? selectedBrandingId : undefined,
          cover_url: finalCoverUrl,
          customer_name: customerName,
          branding_enabled: isBrandingEnabled,
          branding_id: isBrandingEnabled ? selectedBrandingId : undefined,
          cover_url: finalCoverUrl,
          customer_name: customerName,
          customer_email: customerEmail,
          pin_required: isSecurityEnabled,
          pin_code: isSecurityEnabled ? pinCode : undefined
        });
      } else {
        // Create new event via API
        await createEvent({
          title,
          event_date: date,
          event_type: type,
          description,
          branding_enabled: isBrandingEnabled,
          branding_id: isBrandingEnabled ? selectedBrandingId : undefined,
          cover_url: finalCoverUrl,
          customer_name: customerName,
          customer_email: customerEmail,
          pin_required: isSecurityEnabled,
          pin_code: isSecurityEnabled ? pinCode : undefined
        });

        // Send simulated email for new events
        if (customerEmail) {
          addSimulatedEmail({
            to: customerEmail,
            subject: `Event Created: ${title}`,
            body: `Dear ${customerName || 'Customer'},\n\nThank you for choosing us.\nWe're pleased to inform you that your event has been successfully created on our platform.`
          });
        }
      }
      navigate('/my-events');
    } catch (error) {
      console.error('Failed to save event:', error);
      setErrors({ submit: 'Failed to save event. Please try again.' });
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex-shrink-0 bg-white z-10">
          <div className="max-w-7xl mx-auto px-8 pt-8 pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="text-start">
              <h1 className="text-xl font-bold text-slate-900">{isEditMode ? t('edit_event_title') : t('add_new_event_title')}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {isEditMode ? t('edit_event_subtitle') : t('add_new_event_subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <button onClick={() => navigate('/my-events')} className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors">{t('cancel')}</button>
              <Button
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 sm:px-5 rounded-md whitespace-nowrap"
                onClick={handleSave}
                isLoading={isSaving}
              >
                {isEditMode ? (<>{t('save_changes')} <Save size={16} className={isRTL ? "mr-2" : "ml-2"} /></>) : (<>{t('add_event_btn')} <ArrowRight size={16} className={cn(isRTL ? "mr-2" : "ml-2", isRTL && "rotate-180")} /></>)}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 pb-12 space-y-10">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><User size={20} /></div>
                <div className="text-start">
                  <h2 className="text-lg font-bold text-slate-900">{t('client_details')}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{t('client_details_desc')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>{t('customer_name')}</FieldLabel>
                  <Input
                    placeholder="e.g. Sarah Jenkins"
                    value={customerName}
                    error={errors.customerName}
                    onChange={(e) => { setCustomerName(e.target.value); clearError('customerName'); }}
                    leftIcon={<User size={16} />}
                  />
                </div>
                <div>
                  <FieldLabel>{t('customer_email')}</FieldLabel>
                  <Input
                    type="email"
                    placeholder="e.g. sarah@example.com"
                    value={customerEmail}
                    error={errors.customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); clearError('customerEmail'); }}
                    leftIcon={<Mail size={16} />}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Calendar size={20} /></div>
                <h2 className="text-lg font-bold text-slate-900">{t('event_details')}</h2>
              </div>
              <div className="space-y-6">
                <div className="text-start">
                  <FieldLabel>{t('event_cover')}</FieldLabel>
                  <div className={cn("border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[180px] relative overflow-hidden group", coverUpload.isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50", coverUpload.preview ? "border-solid p-0 border-slate-200" : "bg-slate-50/30")} {...coverUpload.dragHandlers} onClick={() => !coverUpload.preview && coverUpload.openFilePicker()}>
                    <input type="file" className="hidden" ref={coverUpload.inputRef} accept="image/*" onChange={coverUpload.handleInputChange} />
                    {coverUpload.preview ? (
                      <><img src={coverUpload.preview} alt="Cover Preview" className="w-full h-full object-cover absolute inset-0" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"><button onClick={(e) => { e.stopPropagation(); coverUpload.removeFile(); }} className="px-4 py-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors flex items-center text-xs font-bold uppercase tracking-wider shadow-lg"><X size={14} className="mr-2" />{t('remove')}</button></div></>
                    ) : (
                      <div className="flex flex-col items-center justify-center"><div className="w-10 h-10 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center mb-3 text-slate-400"><Upload size={18} /></div><p className="text-sm font-medium text-slate-600">{t('click_upload')}</p></div>
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel>{t('event_name')}</FieldLabel>
                  <Input
                    placeholder="e.g. Annual Tech Summit 2025"
                    value={title}
                    error={errors.title}
                    onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel>{t('event_date')}</FieldLabel>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="cursor-pointer" onClick={(e) => { try { if ('showPicker' in e.currentTarget) { (e.currentTarget as any).showPicker(); } } catch (err) { } }} />
                  </div>
                  <div>
                    <FieldLabel>{t('event_type')}</FieldLabel>
                    <Select value={type} onChange={(e) => setType(e.target.value)} options={[{ label: 'Conference', value: 'conference' }, { label: 'Wedding', value: 'wedding' }, { label: 'Party', value: 'party' }, { label: 'Workshop', value: 'workshop' }]} />
                  </div>
                </div>
                <div>
                  <FieldLabel optional>{t('description_label')}</FieldLabel>
                  <TextArea placeholder="Add a brief description about the event..." className="min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <div className="h-px bg-slate-100 my-8" />
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 text-start">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><ImageIcon size={20} /></div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{t('branding')}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{t('branding_desc')}</p>
                    </div>
                  </div>
                  <Switch checked={isBrandingEnabled} onCheckedChange={(checked) => { setIsBrandingEnabled(checked); if (!checked) { setSelectedBrandingId(''); clearError('branding'); } }} />
                </div>
                {isBrandingEnabled && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 animate-in fade-in slide-in-from-top-2 text-start">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('select_brand_identity')}</h4>
                    {availableBranding.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-slate-500 mb-3">{t('no_branding_profiles')}</p>
                        <Button onClick={() => setIsAddBrandingModalOpen(true)} variant="outline" className="text-xs h-8">{t('add_new_branding')}</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {availableBranding.map(brand => (
                          <div key={brand.id} onClick={() => { setSelectedBrandingId(brand.id); clearError('branding'); }} className={cn("flex items-center p-3 rounded-lg border cursor-pointer transition-all relative group", selectedBrandingId === brand.id ? "bg-white border-purple-500 shadow-sm ring-1 ring-purple-500" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm")}>
                            <div className={cn("w-10 h-10 rounded-md bg-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden", isRTL ? "ml-3" : "mr-3")}>
                              {brand.logo ? <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" /> : <Layout size={18} className="text-slate-400" />}
                            </div>
                            <span className="text-sm font-bold text-slate-700 truncate flex-1">{brand.name}</span>
                            {selectedBrandingId === brand.id && <div className={cn("absolute top-2 bg-purple-500 rounded-full p-0.5", isRTL ? "left-2" : "right-2")}><Check size={10} className="text-white" strokeWidth={3} /></div>}
                          </div>
                        ))}
                        <button onClick={() => setIsAddBrandingModalOpen(true)} className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 transition-all group">
                          <Plus size={16} className={cn("text-slate-400 group-hover:text-slate-600", isRTL ? "ml-2" : "mr-2")} />
                          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 uppercase tracking-wider">{t('add_new_branding')}</span>
                        </button>
                      </div>
                    )}
                    {errors.branding && <p className="text-sm font-medium text-red-500 mt-3">{errors.branding}</p>}
                    <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1"><Shield size={10} />{t('branding_watermark_note')}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Shield size={20} /></div>
                <h2 className="text-lg font-bold text-slate-900">{t('configuration')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-slate-200 shadow-sm text-start">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 rounded-full text-blue-600"><Globe size={20} /></div>
                    <Switch checked={isPublicVisible} onCheckedChange={setIsPublicVisible} />
                  </div>
                  <div className="mt-4">
                    <h4 className="font-bold text-sm text-slate-900">{t('public_visibility')}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('public_visibility_desc')}</p>
                  </div>
                </Card>
                <Card className="p-6 border-slate-200 shadow-sm text-start">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-50 rounded-full text-green-600"><Smartphone size={20} /></div>
                    <div className="flex space-x-2"><span className="text-[10px] font-bold px-2 py-1 rounded border border-slate-200 text-slate-500 bg-white">WA</span><span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100">Email</span></div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-bold text-sm text-slate-900">{t('notifications')}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('notifications_desc')} Currently: WhatsApp OFF, Email ON.</p>
                  </div>
                </Card>
              </div>
            </div>

            <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3 text-start">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><Lock size={20} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">{t('security_pins')}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{t('security_pins_desc')}</p>
                  </div>
                </div>
                <Switch checked={isSecurityEnabled} onCheckedChange={setIsSecurityEnabled} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-start">
                  <FieldLabel>{t('guest_access')}</FieldLabel>
                  <div className="flex items-center space-x-3">
                    <Input
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="Enter PIN"
                      disabled={!isSecurityEnabled}
                      className="font-mono text-center tracking-widest font-bold"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="text-start">
                  <FieldLabel>{t('full_admin_access')}</FieldLabel>
                  <div className="flex items-center space-x-3">
                    <div className="h-11 px-6 bg-slate-50 border border-slate-200 rounded-md flex items-center font-mono text-sm font-bold text-slate-900 min-w-[100px] justify-center tracking-widest">3553</div>
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-md transition-all"><Copy size={18} /></button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Comprehensive Add New Branding Modal - Matches Branding Page */}
      <Modal
        isOpen={isAddBrandingModalOpen}
        onClose={() => setIsAddBrandingModalOpen(false)}
        title="Add New Brand Identity"
        className="max-w-7xl w-full h-[90vh]"
        contentClassName="p-0 overflow-hidden flex flex-col"
      >
        <div className="flex flex-col lg:flex-row h-full bg-slate-50 lg:overflow-hidden overflow-y-auto">
          {/* Left Column: Form Configuration */}
          <div className="flex-1 flex flex-col border-r border-slate-200 lg:h-full h-auto bg-slate-50">
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-8 h-auto">
              {/* Section: Watermark & Logo */}
              <div className="space-y-6">
                <div className="text-start">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <ImageIcon size={18} />
                    </div>
                    Logo & Watermark
                  </h3>
                  <p className="text-sm text-slate-500 ml-10">Upload your logo and set watermark position.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-3 block text-start">Upload Logo</label>
                      <div
                        className={cn(
                          "w-full aspect-square md:aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative bg-slate-50",
                          logoUpload.isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-100",
                          logoUpload.preview && "border-solid border-slate-200 bg-white"
                        )}
                        {...logoUpload.dragHandlers}
                        onClick={() => !logoUpload.preview && logoUpload.openFilePicker()}
                      >
                        <input type="file" ref={logoUpload.inputRef} className="hidden" accept="image/*" onChange={logoUpload.handleInputChange} />
                        {logoUpload.preview ? (
                          <div className="relative w-full h-full p-4 flex items-center justify-center">
                            <img src={logoUpload.preview} className="max-w-full max-h-full object-contain" alt="Logo preview" />
                            <button onClick={(e) => { e.stopPropagation(); logoUpload.removeFile(); }} className="absolute top-2 right-2 p-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg hover:text-red-500 transition-colors shadow-sm"><X size={16} /></button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-slate-500">
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Upload size={20} className="text-slate-400" /></div>
                            <div className="text-center"><p className="text-sm font-semibold text-slate-700">Click to upload</p><p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG (max 2MB)</p></div>
                          </div>
                        )}
                      </div>

                      {/* Logo Controls: Opacity & Size */}
                      <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Logo Opacity</label>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{logoOpacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="10" max="100"
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Logo Size</label>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{logoSize}%</span>
                            </div>
                            <input
                              type="range"
                              min="5" max="100"
                              value={logoSize}
                              onChange={(e) => setLogoSize(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-48">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-3 block text-start">Logo Position</label>
                      <PositionSelector current={watermarkPosition} onChange={setWatermarkPosition} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Brand Identity */}
              <div className="space-y-6">
                <div className="text-start">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Layout size={18} />
                    </div>
                    Brand Identity
                  </h3>
                  <p className="text-sm text-slate-500 ml-10">Configure your brand name and visual assets.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative">
                  <div className={cn("absolute top-6 w-32 z-10 hidden sm:block", isRTL ? "left-6" : "right-6")}>
                    <label className={cn("text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block", isRTL ? "text-left" : "text-right")}>Text Position</label>
                    <div className={cn("scale-75", isRTL ? "origin-top-left" : "origin-top-right")}><PositionSelector current={detailsPosition} onChange={setDetailsPosition} /></div>
                  </div>
                  <div className={isRTL ? "sm:pl-36" : "sm:pr-36"}>
                    <ModernInput label="Brand Name" value={newBrandName} onChange={(e: any) => setNewBrandName(e.target.value)} placeholder="e.g. Acme Photography" icon={<Layout size={16} />} />
                  </div>
                  <div>
                    <ModernInput label="Website" value={newBrandWebsite} onChange={(e: any) => setNewBrandWebsite(e.target.value)} placeholder="www.example.com" icon={<Globe size={16} />} />
                  </div>

                  {/* Identity Controls: Opacity & Size */}
                  <div className="pt-6 border-t border-slate-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Identity Opacity</label>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{brandOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10" max="100"
                          value={brandOpacity}
                          onChange={(e) => setBrandOpacity(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Identity Size</label>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{brandSize}%</span>
                        </div>
                        <input
                          type="range"
                          min="50" max="150"
                          value={brandSize}
                          onChange={(e) => setBrandSize(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Socials */}
              <div className="space-y-6">
                <div className="text-start">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      <Smartphone size={18} />
                    </div>
                    Social Connections
                  </h3>
                  <p className="text-sm text-slate-500 ml-10">Links for client convenience.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ModernInput label="Instagram" value={newBrandInstagram} onChange={(e: any) => setNewBrandInstagram(e.target.value)} placeholder="@username" icon={<Instagram size={16} />} />
                    <ModernInput label="Facebook" value={newBrandFacebook} onChange={(e: any) => setNewBrandFacebook(e.target.value)} placeholder="Page URL" icon={<Facebook size={16} />} />
                    <ModernInput label="YouTube" value={newBrandYoutube} onChange={(e: any) => setNewBrandYoutube(e.target.value)} placeholder="Channel URL" icon={<Youtube size={16} />} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 z-10 sticky bottom-0 lg:static">
              <button onClick={() => setIsAddBrandingModalOpen(false)} className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors">{t('cancel')}</button>
              <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 h-11 text-sm font-bold shadow-md rounded-xl" disabled={!newBrandName.trim()} onClick={handleSaveBranding}>Save Branding</Button>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="w-full lg:w-[480px] bg-white border-l border-slate-200 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-10 h-[500px] lg:h-auto flex-shrink-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live Preview</h3>
            </div>
            <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-6 overflow-y-auto">
              <div className="w-full bg-slate-200 rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative group aspect-[4/5] md:aspect-auto md:h-[500px]">
                <img src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" alt="Preview" />
                <div className={cn("absolute inset-0 pointer-events-none transition-all duration-500", getGradientClass(detailsPosition))} />

                {/* Watermark Logo */}
                <div className={cn("absolute p-4 transition-all duration-300 pointer-events-none", getAbsolutePosition(watermarkPosition))}>
                  {logoUpload.preview ? (
                    <img
                      src={logoUpload.preview}
                      alt="Watermark"
                      style={{ opacity: logoOpacity / 100, width: `${logoSize * 5}px` }}
                      className="object-contain grayscale-[30%] brightness-110 drop-shadow-md"
                    />
                  ) : (
                    <div className="px-4 py-2 border-2 border-white/40 text-white/50 font-bold text-lg tracking-widest uppercase backdrop-blur-[1px]">{newBrandName || "LOGO"}</div>
                  )}
                </div>

                {/* Info Text */}
                <div className={cn("absolute p-4 text-white space-y-3 transition-all duration-300 flex flex-col w-full max-w-[80%]", getAbsolutePosition(detailsPosition), getTextAlignment(detailsPosition))} style={{ opacity: brandOpacity / 100 }}>
                  <div>
                    <h4 className="font-bold drop-shadow-sm leading-tight" style={{ fontSize: `${(brandSize / 100) * 1.125}rem` }}>{newBrandName || 'Brand Name'}</h4>
                    {newBrandWebsite && <p className="mt-1 font-medium tracking-wide drop-shadow-sm" style={{ fontSize: `${(brandSize / 100) * 0.75}rem`, opacity: 0.8 }}>{newBrandWebsite}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {newBrandInstagram && <div className="p-1.5 bg-white/10 rounded-full border border-white/5"><Instagram size={12} /></div>}
                    {newBrandFacebook && <div className="p-1.5 bg-white/10 rounded-full border border-white/5"><Facebook size={12} /></div>}
                    {newBrandYoutube && <div className="p-1.5 bg-white/10 rounded-full border border-white/5"><Youtube size={12} /></div>}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-start">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed">Position your branding assets independently for the client gallery cover view.</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateEventPage;
