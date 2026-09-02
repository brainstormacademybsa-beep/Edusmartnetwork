import React, { useState } from 'react';
import { X, Building2, Upload, Sparkles, CheckCircle2, Globe, Palette } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { School } from '../../types';

interface SchoolRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (newSchool: School) => void;
}

export const SchoolRegisterModal: React.FC<SchoolRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [logo, setLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1E3A8A');
  const [secondaryColor, setSecondaryColor] = useState('#D97706');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [motto, setMotto] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!subdomain) {
      setSubdomain(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 18)
      );
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setLogo(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subdomain || !email) return;

    const newSch = storageService.addSchool(
      {
        name,
        subdomain: subdomain.toLowerCase().replace(/[^a-z0-9]/g, ''),
        logo: logo || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150',
        primaryColor,
        secondaryColor,
        address: address || '10 Education Way, Campus City',
        phone: phone || '+234 800 123 4567',
        email,
        motto: motto || 'Excellence and Virtue',
      },
      {
        name: adminName || `${name} Administrator`,
        password: adminPassword || 'password123',
      }
    );

    setSuccessMsg(`School "${newSch.name}" registered successfully! Subdomain created: ${newSch.subdomain}.edusmartportal.com`);
    setTimeout(() => {
      onRegistered(newSch);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded max-w-2xl w-full p-6 shadow-xl text-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-4">
          <div className="p-3 bg-blue-900 text-amber-300 rounded shadow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Register Your School on EduSmart</h2>
            <p className="text-xs text-slate-500">
              Create a custom branded portal with dedicated subdomain, colors, logo, and staff management.
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-emerald-800">{successMsg}</h3>
            <p className="text-xs text-slate-600">Redirecting to your new school portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  School Name <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex High School"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subdomain Identifier <span className="text-amber-600">*</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded overflow-hidden focus-within:border-blue-900">
                  <input
                    type="text"
                    required
                    placeholder="apexhigh"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full bg-transparent px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-mono text-xs"
                  />
                  <span className="bg-blue-900 text-amber-300 text-[11px] px-2.5 py-2 font-mono font-bold border-l border-slate-300">
                    .edusmartportal.com
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Email <span className="text-amber-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@apexhigh.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+234 803 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. John Doe"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Administrator Login Password <span className="text-amber-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Create admin password..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Primary Color</label>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-300">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-800 font-bold">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Secondary (Gold) Color</label>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-300">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-800 font-bold">{secondaryColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">School Logo</label>
              <div className="flex items-center gap-4">
                {logo && (
                  <img src={logo} alt="School Logo Preview" className="w-12 h-12 rounded object-cover border border-amber-500 shadow-sm" />
                )}
                <label className="cursor-pointer bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2 shadow-sm">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Upload Logo Image</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <span className="text-[11px] text-slate-500">or enter image URL below</span>
              </div>
              <input
                type="text"
                placeholder="https://..."
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 mt-2 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">School Address</label>
              <input
                type="text"
                placeholder="Full physical campus address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">School Motto</label>
              <input
                type="text"
                placeholder="e.g. Excellence, Virtue & Leadership"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-school-reg"
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-wider rounded text-xs shadow-sm transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Register School & Launch Portal</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
