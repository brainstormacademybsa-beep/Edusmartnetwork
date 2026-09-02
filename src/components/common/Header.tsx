import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  Globe,
  PlusCircle,
  LogOut,
  ChevronDown,
  ShieldCheck,
  School as SchoolIcon,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { School, User } from '../../types';

interface HeaderProps {
  activeSchool: School;
  currentUser: User;
  onOpenSchoolRegister: () => void;
  onSelectSubdomain: (subdomain: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSchool,
  currentUser,
  onOpenSchoolRegister,
  onSelectSubdomain,
  onLogout,
}) => {
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const schools = storageService.getSchools();

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'SCHOOL_ADMIN':
        return { label: 'School Admin', bg: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'TEACHER':
        return { label: 'Teacher', bg: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'STUDENT':
        return { label: 'Student', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'PARENT':
        return { label: 'Parent Portal', bg: 'bg-violet-50 text-violet-700 border-violet-100' };
      default:
        return { label: 'User', bg: 'bg-slate-50 text-slate-700 border-slate-100' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden shadow-sm">
      {/* Top Domain & Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
            <Globe className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution Portal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono text-amber-300 font-black">
              {currentUser.role === 'SUPER_ADMIN'
                ? 'super.edusmartportal.com'
                : `${activeSchool.subdomain}.edusmartportal.com`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Subdomain Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white text-[10px] font-black uppercase tracking-widest transition shadow-sm active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Institutions Directory</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSchoolDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSchoolDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden ring-4 ring-slate-900/5">
                <div className="px-4 py-2 border-b border-slate-50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Portals</span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  <button
                    onClick={() => {
                      onSelectSubdomain('super');
                      setShowSchoolDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center gap-3 border-l-4 ${
                      currentUser.role === 'SUPER_ADMIN' ? 'bg-blue-50/50 border-blue-900' : 'border-transparent'
                    }`}
                  >
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Super Admin Hub</div>
                      <div className="text-[9px] text-slate-400 font-mono">super.edusmartportal.com</div>
                    </div>
                  </button>

                  {schools.map((sch) => (
                    <button
                      key={sch.id}
                      onClick={() => {
                        onSelectSubdomain(sch.subdomain);
                        setShowSchoolDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center gap-3 border-l-4 ${
                        activeSchool.id === sch.id && currentUser.role !== 'SUPER_ADMIN'
                          ? 'bg-blue-50/50 border-blue-900'
                          : 'border-transparent'
                      }`}
                    >
                      <img src={sch.logo} className="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm" />
                      <div>
                        <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight line-clamp-1">{sch.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{sch.subdomain}.edusmartportal.com</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      setShowSchoolDropdown(false);
                      onOpenSchoolRegister();
                    }}
                    className="w-full text-left px-4 py-3 text-blue-900 hover:bg-blue-50 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Register New School</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Branding & Identity Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-900 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            {currentUser.role === 'SUPER_ADMIN' ? (
              <div className="relative w-12 h-12 bg-blue-900 text-amber-400 rounded-2xl flex items-center justify-center shadow-xl">
                <GraduationCap className="w-7 h-7" />
              </div>
            ) : (
              <img
                src={activeSchool.logo}
                alt={activeSchool.name}
                className="relative w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xl bg-white"
              />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter leading-none">
                {currentUser.role === 'SUPER_ADMIN' ? 'EduSmart Central' : activeSchool.name}
              </h2>
              <span className="px-2 py-0.5 bg-blue-900 text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-blue-900/10">
                Official Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="opacity-60">{currentUser.role === 'SUPER_ADMIN' ? 'Network Governance Console' : activeSchool.motto}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-blue-900">v2.4.1</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User Account Section */}
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-black text-slate-950 uppercase tracking-tight">{currentUser.name}</div>
            <div className="flex items-center justify-end gap-2 mt-0.5">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
              {currentUser.regNo && (
                <span className="text-[9px] text-slate-400 font-mono font-bold tracking-tighter">{currentUser.regNo}</span>
              )}
            </div>
          </div>
          <div className="relative">
            <img
              src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0f172a&color=fff`}
              alt={currentUser.name}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-2xl ring-4 ring-slate-50 transition hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out & Lock Portal"
              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 rounded-xl transition border border-rose-200/60 shadow-xs flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase hidden md:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
