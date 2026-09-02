import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Building2,
  KeyRound,
  UserPlus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  Globe,
  LogOut,
  Lock,
  Copy,
  Check,
  Search,
  ArrowRight,
  Share2,
  Users,
  Award,
} from 'lucide-react';
import { storageService } from './services/storageService';
import { School, User } from './types';

// Components
import { Header } from './components/common/Header';
import { SchoolRegisterModal } from './components/school/SchoolRegisterModal';
import { SuperAdminAuthModal } from './components/auth/SuperAdminAuthModal';
import { SchoolLoginModal, SchoolLoginRoleTab } from './components/auth/SchoolLoginModal';

// Dashboards
import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { SchoolAdminDashboard } from './components/dashboards/SchoolAdminDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { ParentDashboard } from './components/dashboards/ParentDashboard';

// Public Portals
import { OnlineAdmissionForm } from './components/admissions/OnlineAdmissionForm';
import { ResultPinChecker } from './components/results/ResultPinChecker';
import { ResultCardPrint } from './components/results/ResultCardPrint';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(storageService.getCurrentUser());
  const [activeSchool, setActiveSchool] = useState<School>(storageService.getActiveSchool());
  const [activeView, setActiveView] = useState<'dashboard' | 'admission_form' | 'pin_checker'>('dashboard');

  const [isSchoolRegisterOpen, setIsSchoolRegisterOpen] = useState(false);
  const [isSuperAdminAuthOpen, setIsSuperAdminAuthOpen] = useState(false);
  const [selectedSchoolForLogin, setSelectedSchoolForLogin] = useState<School | null>(null);
  const [isSchoolLoginOpen, setIsSchoolLoginOpen] = useState(false);
  const [loginDefaultRoleTab, setLoginDefaultRoleTab] = useState<SchoolLoginRoleTab>('admin');

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSchoolId, setCopiedSchoolId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct result preview state (e.g. from WhatsApp links)
  const [directResultData, setDirectResultData] = useState<{
    school: School;
    student: User | { regNo: string; name: string; className: string };
    results: any[];
    term: string;
    session: string;
  } | null>(null);

  // Schools list for landing page
  const schools = storageService.getSchools();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle URL query parameters (e.g. ?school=kings&role=student or ?view=result or ?action=admission)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const action = params.get('action');
    const regNo = params.get('regNo');
    const term = params.get('term') || 'First Term';
    const session = params.get('session') || '2025/2026';
    const schoolId = params.get('schoolId');
    const schoolQuery = params.get('school') || params.get('subdomain') || params.get('portal');
    const roleParam = params.get('role') as SchoolLoginRoleTab | null;

    // 1. Direct Result Card WhatsApp Preview
    if (view === 'result' && regNo) {
      let targetSchool = activeSchool;
      if (schoolId) {
        const found = storageService.getSchools().find((s) => s.id === schoolId);
        if (found) {
          targetSchool = found;
          setActiveSchool(found);
          storageService.setActiveSchoolId(found.id);
        }
      }

      const allResults = storageService.getResults(targetSchool.id);
      const matchedResults = allResults.filter(
        (r) =>
          r.studentRegNo.toLowerCase() === regNo.trim().toLowerCase() &&
          r.term === term &&
          r.session === session
      );

      const users = storageService.getUsers();
      const studentUser = users.find((u) => u.regNo.toLowerCase() === regNo.trim().toLowerCase()) || {
        id: 'temp',
        schoolId: targetSchool.id,
        regNo: regNo.trim(),
        name: matchedResults[0]?.studentName || 'Student',
        email: '',
        role: 'STUDENT' as const,
        className: matchedResults[0]?.className || 'N/A',
      };

      setDirectResultData({
        school: targetSchool,
        student: studentUser,
        results: matchedResults,
        term,
        session,
      });
      return;
    }

    // 2. Direct Subdomain / School Portal Link (e.g. ?school=kings or ?school=christ_the_king)
    if (schoolQuery || schoolId) {
      const allSchools = storageService.getSchools();
      const targetSchool = allSchools.find(
        (s) =>
          (schoolQuery && s.subdomain.toLowerCase() === schoolQuery.trim().toLowerCase()) ||
          (schoolQuery && s.id === schoolQuery.trim()) ||
          (schoolId && s.id === schoolId)
      );

      if (targetSchool) {
        storageService.setActiveSchoolId(targetSchool.id);
        setActiveSchool(targetSchool);

        if (action === 'admission' || view === 'admission') {
          setActiveView('admission_form');
        } else if (action === 'pin' || view === 'pin') {
          setActiveView('pin_checker');
        } else if (action === 'register') {
          setIsSchoolRegisterOpen(true);
        } else if (action === 'super') {
          setIsSuperAdminAuthOpen(true);
        } else {
          // If the user isn't logged in, automatically show the login modal for this school
          const activeUser = storageService.getCurrentUser();
          if (!activeUser || activeUser.schoolId !== targetSchool.id) {
            setSelectedSchoolForLogin(targetSchool);
            if (roleParam && ['admin', 'teacher', 'student', 'parents'].includes(roleParam)) {
              setLoginDefaultRoleTab(roleParam);
            }
            setIsSchoolLoginOpen(true);
          }
        }
      }
    }
  }, []);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser());
      setActiveSchool(storageService.getActiveSchool());
    });
    return () => unsubscribe();
  }, []);

  const handleSelectSubdomain = (subdomain: string, preferredRole?: SchoolLoginRoleTab) => {
    if (subdomain === 'super') {
      setIsSuperAdminAuthOpen(true);
      return;
    } else {
      const school = storageService.getSchools().find((s) => s.subdomain === subdomain || s.id === subdomain);
      if (school) {
        handleOpenSchoolLogin(school, preferredRole);
      }
    }
  };

  const handleOpenSchoolLogin = (school: School, preferredRole?: SchoolLoginRoleTab) => {
    storageService.setActiveSchoolId(school.id);
    setActiveSchool(school);
    
    // If the active user is already logged in for this specific school, proceed directly
    if (currentUser && currentUser.schoolId === school.id) {
      setActiveView('dashboard');
    } else {
      // Open login modal for this school
      setSelectedSchoolForLogin(school);
      setLoginDefaultRoleTab(preferredRole || 'admin');
      setIsSchoolLoginOpen(true);
    }
  };

  const handleCopyDirectLink = (school: School, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?school=${school.subdomain}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSchoolId(school.id);
      showToast(`Copied direct portal link for ${school.name}`);
      setTimeout(() => setCopiedSchoolId(null), 3000);
    }).catch(() => {
      showToast(`Direct URL: ${url}`);
    });
  };

  const handleSelectUser = (user: User) => {
    storageService.setActiveSchoolId(user.schoolId);
    const sch = storageService.getSchools().find((s) => s.id === user.schoolId);
    if (sch) {
      setActiveSchool(sch);
    }
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    setActiveView('dashboard');
    setIsSchoolLoginOpen(false);
    setIsSuperAdminAuthOpen(false);
  };

  const handleResetData = () => {
    if (window.confirm('Reset EduSmart database to default demo state with sample schools, CBTs, and results?')) {
      storageService.initDefaults(true);
      window.location.reload();
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setActiveView('dashboard'); // Will trigger landing view if user is null
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // RENDER: Direct Result Card Report View (e.g. from WhatsApp link)
  if (directResultData) {
    return (
      <div className="min-h-screen bg-slate-100 p-3 sm:p-6 font-sans text-slate-900">
        <div className="max-w-4xl mx-auto mb-4 bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block">Direct WhatsApp Result Report Card</span>
              <h2 className="text-base font-black uppercase text-white">{directResultData.student.name} ({directResultData.student.regNo})</h2>
              <p className="text-xs text-slate-300 font-mono">{directResultData.term} ({directResultData.session}) • {directResultData.school.name}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setDirectResultData(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition uppercase tracking-wider shadow-sm"
          >
            Go to Portal Home
          </button>
        </div>

        <ResultCardPrint
          school={directResultData.school}
          student={directResultData.student}
          results={directResultData.results}
          term={directResultData.term}
          session={directResultData.session}
          onBack={() => {
            setDirectResultData(null);
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      </div>
    );
  }

  // RENDER: Unauthenticated Landing Page & Public Portals
  if (!currentUser) {
    if (activeView === 'admission_form' || activeView === 'pin_checker') {
      return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
          {/* Public Form Top Navigation Bar */}
          <header className="bg-blue-950 text-white border-b border-blue-900 sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-blue-700"
                >
                  ← Back to Institutions Directory
                </button>
                <div className="hidden sm:flex items-center gap-2 border-l border-blue-800 pl-3">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase text-amber-300">
                    {activeSchool ? activeSchool.name : 'Select School'}
                  </span>
                </div>
              </div>

              {/* Quick Tab Switcher & School Selector */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-blue-900/60 p-1 rounded-lg border border-blue-800">
                  <button
                    onClick={() => setActiveView('admission_form')}
                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                      activeView === 'admission_form'
                        ? 'bg-amber-400 text-blue-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Online Admission Form
                  </button>
                  <button
                    onClick={() => setActiveView('pin_checker')}
                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                      activeView === 'pin_checker'
                        ? 'bg-amber-400 text-blue-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Result PIN Checker
                  </button>
                </div>

                {schools.length > 1 && (
                  <select
                    value={activeSchool?.id}
                    onChange={(e) => {
                      const sel = schools.find((s) => s.id === e.target.value);
                      if (sel) {
                        storageService.setActiveSchoolId(sel.id);
                        setActiveSchool(sel);
                      }
                    }}
                    className="bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grow w-full">
            {activeView === 'admission_form' && activeSchool && (
              <OnlineAdmissionForm school={activeSchool} />
            )}
            {activeView === 'pin_checker' && activeSchool && (
              <ResultPinChecker school={activeSchool} />
            )}
          </main>

          {/* Modals available everywhere */}
          <SchoolLoginModal
            school={selectedSchoolForLogin}
            isOpen={isSchoolLoginOpen}
            onClose={() => setIsSchoolLoginOpen(false)}
            onLoginSuccess={(user) => {
              handleSelectUser(user);
            }}
            defaultRoleTab={loginDefaultRoleTab}
            onOpenAdmissionForm={(sch) => {
              storageService.setActiveSchoolId(sch.id);
              setActiveSchool(sch);
              setActiveView('admission_form');
              setIsSchoolLoginOpen(false);
            }}
            onOpenPinChecker={(sch) => {
              storageService.setActiveSchoolId(sch.id);
              setActiveSchool(sch);
              setActiveView('pin_checker');
              setIsSchoolLoginOpen(false);
            }}
          />

          <SchoolRegisterModal
            isOpen={isSchoolRegisterOpen}
            onClose={() => setIsSchoolRegisterOpen(false)}
            onRegistered={(newSchool) => {
              storageService.setActiveSchoolId(newSchool.id);
              const newAdmin = storageService.getUsers().find((u) => u.schoolId === newSchool.id);
              if (newAdmin) storageService.setCurrentUser(newAdmin);
            }}
          />

          <SuperAdminAuthModal
            isOpen={isSuperAdminAuthOpen}
            onClose={() => setIsSuperAdminAuthOpen(false)}
            onSuccess={(superUser) => {
              storageService.setCurrentUser(superUser);
              setActiveView('dashboard');
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Landing Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900 rounded-xl shadow-lg ring-4 ring-blue-50">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-blue-950 uppercase tracking-tighter">
                  EduSmart <span className="text-blue-600">Portal</span>
                </h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">
                  Multi-School Academic Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveView('admission_form')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                <span>Online Admission</span>
              </button>

              <button
                onClick={() => setActiveView('pin_checker')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>Result PIN Checker</span>
              </button>

              <button
                onClick={() => setIsSchoolRegisterOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-800" />
                <span>Register School</span>
              </button>

              <button
                onClick={() => setIsSuperAdminAuthOpen(true)}
                className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition flex items-center gap-1.5 ring-2 ring-blue-900/20"
                title="Super Admin Governance Login"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Super Admin</span>
              </button>
            </div>
          </div>
        </header>

        <main className="grow">
          {/* Hero Section */}
          <section className="relative py-12 sm:py-16 overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/70 text-emerald-900 rounded-full border border-emerald-200 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Comprehensive Multi-School Academic Network</span>
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                One Unified System. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-600">
                  Dedicated School Portals.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                Select your institution from the directory below or use your school's direct portal link to access official results, online admissions, CBT exams, fee management, and school administration.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (schools.length > 0) {
                      handleOpenSchoolLogin(schools[0]);
                    }
                  }}
                  className="px-5 py-3 bg-blue-950 hover:bg-blue-900 text-amber-300 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl transition flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Enter School Portal</span>
                </button>

                <button
                  onClick={() => setActiveView('admission_form')}
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-blue-950 border border-slate-300 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-blue-800" />
                  <span>Online Admission Form</span>
                </button>

                <button
                  onClick={() => setActiveView('pin_checker')}
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Check Result PIN</span>
                </button>
              </div>
            </div>
          </section>

          {/* School Directory Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            {/* Search & Directory Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-900">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Registered Institutions Directory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click "Enter Portal" on any school to log in as an Admin, Teacher, Student, or Parent.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative grow md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by school name or subdomain..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
                  {filteredSchools.length} {filteredSchools.length === 1 ? 'School' : 'Schools'}
                </span>
              </div>
            </div>

            {/* School Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchools.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-slate-200 hover:border-blue-500/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Card Top: Logo, Subdomain, and Enter Portal */}
                    <div className="flex items-start justify-between gap-3">
                      <img
                        src={s.logo}
                        alt={s.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-md bg-white shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        id={`btn-enter-portal-${s.subdomain}`}
                        onClick={() => handleOpenSchoolLogin(s)}
                        className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-amber-300 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0"
                      >
                        <span>Enter Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* School Identity */}
                    <div>
                      <h4
                        onClick={() => handleOpenSchoolLogin(s)}
                        className="text-lg font-black text-slate-950 uppercase tracking-tight group-hover:text-blue-900 transition cursor-pointer leading-snug"
                      >
                        {s.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                        "{s.motto || 'Excellence in Education'}"
                      </p>
                    </div>

                    {/* Subdomain & Direct Shareable Link Box */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-blue-700" />
                          <span>Portal Address</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded-md">
                          {s.subdomain}.edusmartportal.com
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-500 truncate font-mono">
                          ?school={s.subdomain}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyDirectLink(s, e)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1 shrink-0 ${
                            copiedSchoolId === s.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-blue-50 text-blue-900 border border-slate-200'
                          }`}
                          title="Copy direct shareable URL"
                        >
                          {copiedSchoolId === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSchoolId === s.id ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Login Role Selectors */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        Quick Login By Role:
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenSchoolLogin(s, 'admin')}
                          className="px-1 py-1.5 bg-slate-100 hover:bg-blue-900 hover:text-amber-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition text-center"
                        >
                          Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSchoolLogin(s, 'teacher')}
                          className="px-1 py-1.5 bg-slate-100 hover:bg-blue-900 hover:text-amber-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition text-center"
                        >
                          Teacher
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSchoolLogin(s, 'student')}
                          className="px-1 py-1.5 bg-slate-100 hover:bg-blue-900 hover:text-amber-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition text-center"
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSchoolLogin(s, 'parents')}
                          className="px-1 py-1.5 bg-slate-100 hover:bg-blue-900 hover:text-amber-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition text-center"
                        >
                          Parent
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Quick Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        storageService.setActiveSchoolId(s.id);
                        setActiveSchool(s);
                        setActiveView('admission_form');
                      }}
                      className="grow px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 border border-amber-200/60"
                    >
                      <UserPlus className="w-3 h-3 text-amber-700" />
                      <span>Admissions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        storageService.setActiveSchoolId(s.id);
                        setActiveSchool(s);
                        setActiveView('pin_checker');
                      }}
                      className="grow px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 border border-emerald-200/60"
                    >
                      <KeyRound className="w-3 h-3 text-emerald-700" />
                      <span>Check PIN</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Register New School Card */}
              <div
                onClick={() => setIsSchoolRegisterOpen(true)}
                className="bg-blue-50/40 hover:bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-3xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[300px]"
              >
                <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-900">
                  <PlusCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-blue-950 uppercase tracking-tight">
                    Register Your School
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Create a dedicated portal with your colors, logo, admission forms, and result processing.
                  </p>
                </div>
                <span className="px-4 py-1.5 bg-blue-900 text-amber-300 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm">
                  Get Started →
                </span>
              </div>
            </div>
          </section>
        </main>

        {/* Landing Footer */}
        <footer className="bg-slate-950 py-12 text-white border-t-4 border-blue-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-900 rounded-xl">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-lg font-black uppercase tracking-tight">EduSmart School Network</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Unified multi-school platform providing automated result sheets, online admissions, computer-based testing, and secure PIN access.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Direct Portals</p>
              <ul className="space-y-1.5 text-slate-300">
                {schools.slice(0, 4).map((sch) => (
                  <li key={sch.id}>
                    <button
                      onClick={() => handleOpenSchoolLogin(sch)}
                      className="hover:text-amber-300 transition text-left"
                    >
                      {sch.name} Portal
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Governance</p>
              <button
                onClick={() => setIsSuperAdminAuthOpen(true)}
                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-amber-300 rounded-lg font-black uppercase tracking-wider text-[10px] transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Super Admin Portal</span>
              </button>
              <p className="text-[10px] text-slate-500 pt-1">
                © 2026 EduSmart Enterprise. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Global Modals Mounted at Root Level */}
        <SchoolLoginModal
          school={selectedSchoolForLogin}
          isOpen={isSchoolLoginOpen}
          onClose={() => setIsSchoolLoginOpen(false)}
          onLoginSuccess={(user) => {
            handleSelectUser(user);
          }}
          defaultRoleTab={loginDefaultRoleTab}
          onOpenAdmissionForm={(sch) => {
            storageService.setActiveSchoolId(sch.id);
            setActiveSchool(sch);
            setActiveView('admission_form');
            setIsSchoolLoginOpen(false);
          }}
          onOpenPinChecker={(sch) => {
            storageService.setActiveSchoolId(sch.id);
            setActiveSchool(sch);
            setActiveView('pin_checker');
            setIsSchoolLoginOpen(false);
          }}
        />

        <SchoolRegisterModal
          isOpen={isSchoolRegisterOpen}
          onClose={() => setIsSchoolRegisterOpen(false)}
          onRegistered={(newSchool) => {
            storageService.setActiveSchoolId(newSchool.id);
            const newAdmin = storageService.getUsers().find((u) => u.schoolId === newSchool.id);
            if (newAdmin) storageService.setCurrentUser(newAdmin);
          }}
        />

        <SuperAdminAuthModal
          isOpen={isSuperAdminAuthOpen}
          onClose={() => setIsSuperAdminAuthOpen(false)}
          onSuccess={(superUser) => {
            storageService.setCurrentUser(superUser);
            setActiveView('dashboard');
          }}
        />
      </div>
    );
  }

  // RENDER: Authenticated Dashboard View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeSchool={activeSchool}
        currentUser={currentUser}
        onOpenSchoolRegister={() => setIsSchoolRegisterOpen(true)}
        onSelectSubdomain={handleSelectSubdomain}
        onLogout={handleLogout}
      />

      {/* Main View Selector Bar (Print-hidden) */}
      <div className="bg-white border-b border-slate-200 sticky top-[68px] z-30 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left Portal View Tabs */}
          <div className="flex items-center gap-2">
            <button
              id="tab-view-dashboard"
              onClick={() => setActiveView('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg font-black uppercase tracking-widest text-[9px] transition flex items-center gap-1.5 shadow-sm ${
                activeView === 'dashboard'
                  ? 'bg-blue-900 text-amber-400 border border-blue-900'
                  : 'bg-white text-slate-500 hover:text-blue-900 border border-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Portal Dashboard ({currentUser.role.replace('_', ' ')})</span>
            </button>

            <button
              id="tab-view-admission"
              onClick={() => setActiveView('admission_form')}
              className={`px-3.5 py-1.5 rounded-lg font-black uppercase tracking-widest text-[9px] transition flex items-center gap-1.5 shadow-sm ${
                activeView === 'admission_form'
                  ? 'bg-blue-900 text-amber-400 border border-blue-900'
                  : 'bg-white text-slate-500 hover:text-blue-900 border border-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Online Registration</span>
            </button>

            <button
              id="tab-view-pin-checker"
              onClick={() => setActiveView('pin_checker')}
              className={`px-3.5 py-1.5 rounded-lg font-black uppercase tracking-widest text-[9px] transition flex items-center gap-1.5 shadow-sm ${
                activeView === 'pin_checker'
                  ? 'bg-blue-900 text-amber-400 border border-blue-900'
                  : 'bg-white text-slate-500 hover:text-blue-900 border border-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Result PIN Checker</span>
            </button>
          </div>

          {/* Quick Info & Sign Out */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="grow">
        {activeView === 'admission_form' && (
          <div className="p-4 sm:p-6">
            <OnlineAdmissionForm school={activeSchool} />
          </div>
        )}

        {activeView === 'pin_checker' && (
          <div className="p-4 sm:p-6">
            <ResultPinChecker school={activeSchool} />
          </div>
        )}

        {activeView === 'dashboard' && (
          <>
            {currentUser.role === 'SUPER_ADMIN' && (
              <SuperAdminDashboard
                currentUser={currentUser}
                onOpenSchoolRegister={() => setIsSchoolRegisterOpen(true)}
                onSelectSubdomain={handleSelectSubdomain}
              />
            )}

            {currentUser.role === 'SCHOOL_ADMIN' && (
              <SchoolAdminDashboard school={activeSchool} currentUser={currentUser} />
            )}

            {currentUser.role === 'TEACHER' && (
              <TeacherDashboard school={activeSchool} teacher={currentUser} />
            )}

            {currentUser.role === 'STUDENT' && (
              <StudentDashboard school={activeSchool} student={currentUser} />
            )}

            {currentUser.role === 'PARENT' && (
              <ParentDashboard school={activeSchool} parent={currentUser} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 border-t-2 border-amber-500 py-6 text-center text-xs text-blue-200 print:hidden mt-10">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-black text-white uppercase tracking-wider">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span>EduSmart Portal • Multi-School SaaS Architecture</span>
          </div>
          <p className="text-blue-200 text-[11px]">
            Features: Subdomain Registration • CBT Exam System • Automated Results & Position Calculation • PIN Verification • Fee Tracking & PDF Receipts • Online Admissions
          </p>
        </div>
      </footer>

      {/* Modals */}
      <SchoolRegisterModal
        isOpen={isSchoolRegisterOpen}
        onClose={() => setIsSchoolRegisterOpen(false)}
        onRegistered={(newSchool) => {
          storageService.setActiveSchoolId(newSchool.id);
          const newAdmin = storageService.getUsers().find((u) => u.schoolId === newSchool.id);
          if (newAdmin) storageService.setCurrentUser(newAdmin);
        }}
      />

      <SuperAdminAuthModal
        isOpen={isSuperAdminAuthOpen}
        onClose={() => setIsSuperAdminAuthOpen(false)}
        onSuccess={(superUser) => {
          storageService.setCurrentUser(superUser);
          setActiveView('dashboard');
        }}
      />

      <SchoolLoginModal
        school={selectedSchoolForLogin}
        isOpen={isSchoolLoginOpen}
        onClose={() => setIsSchoolLoginOpen(false)}
        onLoginSuccess={(user) => {
          handleSelectUser(user);
        }}
        defaultRoleTab={loginDefaultRoleTab}
        onOpenAdmissionForm={(sch) => {
          storageService.setActiveSchoolId(sch.id);
          setActiveSchool(sch);
          setActiveView('admission_form');
          setIsSchoolLoginOpen(false);
        }}
        onOpenPinChecker={(sch) => {
          storageService.setActiveSchoolId(sch.id);
          setActiveSchool(sch);
          setActiveView('pin_checker');
          setIsSchoolLoginOpen(false);
        }}
      />
    </div>
  );
}
