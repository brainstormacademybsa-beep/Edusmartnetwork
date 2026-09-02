import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Globe,
  Users,
  Award,
  Search,
  ShieldCheck,
  Power,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Save,
  Check,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { School, User } from '../../types';

interface SuperAdminDashboardProps {
  currentUser: User;
  onOpenSchoolRegister: () => void;
  onSelectSubdomain: (subdomain: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  onOpenSchoolRegister,
  onSelectSubdomain,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeSuccess, setPasscodeSuccess] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const schools = storageService.getSchools();
  const allUsers = storageService.getUsers();

  const handleApprove = (schoolId: string, approve: boolean) => {
    storageService.approveSchool(schoolId, approve);
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    setPasscodeSuccess('');

    if (!newPasscode.trim() || newPasscode.trim().length < 4) {
      setPasscodeError('Master passcode must be at least 4 characters long.');
      return;
    }

    const success = storageService.setSuperAdminPasscode(newPasscode.trim());
    if (success) {
      setPasscodeSuccess('Super Admin master passcode updated successfully!');
      setNewPasscode('');
      setTimeout(() => setPasscodeSuccess(''), 3000);
    } else {
      setPasscodeError('Failed to update master passcode.');
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      {/* Super Admin Welcome Banner */}
      <div className="bg-blue-900 border-b-4 border-amber-500 rounded p-6 shadow-sm text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">Super Admin Control Center</h1>
            </div>
            <p className="text-xs text-blue-200 max-w-2xl">
              Global multi-tenant governance platform. Approve new school registrations, manage custom subdomains, oversee tenant accounts, and monitor network state.
            </p>
          </div>

          <button
            onClick={onOpenSchoolRegister}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded shadow transition flex items-center gap-2 border border-amber-300"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Register New School</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Registered Schools</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-blue-950 tracking-tighter">{schools.length}</span>
              <span className="text-[10px] text-emerald-600 font-bold mb-1.5">+2 this week</span>
            </div>
            <div className="w-10 h-1 bg-blue-900 mt-3 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Pending Approvals</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-amber-600 tracking-tighter">
                {schools.filter((s) => s.status === 'PENDING').length}
              </span>
              <span className="text-[10px] text-amber-500 font-bold mb-1.5">Action Required</span>
            </div>
            <div className="w-10 h-1 bg-amber-500 mt-3 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Global Userbase</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{allUsers.length}</span>
              <span className="text-[10px] text-slate-500 font-bold mb-1.5">Total Accounts</span>
            </div>
            <div className="w-10 h-1 bg-slate-900 mt-3 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Network Status</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-emerald-600 tracking-tighter">LIVE</span>
              <span className="text-[10px] text-emerald-500 font-bold mb-1.5">100% Up</span>
            </div>
            <div className="w-10 h-1 bg-emerald-600 mt-3 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Schools Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-900" />
              <span>Multi-Tenant Enterprise Directory</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Manage, audit, and authenticate global school subdomains across the EduSmart ecosystem.</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Filter by school or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 shadow-sm transition-all focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredSchools.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[9px] border-b border-slate-100">
                  <th className="px-8 py-4">Institution Identity</th>
                  <th className="px-6 py-4">Global Subdomain</th>
                  <th className="px-6 py-4">Access Point</th>
                  <th className="px-6 py-4">Verification Status</th>
                  <th className="px-8 py-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSchools.map((sch) => (
                  <tr key={sch.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={sch.logo}
                            alt={sch.name}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md bg-white transition group-hover:scale-110"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${sch.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-950 uppercase tracking-tight">{sch.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium italic mt-0.5 opacity-80">"{sch.motto}"</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 font-mono">
                      <div className="flex items-center gap-2 text-blue-900 text-xs font-black">
                        <Globe className="w-3.5 h-3.5 text-amber-500" />
                        <span className="underline decoration-blue-200 underline-offset-4">{sch.subdomain}.edusmart.com</span>
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <div className="text-xs font-bold text-slate-700">{sch.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">{sch.phone}</div>
                    </td>

                    <td className="px-6 py-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                          sch.status === 'ACTIVE'
                            ? 'bg-emerald-500 text-white'
                            : sch.status === 'PENDING'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {sch.status}
                      </span>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => onSelectSubdomain(sch.subdomain)}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg transition active:scale-95 flex items-center gap-2"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Enter Portal</span>
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        {sch.status !== 'ACTIVE' ? (
                          <button
                            onClick={() => handleApprove(sch.id, true)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                            title="Approve Institution"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(sch.id, false)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                            title="Suspend Institution"
                          >
                            <Power className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="inline-block p-6 bg-slate-100 rounded-full text-slate-400">
                <Search className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">No Institutions Found</h3>
                <p className="text-xs text-slate-500 font-medium">Try adjusting your search criteria or register a new school.</p>
              </div>
              <button
                onClick={onOpenSchoolRegister}
                className="px-6 py-3 bg-blue-900 text-amber-400 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
              >
                Register First School
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Super Admin Master Passcode & Security Settings */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-900 text-amber-400 rounded-xl shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Super Admin Master Security Key</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              This master passcode guards portal access and prevents unauthorized public users from accessing platform-level governance tools. You can change and update your passcode at any time.
            </p>
          </div>

          <form onSubmit={handleChangePasscode} className="w-full sm:w-auto flex-1 max-w-md space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Set New Master Passcode</span>
                <span className="text-[10px] text-slate-400 font-mono">Min. 4 characters</span>
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new master passcode..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passcodeError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                {passcodeError}
              </p>
            )}

            {passcodeSuccess && (
              <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{passcodeSuccess}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Master Security Passcode</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
