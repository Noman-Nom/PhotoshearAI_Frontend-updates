
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Sun, 
  ChevronDown, 
  Image as ImageIcon,
  Upload,
  X,
  ArrowLeft
} from 'lucide-react';
import { Sidebar } from '../../../components/shared/Sidebar';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { uploadAsset } from '../../../utils/api';

const BRANDING_STORAGE_KEY = 'photmo_branding_items_v1';

const AddBrandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    brandName: '',
    website: '',
    email: '',
    instagram: '',
    youtube: '',
    facebook: '',
    aboutUs: '',
    domain: '',
    contactNumber: ''
  });

  // Logo State
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!formData.brandName) {
        alert("Please enter a Brand Name");
        return;
    }

    setIsSaving(true);

    let logoValue = logoPreview;
    if (logoFile) {
        try {
            const uploadResp = await uploadAsset({
                filename: logoFile.name,
                content_type: logoFile.type || undefined,
                asset_type: 'logo',
                workspace_id: activeWorkspace?.id || null
            }, logoFile);
            if (uploadResp?.asset_url) {
                logoValue = uploadResp.asset_url;
                setLogoPreview(uploadResp.asset_url);
            }
        } catch (e) {
            console.error("Failed to upload logo", e);
            setIsSaving(false);
            alert("Failed to upload logo. Please try again.");
            return;
        }
    }

    const newItem = {
        id: Date.now().toString(),
        name: formData.brandName,
        website: formData.website || 'N/A',
        domain: formData.domain || 'N/A',
        email: formData.email || '',
        instagram: formData.instagram || '',
        facebook: formData.facebook || '',
        youtube: formData.youtube || '',
        contactNumber: formData.contactNumber || '',
        aboutUs: formData.aboutUs || '',
        status: 'Active',
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        iconType: 'main',
        logo: logoValue, // Saved at root
        watermarkPosition: 'top-right', // Default position
        detailsPosition: 'bottom-left' // Default position
    };

    try {
        const existingStr = localStorage.getItem(BRANDING_STORAGE_KEY);
        const existing = existingStr ? JSON.parse(existingStr) : [];
        const updated = [newItem, ...existing];
        localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save branding", e);
    }

    setIsSaving(false);
    navigate('/branding');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Custom Header for this page */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-4 sm:gap-8 w-auto md:w-1/2">
             <div className="flex items-center gap-3">
                 <button onClick={() => navigate('/branding')} className="p-2 hover:bg-slate-100 rounded-full md:hidden">
                     <ArrowLeft size={20} className="text-slate-600" />
                 </button>
                 <span className="font-bold text-lg sm:text-xl text-slate-900 truncate">{formData.brandName || "Logo here"}</span>
             </div>
             
             {/* Storage Widget - Hidden on Mobile */}
             <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-500">
                    <ImageIcon size={16} />
                </div>
                <div className="flex flex-col gap-1 w-32">
                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                        <span>0 images</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-800 w-[0%]"></div>
                    </div>
                    <div className="text-[9px] text-slate-400">of 1000 images used</div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
             <div className="hidden sm:flex items-center gap-4 text-slate-400">
                 <button className="hover:text-slate-600"><Sun size={20} /></button>
                 <button className="hover:text-slate-600"><Bell size={20} /></button>
             </div>
             
             <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

             <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80">
                 <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 overflow-hidden">
                     <img src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                 </div>
                 <div className="hidden md:block">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{user?.firstName} {user?.lastName}</span>
                        <ChevronDown size={14} className="text-slate-400" />
                     </div>
                 </div>
             </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 pb-20 md:pb-8">
           <div className="max-w-6xl mx-auto bg-white rounded-xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 min-h-[calc(100vh-8rem)] relative">
               
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                   <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Branding Details</h1>
                   <Button 
                     variant="secondary" 
                     className="bg-slate-400 hover:bg-slate-500 text-white font-medium px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                     onClick={handleSave}
                     isLoading={isSaving}
                     disabled={!formData.brandName.trim()}
                   >
                     Save
                   </Button>
               </div>

               <div className="mb-6 sm:mb-8">
                   <button className="px-6 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-300 transition-colors w-full sm:w-auto">
                       Profile Details
                   </button>
               </div>

               <div className="border-t border-slate-100 pt-6 sm:pt-8 mb-8">
                   {/* Logo Upload */}
                   <div 
                      className={cn(
                          "w-full max-w-md min-h-[8rem] h-auto border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all mb-10 group relative mx-auto sm:mx-0 p-4",
                          isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-100",
                          logoPreview ? "border-solid border-slate-200 bg-white" : "bg-slate-50"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => !logoPreview && fileInputRef.current?.click()}
                   >
                       <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleFileChange} 
                       />
                       
                       {logoPreview ? (
                           <div className="relative w-full h-full flex items-center justify-center">
                               <img src={logoPreview} alt="Logo" className="max-h-32 object-contain" />
                               <button 
                                   onClick={removeLogo}
                                   className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                               >
                                   <X size={14} />
                               </button>
                           </div>
                       ) : (
                           <div className="flex items-center gap-4 text-slate-500">
                               <div className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center bg-white flex-shrink-0">
                                   <div className="relative">
                                       <ImageIcon size={20} />
                                       <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-slate-900 rounded-full flex items-center justify-center text-[8px] text-white font-bold">+</div>
                                   </div>
                               </div>
                               <div>
                                   <p className="font-semibold text-slate-700">Upload a logo</p>
                                   <p className="text-xs text-slate-400">or just drag and drop</p>
                               </div>
                           </div>
                       )}
                   </div>

                   {/* Form Fields - 3 Column Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 sm:gap-y-6">
                       
                       <Input 
                           label="Name of Brand*"
                           name="brandName"
                           value={formData.brandName}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="Website"
                           name="website"
                           value={formData.website}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="Official Email"
                           name="email"
                           value={formData.email}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="Instagram Link"
                           name="instagram"
                           value={formData.instagram}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="Youtube Link"
                           name="youtube"
                           value={formData.youtube}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="Facebook Link"
                           name="facebook"
                           value={formData.facebook}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="About Us"
                           name="aboutUs"
                           value={formData.aboutUs}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="Domain"
                           name="domain"
                           value={formData.domain}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                       <Input 
                           label="Contact Number"
                           name="contactNumber"
                           value={formData.contactNumber}
                           onChange={handleInputChange}
                           className="bg-white"
                       />

                   </div>
               </div>

               {/* Footer Action */}
               <div className="flex justify-end mt-8 sm:mt-12 mb-4">
                   <Button 
                       className="bg-[#0F172A] hover:bg-[#1E293B] text-white w-full sm:w-auto px-10 py-2.5 h-11 text-base rounded-lg shadow-lg shadow-slate-900/10"
                       onClick={handleSave}
                       isLoading={isSaving}
                       disabled={!formData.brandName.trim()}
                   >
                       Save Branding
                   </Button>
               </div>

           </div>
        </main>
      </div>
    </div>
  );
};

export default AddBrandingPage;
