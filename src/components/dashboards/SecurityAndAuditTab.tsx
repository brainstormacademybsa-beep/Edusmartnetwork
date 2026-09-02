import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  History,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  Filter,
  Save,
  RefreshCw,
  Search,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { School, AuditLog, SchoolSecuritySettings, User as UserType } from '../../types';
import { storageService } from '../../services/storageService';

interface SecurityAndAuditTabProps {
  school: School;
}

export const SecurityAndAuditTab: React.FC<SecurityAndAuditTabProps> = ({ school }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SchoolSecuritySettings>(() =>
    storageService.getSecuritySettings(school.id)
  );

  const [adminUser, setAdminUser] = useState<UserType | null>(() => {
    return storageService.getUsers().find((u) => u.schoolId === school.id && u.role === 'SCHOOL_ADMIN') || null;
  });

  // Admin Account Settings State
  const [adminEmail, setAdminEmail] = useState(adminUser?.email || '');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminAccountMsg, setAdminAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Security PIN update form state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Policy form state
  const [requirePinForScoreEdit, setRequirePinForScoreEdit] = useState(securitySettings.requirePinForScoreEdit);
  const [requirePinForStudentDeletion, setRequirePinForStudentDeletion] = useState(securitySettings.requirePinForStudentDeletion);
  const [requirePinForPinGeneration, setRequirePinForPinGeneration] = useState(securitySettings.requirePinForPinGeneration);
  const [requirePinForResultChecking, setRequirePinForResultChecking] = useState(
    securitySettings.requirePinForResultChecking ?? school.requireResultPin ?? true
  );
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(securitySettings.maxFailedPinAttempts);
  const [autoSessionTimeout, setAutoSessionTimeout] = useState(securitySettings.autoSessionTimeoutMinutes);
  const [policySavedMsg, setPolicySavedMsg] = useState(false);

  const reloadLogs = () => {
    const freshSettings = storageService.getSecuritySettings(school.id);
    const freshSchool = storageService.getSchools().find((s) => s.id === school.id) || school;
    setLogs(storageService.getAuditLogs(school.id));
    setSecuritySettings(freshSettings);
    setRequirePinForResultChecking(freshSettings.requirePinForResultChecking ?? freshSchool.requireResultPin ?? true);
    const currentAdmin = storageService.getUsers().find((u) => u.schoolId === school.id && u.role === 'SCHOOL_ADMIN');
    if (currentAdmin) {
      setAdminUser(currentAdmin);
      setAdminEmail(currentAdmin.email || '');
    }
  };

  useEffect(() => {
    reloadLogs();
    const unsub = storageService.subscribe(reloadLogs);
    return unsub;
  }, [school.id]);

  const handleUpdateAdminAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setAdminAccountMsg({ type: 'error', text: 'Please enter a valid administrator email address.' });
      return;
    }

    if (adminNewPassword && adminNewPassword.length < 6) {
      setAdminAccountMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (adminNewPassword && adminNewPassword !== adminConfirmPassword) {
      setAdminAccountMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (adminUser) {
      const updatedUser: UserType = {
        ...adminUser,
        email: adminEmail.trim(),
        ...(adminNewPassword ? { password: adminNewPassword.trim() } : {}),
      };
      storageService.updateUser(updatedUser);
      setAdminUser(updatedUser);
      storageService.addAuditLog({
        schoolId: school.id,
        actorId: adminUser.id,
        actorName: adminUser.name,
        actorRole: 'SCHOOL_ADMIN',
        action: 'SETTINGS_UPDATE',
        details: `Administrator updated login credentials (Email: ${adminEmail.trim()}).`,
        severity: 'INFO',
      });
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setAdminAccountMsg({ type: 'success', text: 'Administrator credentials updated successfully!' });
      setTimeout(() => setAdminAccountMsg(null), 4000);
    }
  };

  const handleUpdateMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin) {
      setPinChangeMsg({ type: 'error', text: 'Please enter your current Master Admin PIN.' });
      return;
    }
    if (!storageService.verifyMasterPin(school.id, currentPin)) {
      setPinChangeMsg({ type: 'error', text: 'Current Master Admin PIN is incorrect.' });
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      setPinChangeMsg({ type: 'error', text: 'New Master PIN must be between 4 and 6 numeric digits.' });
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinChangeMsg({ type: 'error', text: 'New PIN and Confirmation PIN do not match.' });
      return;
    }

    const updated: SchoolSecuritySettings = {
      ...securitySettings,
      masterSecurityPin: newPin,
    };
    storageService.updateSecuritySettings(updated);
    setSecuritySettings(updated);
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setPinChangeMsg({ type: 'success', text: 'Master Security PIN updated successfully!' });
    setTimeout(() => setPinChangeMsg(null), 4000);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SchoolSecuritySettings = {
      ...securitySettings,
      requirePinForScoreEdit,
      requirePinForStudentDeletion,
      requirePinForPinGeneration,
      requirePinForResultChecking,
      maxFailedPinAttempts: Number(maxFailedAttempts),
      autoSessionTimeoutMinutes: Number(autoSessionTimeout),
    };
    storageService.updateSecuritySettings(updated);
    // Also sync to school object
    const freshSchool = storageService.getSchools().find((s) => s.id === school.id);
    if (freshSchool) {
      storageService.updateSchool({
        ...freshSchool,
        requireResultPin: requirePinForResultChecking,
      });
    }
    setSecuritySettings(updated);
    setPolicySavedMsg(true);
    setTimeout(() => setPolicySavedMsg(false), 3000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Security Posture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-emerald-950 tracking-wider">Tenant Cloud Isolation</h4>
            <p className="text-xs text-emerald-800 font-medium">Zero-trust rule active ({school.subdomain}.edusmartportal.com)</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Lock className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">Master Security PIN</h4>
            <p className="text-xs text-blue-800 font-medium">Protected ({securitySettings.masterSecurityPin ? 'Configured' : 'Default: 1234'})</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-3 bg-amber-100 rounded-lg">
            <History className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">Immutable Audit Trail</h4>
            <p className="text-xs text-amber-800 font-medium">{logs.length} Recorded Administrative Events</p>
          </div>
        </div>
      </div>

      {/* Three Column Security Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Admin Email & Password Account Credentials Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="w-5 h-5 text-blue-900" />
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Admin Login Access</h3>
              <p className="text-[11px] text-slate-500">
                Official Email Address and Password used to log into this administrator dashboard.
              </p>
            </div>
          </div>

          {adminAccountMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                adminAccountMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {adminAccountMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>{adminAccountMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateAdminAccount} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@school.edu.ng"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                New Admin Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {adminNewPassword && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Admin Credentials</span>
            </button>
          </form>
        </div>

        {/* 2. Master Security PIN Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-5 h-5 text-blue-900" />
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">School Master Security PIN</h3>
              <p className="text-[11px] text-slate-500">
                Authorizes destructive operations like deleting students, resetting score sheets, or updating bank info.
              </p>
            </div>
          </div>

          {pinChangeMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                pinChangeMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {pinChangeMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
              <span>{pinChangeMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateMasterPin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Current Master PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter current PIN"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Master PIN (4-6 Digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 5928"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Repeat new PIN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Update Master Security PIN</span>
            </button>
          </form>
        </div>

        {/* 2. Access Control Policies Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-indigo-900" />
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Operational Security Policies</h3>
              <p className="text-[11px] text-slate-500">Configure authorization checkpoints for school staff and teachers.</p>
            </div>
          </div>

          {policySavedMsg && (
            <div className="p-3 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Security policies saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSavePolicies} className="space-y-3">
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Require Master PIN to Edit Approved Scores</span>
                  <span className="text-[10px] text-slate-500">Prevents unverified changes to published term exam marks.</span>
                </div>
                <input
                  type="checkbox"
                  checked={requirePinForScoreEdit}
                  onChange={(e) => setRequirePinForScoreEdit(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Require Master PIN to Delete Student Records</span>
                  <span className="text-[10px] text-slate-500">Guards against accidental deletion of student transcripts.</span>
                </div>
                <input
                  type="checkbox"
                  checked={requirePinForStudentDeletion}
                  onChange={(e) => setRequirePinForStudentDeletion(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Require Master PIN to Generate PIN Batches</span>
                  <span className="text-[10px] text-slate-500">Controls scratch card generation for monetization.</span>
                </div>
                <input
                  type="checkbox"
                  checked={requirePinForPinGeneration}
                  onChange={(e) => setRequirePinForPinGeneration(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Require Scratch Card PIN for Children Result Checking</span>
                  <span className="text-[10px] text-slate-500">When active, students & parents must enter a 12-digit PIN code to check results. When disabled, results are accessed directly using Registration Number.</span>
                </div>
                <input
                  type="checkbox"
                  checked={requirePinForResultChecking}
                  onChange={(e) => setRequirePinForResultChecking(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Max PIN Failed Attempts
                </label>
                <select
                  value={maxFailedAttempts}
                  onChange={(e) => setMaxFailedAttempts(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-900"
                >
                  <option value={3}>3 Attempts (Strict)</option>
                  <option value={5}>5 Attempts (Standard)</option>
                  <option value={10}>10 Attempts (Relaxed)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Staff Auto Session Timeout
                </label>
                <select
                  value={autoSessionTimeout}
                  onChange={(e) => setAutoSessionTimeout(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-900"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Security Policies</span>
            </button>
          </form>
        </div>
      </div>

      {/* 3. Comprehensive Activity Audit Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <History className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">Institutional Audit Trail</h3>
              <p className="text-xs text-slate-500">Real-time log of administrative and staff modifications for accountability.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={reloadLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search actor or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-900"
            >
              <option value="ALL">All Actions</option>
              <option value="RESULT_UPLOAD">Score & Result Uploads</option>
              <option value="PIN_GENERATE">PIN Batch Generation</option>
              <option value="PIN_VERIFY">PIN Verifications</option>
              <option value="SECURITY_PIN_CHANGE">Security PIN Changes</option>
              <option value="SETTINGS_UPDATE">Settings Updates</option>
              <option value="STUDENT_REGISTER">Student Registrations</option>
            </select>
          </div>

          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-900"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-center">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No audit logs matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const severityBg =
                    log.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-800'
                      : log.severity === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.actorName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{log.actorRole}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${severityBg}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
