import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Send,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building2,
  RefreshCw,
  ExternalLink,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { School, PasswordResetResult } from '../../types';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchool?: School | null;
  initialIdentifier?: string;
  onPasswordResetSuccess?: (result: PasswordResetResult) => void;
  onSwitchToLogin?: (
    school: School,
    userRole?: 'admin' | 'teacher' | 'student' | 'parents',
    identifier?: string
  ) => void;
  onGoogleSignInSuccess?: (user: any) => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  defaultSchool,
  initialIdentifier = '',
  onPasswordResetSuccess,
  onSwitchToLogin,
  onGoogleSignInSuccess,
}) => {
  const schools = storageService.getSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    defaultSchool?.id || schools[0]?.id || ''
  );
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [resetResult, setResetResult] = useState<PasswordResetResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const currentSchool =
    schools.find((s) => s.id === selectedSchoolId) || defaultSchool || schools[0];
  const allUsers = storageService.getUsers().filter((u) => u.schoolId === currentSchool?.id);

  // Quick autofill candidates for convenience
  const sampleAdmin = allUsers.find((u) => u.role === 'SCHOOL_ADMIN');
  const sampleTeacher = allUsers.find((u) => u.role === 'TEACHER');
  const sampleStudent = allUsers.find((u) => u.role === 'STUDENT');

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your registered email address, phone number, or Staff/Student ID.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Looking up registered account in institution directory...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep('Dispatching password reset instructions to registered email...');

      const result = await authService.sendSecurePasswordReset(identifier, currentSchool?.id);

      setIsLoading(false);
      setLoadingStep('');

      if (result.success) {
        setResetResult(result);
        setResendCooldown(45); // 45 seconds anti-spam cooldown
        if (onPasswordResetSuccess) {
          onPasswordResetSuccess(result);
        }
      } else {
        setError(result.message || 'Unable to reset password. Please verify the credentials provided.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setLoadingStep('');
      setError(err?.message || 'An unexpected error occurred while dispatching the reset email.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !identifier.trim()) return;
    setIsLoading(true);
    setLoadingStep('Re-dispatching password reset instructions...');
    try {
      const result = await authService.sendSecurePasswordReset(identifier, currentSchool?.id);
      setIsLoading(false);
      setLoadingStep('');
      if (result.success) {
        setResetResult(result);
        setResendCooldown(60);
      }
    } catch (err: any) {
      setIsLoading(false);
      setLoadingStep('');
      setError(err?.message || 'Failed to re-send instructions.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle(currentSchool?.id);
      setIsGoogleLoading(false);
      if (result.success && result.user) {
        if (onGoogleSignInSuccess) {
          onGoogleSignInSuccess(result.user);
        }
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setError(err?.message || 'Google Sign-in encounter an issue.');
    }
  };

  const handleReturnToLogin = () => {
    if (!currentSchool) return;
    const user = resetResult?.user;
    let roleTab: 'admin' | 'teacher' | 'student' | 'parents' = 'admin';
    if (user?.role === 'TEACHER') roleTab = 'teacher';
    else if (user?.role === 'STUDENT') roleTab = 'student';
    else if (user?.role === 'PARENT') roleTab = 'parents';

    const loginId = user?.email || user?.regNo || identifier;

    if (onSwitchToLogin) {
      onSwitchToLogin(currentSchool, roleTab, loginId);
    }
    onClose();
  };

  const handleResetAnother = () => {
    setResetResult(null);
    setError('');
    setIsLoading(false);
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
                  Secure Password Reset
                </h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[9px] font-black uppercase rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  Email Only
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Reset instructions will be securely dispatched to your registered email address
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
                    placeholder="e.g. imosesstephen@gmail.com, admin@crownacademy.edu.ng, or CRA/2026/001"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-900 shrink-0 mt-0.5" />
                  <span>
                    For security reasons, password reset links are sent exclusively to your registered email address. Passwords are never revealed on screen.
                  </span>
                </div>
              </div>

              {/* Google One-Click Alternative Option */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <div>
                      <div className="text-xs font-bold text-blue-950">Have a Google Account?</div>
                      <div className="text-[10px] text-blue-700">Sign in instantly without needing to reset your password</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    id="btn-google-sign-in-from-reset"
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] rounded-xl border border-slate-200 shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    {isGoogleLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" />
                    ) : (
                      <span>Sign in with Google</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Autofill Sample Chips */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Demo Accounts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIdentifier('imosesstephen@gmail.com')}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 font-medium text-[10px] rounded-lg transition border border-amber-200 flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-amber-700" />
                    <span>imosesstephen@gmail.com</span>
                  </button>
                  {sampleAdmin && (
                    <button
                      type="button"
                      onClick={() => setIdentifier(sampleAdmin.email || '')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 font-medium text-[10px] rounded-lg transition border border-blue-200 flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-blue-700" />
                      <span>Admin ({sampleAdmin.email})</span>
                    </button>
                  )}
                  {sampleTeacher && (
                    <button
                      type="button"
                      onClick={() => setIdentifier(sampleTeacher.email || '')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-950 font-medium text-[10px] rounded-lg transition border border-purple-200 flex items-center gap-1"
                    >
                      <span>Teacher ({sampleTeacher.email})</span>
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
                    <span>{loadingStep || 'Dispatching Reset Email...'}</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>Send Password Reset Email</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ========================================================================= */
            /* STEP 2: SECURE CONFIRMATION SCREEN (NO PLAINTEXT PASSWORD ON SCREEN) */
            /* ========================================================================= */
            <div className="space-y-5 animate-fadeIn">
              {/* Success Badge Banner */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                    Check Your Registered Inbox
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    A password reset notification and portal access instructions have been sent to your registered email address.
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
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
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
                <div className="space-y-2">
                  {resetResult.maskedEmail && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">
                            Registered Email (Masked)
                          </div>
                          <div className="font-mono text-slate-900 text-xs font-bold">
                            {resetResult.maskedEmail}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        ✓ Dispatched
                      </span>
                    </div>
                  )}

                  {resetResult.maskedPhone && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">
                            Registered Phone
                          </div>
                          <div className="font-mono text-slate-900 text-[11px] font-bold">
                            {resetResult.maskedPhone}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md">
                        ✓ SMS Notified
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Protection Notice */}
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl text-xs space-y-1.5 border border-slate-800">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Strict Security Protection Active</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  For your institutional security, passwords are never shown on screen. Please open your registered email inbox to retrieve your credentials or click below to sign in with Google.
                </p>
              </div>

              {/* Quick Actions: Open Mailbox or Google Sign In */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-blue-900 hover:bg-blue-800 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Open Gmail Inbox</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  id="btn-return-to-portal-login"
                  className="w-full sm:flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Portal Login</span>
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
