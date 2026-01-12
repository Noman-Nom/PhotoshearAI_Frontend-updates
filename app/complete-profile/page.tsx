import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { completeOAuthProfile, needsProfileCompletion, status, user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    companyUrl: user?.companyUrl || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (!needsProfileCompletion) {
      navigate('/workspaces');
    }
  }, [needsProfileCompletion, navigate]);

  useEffect(() => {
    if (formData.companyName && !formData.companyUrl) {
      setFormData(prev => ({ ...prev, companyUrl: slugify(formData.companyName) }));
    }
  }, [formData.companyName, formData.companyUrl]);

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.companyName || !formData.companyUrl || !formData.phone) {
      setFormError('All fields are required.');
      return;
    }
    try {
      await completeOAuthProfile({
        companyName: formData.companyName,
        companyUrl: formData.companyUrl,
        phone: formData.phone
      });
      navigate('/workspaces');
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete profile.');
    }
  };

  return (
    <AuthLayout
      title="Complete your profile"
      subtitle="Add your company details to finish setting up your account."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm text-start font-bold border border-red-100">
            {formError}
          </div>
        )}

        <Input
          label="Company Name"
          placeholder="Studio Name"
          value={formData.companyName}
          onChange={handleChange('companyName')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />

        <Input
          label="Studio URL"
          placeholder="my-studio"
          value={formData.companyUrl}
          onChange={handleChange('companyUrl')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />

        <Input
          label="Phone"
          placeholder="5550123"
          value={formData.phone}
          onChange={handleChange('phone')}
          className="bg-white border-slate-200 focus:ring-slate-900"
        />

        <Button
          type="submit"
          className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-2.5 h-11"
          isLoading={status === 'LOADING'}
        >
          Finish Setup
        </Button>
      </form>
    </AuthLayout>
  );
};

export default CompleteProfilePage;
