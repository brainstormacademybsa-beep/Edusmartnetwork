import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Sparkles,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Lock,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  Award,
  GraduationCap,
  Users,
} from 'lucide-react';
import { School, User, PasswordResetResult } from '../../types';
import { storageService } from '../../services/storageService';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchool?: School | null;
  initialIdentifier?: string;
  onPasswordResetSuccess?: (result: PasswordResetResult) => void;
  onSwitchToLogin?: (
    school: School,
    userRole?: 'admin' | 'teacher' | 'student' | 'parents',
    identifier?: string,
    newPassword?: string
  ) => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  defaultSchool,
  initialIdentifier = '',
  onPasswordResetSuccess,
  onSwitchToLogin,
}) => {
  const schools = storageService.getSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    defaultSchool?.id || schools[0]?.id || ''
  );
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [channel, setChannel] = useState<'both' | 'email' | 'phone'>('both');
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [resetResult, setResetResult] = useState<PasswordResetResult | null>(null);

  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showDispatchLog, setShowDispatchLog] = useState(false);

  useEffect(() => {
    if (defaultSchool) {
      setSelectedSchoolId(defaultSchool.id);
    } else if (schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(schools[0].id);
    }
    if (initialIdentifier) {
      setIdentifier(initialIdentifier);
    }
  }, [defaultSchool, initialIdentifier, isOpen]);

  if (!isOpen) return null;

  const currentSchool =
    schools.find((s) => s.id === selectedSchoolId) || defaultSchool || schools[0];
  const allUsers = storageService.getUsers().filter((u) => u.schoolId === currentSchool?.id);

  // Quick autofill candidates for demo convenience
  const sampleAdmin = allUsers.find((u) => u.role === 'SCHOOL_ADMIN');
  const sampleTeacher = allUsers.find((u) => u.role === 'TEACHER');
  const sampleStudent = allUsers.find((u) => u.role === 'STUDENT');

  const maskEmail = (email?: string) => {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const maskedName =
      name.length > 2
        ? name.charAt(0) + '*'.repeat(Math.min(name.length - 2, 5)) + name.charAt(name.length - 1)
        : name + '***';
    return `${maskedName}@${parts[1]}`;
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\s+/g, '');
    if (digits.length < 8) return phone;
    return `${digits.slice(0, 4)} *** **${digits.slice(-2)}`;
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your registered email address, phone number, or Staff/Student ID.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('🔍 Looking up registered account in institution directory...');

    setTimeout(() => {
      setLoadingStep('🔐 Generating cryptographically secure new credentials...');
      setTimeout(() => {
        setLoadingStep('📡 Dispatching new password to registered Email & Telco gateway...');
        setTimeout(() => {
          const result = storageService.resetUserPassword(identifier, currentSchool?.id, {
            preferredChannel: channel,
            customNewPassword: useCustomPassword && customPassword.trim() ? customPassword.trim() : undefined,
          });

          setIsLoading(false);
          setLoadingStep('');

          if (result.success) {
            setResetResult(result);
            if (onPasswordResetSuccess) {
              onPasswordResetSuccess(result);
            }
          } else {
            setError(result.message || 'Unable to reset password. Please verify the credentials provided.');
          }
        }, 350);
      }, 350);
    }, 300);
  };

  const handleCopyPassword = () => {
    if (resetResult?.newPassword) {
      navigator.clipboard.writeText(resetResult.newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleProceedToLogin = () => {
    if (!resetResult || !currentSchool) return;
    const user = resetResult.user;
    let roleTab: 'admin' | 'teacher' | 'student' | 'parents' = 'admin';
    if (user?.role === 'TEACHER') roleTab = 'teacher';
    else if (user?.role === 'STUDENT') roleTab = 'student';
    else if (user?.role === 'PARENT') roleTab = 'parents';

    const loginId = user?.email || user?.regNo || identifier;
    const newPass = resetResult.newPassword || '';

    if (onSwitchToLogin) {
      onSwitchToLogin(currentSchool, roleTab, loginId, newPass);
    }
    onClose();
  };

  const handleResetAnother = () => {
    setResetResult(null);
    setError('');
    setIsLoading(false);
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative my-auto text-slate-900">
        {/* Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-blue-900 via-indigo-600 to-amber-500"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          id="btn-close-password-reset"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition z-20"
          title="Close Reset Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-900 text-amber-300 rounded-2xl shadow-lg ring-4 ring-blue-50">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  Password Reset & Recovery
                </h2>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-black uppercase rounded-full border border-amber-200">
                  Instant Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Generate a new password and dispatch it to your registered Email or Phone
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: REQUEST FORM */}
          {/* ========================================================================= */}
          {!resetResult ? (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {/* Institution Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-900" />
                    <span>Select Institution</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentSchool?.subdomain}.edusmartportal.com
                  </span>
                </label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => {
                    setSelectedSchoolId(e.target.value);
                    setError('');
                  }}
                  id="select-reset-school"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              {/* Identifier Input (Email / Phone / Staff ID / Admission Number) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Registered Email, Phone, or Staff/Student ID</span>
                  <span className="text-[10px] text-blue-900 font-bold lowercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-reset-identifier"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. admin@crownacademy.edu.ng or 08031234567 or CRA/2026/001"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  You can enter your registered staff email, student/parent phone number, or admission number.
                </p>
              </div>

              {/* Delivery Channel Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Send New Password To:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('both')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      channel === 'both'
                        ? 'bg-blue-900 text-amber-300 border-blue-900 shadow-sm font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-black uppercase">Email & Phone</span>
                    <span className="text-[8px] opacity-80">(Recommended)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      channel === 'email'
                        ? 'bg-blue-900 text-amber-300 border-blue-900 shadow-sm font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase">Email Only</span>
                    <span className="text-[8px] opacity-80">Official Inbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('phone')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      channel === 'phone'
                        ? 'bg-blue-900 text-amber-300 border-blue-900 shadow-sm font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase">Phone Only</span>
                    <span className="text-[8px] opacity-80">SMS / WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Optional Custom Password Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setUseCustomPassword(!useCustomPassword)}
                  className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3 text-amber-500" />
                  <span>{useCustomPassword ? 'Use auto-generated password instead' : 'Specify custom new password (Optional)'}</span>
                </button>

                {useCustomPassword && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase">
                      New Password Override:
                    </label>
                    <input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="e.g. MySecurePass2026#"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                    />
                  </div>
                )}
              </div>

              {/* Quick Autofill Sample Chips */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Demo Test Accounts ({currentSchool?.name}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleAdmin && (
                    <button
                      type="button"
                      onClick={() => setIdentifier(sampleAdmin.email || '')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 font-medium text-[10px] rounded-lg transition border border-blue-200 flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-blue-700" />
                      <span>Admin: {sampleAdmin.email}</span>
                    </button>
                  )}
                  {sampleTeacher && (
                    <button
                      type="button"
                      onClick={() => setIdentifier(sampleTeacher.email || '')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 font-medium text-[10px] rounded-lg transition border border-amber-200 flex items-center gap-1"
                    >
                      <Award className="w-3 h-3 text-amber-700" />
                      <span>Teacher: {sampleTeacher.email}</span>
                    </button>
                  )}
                  {sampleStudent && (
                    <button
                      type="button"
                      onClick={() => setIdentifier(sampleStudent.regNo || sampleStudent.parentPhone || '')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-medium text-[10px] rounded-lg transition border border-emerald-200 flex items-center gap-1"
                    >
                      <GraduationCap className="w-3 h-3 text-emerald-700" />
                      <span>Student: {sampleStudent.name} ({sampleStudent.regNo})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-password-reset"
                disabled={isLoading}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{loadingStep || 'Processing Reset Request...'}</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>Reset & Dispatch New Password</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ========================================================================= */
            /* STEP 2: SUCCESS & CREDENTIAL DISPATCH CONFIRMATION */
            /* ========================================================================= */
            <div className="space-y-5 animate-fadeIn">
              {/* Success Badge Banner */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                    Password Reset & Dispatched!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    A new temporary password has been created and sent to the registered contact address for{' '}
                    <strong className="font-black text-emerald-950">{resetResult.user?.name}</strong>.
                  </p>
                </div>
              </div>

              {/* Recipient Account Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        resetResult.user?.avatarUrl ||
                        (resetResult.user?.role === 'STUDENT'
                          ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'
                          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')
                      }
                      alt={resetResult.user?.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-300 shadow-xs"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-900 uppercase">
                        {resetResult.user?.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ID: {resetResult.user?.regNo || resetResult.user?.email}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-900 text-amber-300 font-black text-[9px] uppercase tracking-wider rounded-lg">
                    {resetResult.user?.role?.replace('_', ' ')}
                  </span>
                </div>

                {/* Delivery Targets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {resetResult.dispatchedToEmail && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">
                          Registered Email
                        </div>
                        <div className="font-mono text-slate-800 text-[11px] font-bold truncate">
                          {maskEmail(resetResult.dispatchedToEmail)}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[8px] text-emerald-700 font-bold">
                          ✓ Dispatched via SMTP
                        </span>
                      </div>
                    </div>
                  )}

                  {resetResult.dispatchedToPhone && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">
                          Registered Phone / SMS
                        </div>
                        <div className="font-mono text-slate-800 text-[11px] font-bold truncate">
                          {maskPhone(resetResult.dispatchedToPhone)}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[8px] text-emerald-700 font-bold">
                          ✓ Dispatched via Telco
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* New Password Display Box */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>New Generated Password</span>
                  </span>
                  <span>Keep Confidential</span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="font-mono text-base sm:text-lg font-black tracking-wider text-amber-300 select-all">
                    {showPassword ? resetResult.newPassword : '••••••••••••'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      id="btn-copy-new-password"
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Dispatch & Interactive Communication Actions */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Direct Delivery & Notification Actions:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {resetResult.whatsappUrl && (
                    <a
                      href={resetResult.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send WhatsApp</span>
                    </a>
                  )}

                  {resetResult.mailtoUrl && (
                    <a
                      href={resetResult.mailtoUrl}
                      className="p-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Open Email App</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Expandable Dispatch Preview & Message Log */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDispatchLog(!showDispatchLog)}
                  className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showDispatchLog ? 'Hide Message Payload Preview' : 'View Message Dispatch Payload Preview'}</span>
                </button>

                {showDispatchLog && (
                  <div className="mt-2 p-3 bg-slate-100 rounded-xl border border-slate-200 text-[11px] font-mono space-y-2 text-slate-800 animate-fadeIn">
                    <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>Email & SMS Payload:</span>
                      <span className="text-[9px] text-emerald-700 font-black">STATUS: 200 OK DISPATCHED</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 text-[10px] font-bold">Subject: {resetResult.emailSubject}</p>
                      <pre className="whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-slate-200 text-[10px] max-h-36 overflow-y-auto">
                        {resetResult.emailBody}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleProceedToLogin}
                  id="btn-login-with-new-password"
                  className="w-full sm:flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>Log In Now with New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetAnother}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Reset Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
