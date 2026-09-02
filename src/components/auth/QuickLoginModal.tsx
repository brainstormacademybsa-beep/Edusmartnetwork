import React, { useState } from 'react';
import { X, Shield, School, UserCheck, GraduationCap, Users, Check, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';

interface QuickLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const QuickLoginModal: React.FC<QuickLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  const [targetSuperUser, setTargetSuperUser] = useState<User | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const users = storageService.getUsers();
  const schools = storageService.getSchools();

  const handleSelect = (user: User) => {
    if (user.role === 'SUPER_ADMIN') {
      setTargetSuperUser(user);
      setPasscode('');
      setError('');
      return;
    }
    onSelectUser(user);
    onClose();
  };

  const handleVerifySuperPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setError('Please enter master passcode.');
      return;
    }
    if (storageService.verifySuperAdminPasscode(passcode)) {
      if (targetSuperUser) {
        onSelectUser(targetSuperUser);
        setTargetSuperUser(null);
        onClose();
      }
    } else {
      setError('Incorrect master passcode. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl text-slate-800 relative">
        <button
          onClick={() => {
            setTargetSuperUser(null);
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {targetSuperUser ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="p-2.5 bg-blue-900 text-amber-400 rounded-xl shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight">Super Admin Security Challenge</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Authentication required for platform governance access.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifySuperPasscode} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Enter Super Admin Passcode</span>
                  <span className="text-[10px] text-slate-400 font-mono">Default: admin2026</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter master passcode..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetSuperUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-wider rounded-xl shadow transition"
                >
                  Verify & Unlock
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-4">
              <div className="p-2.5 bg-blue-900 text-amber-400 rounded-xl shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-blue-900 uppercase tracking-tighter">Switch Portal Role</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Select a user account to switch roles and inspect the dashboard.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
                const userSchool = schools.find((s) => s.id === u.schoolId);

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-300"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{u.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : u.role === 'SCHOOL_ADMIN'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : u.role === 'TEACHER'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : u.role === 'STUDENT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            }`}
                          >
                            {u.role.replace('_', ' ')}
                          </span>
                          {u.role === 'SUPER_ADMIN' && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Passcode</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-blue-900 font-bold">{u.regNo}</span>
                          <span>•</span>
                          <span>{userSchool ? userSchool.name : 'Platform Hub'}</span>
                          {u.className && <span className="text-slate-600 font-semibold">({u.className})</span>}
                        </div>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="p-1 bg-amber-500 text-slate-950 rounded-full shadow-sm">
                        <Check className="w-4 h-4 font-bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 text-xs text-slate-500 text-center font-semibold">
              EduSmart Portal • Multi-Tenant Role & Access Engine
            </div>
          </>
        )}
      </div>
    </div>
  );
};
