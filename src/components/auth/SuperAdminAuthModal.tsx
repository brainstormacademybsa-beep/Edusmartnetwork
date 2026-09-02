import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X, Mail, KeyRound } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';
import { PasswordResetModal } from './PasswordResetModal';

interface SuperAdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (superAdminUser: User) => void;
}

export const SuperAdminAuthModal: React.FC<SuperAdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('superadmin@edusmartportal.com');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your Super Administrator email address.');
      return;
    }

    if (!passcode.trim()) {
      setError('Please enter your Super Admin password or security passcode.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const superUser = storageService.getUsers().find((u) => u.role === 'SUPER_ADMIN');
      const isValidPasscode = storageService.verifySuperAdminPasscode(passcode);
      const isSuperUserPass = superUser && (superUser.password === passcode.trim() || superUser.email.toLowerCase() === email.trim().toLowerCase());

      if (isValidPasscode || (superUser && superUser.password === passcode.trim())) {
        if (superUser) {
          storageService.setCurrentUser(superUser);
          onSuccess(superUser);
          onClose();
          setPasscode('');
        } else {
          setError('Super Admin account record was not found in system directory.');
        }
      } else {
        setError('Incorrect Super Admin credentials. Access denied.');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative text-slate-900 overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-900 via-indigo-600 to-amber-500"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Block */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-950 text-amber-400 rounded-2xl shadow-lg ring-4 ring-blue-50">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">Super Admin Portal</h2>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[8px] font-black uppercase tracking-widest rounded-full">
                Restricted Access
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Enterprise Governance & Security Gateway</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Super Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="superadmin@edusmartportal.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Password / Security Passcode</span>
              <button
                type="button"
                onClick={() => setIsResetOpen(true)}
                className="text-[10px] text-blue-900 hover:underline font-bold capitalize"
              >
                Reset Password
              </button>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password or passcode..."
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Super Admin Console</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p>
            This portal is restricted to authorized platform administrators only. Credentials can be updated in dashboard settings.
          </p>
        </div>
      </div>

      <PasswordResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        initialIdentifier={email}
        onSwitchToLogin={(sch, roleTab, loginId, newPass) => {
          if (loginId) setEmail(loginId);
          if (newPass) setPasscode(newPass);
          setIsResetOpen(false);
        }}
      />
    </div>
  );
};
