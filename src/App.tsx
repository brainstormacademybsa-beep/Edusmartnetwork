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
} from 'lucide-react';
import { storageService } from './services/storageService';
import { School, User } from './types';

// Components
import { Header } from './components/common/Header';
import { SchoolRegisterModal } from './components/school/SchoolRegisterModal';
import { SuperAdminAuthModal } from './components/auth/SuperAdminAuthModal';
import { SchoolLoginModal } from './components/auth/SchoolLoginModal';

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

  // Handle direct result link (e.g. ?view=result&regNo=...&term=...&session=...&schoolId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const regNo = params.get('regNo');
    const term = params.get('term') || 'First Term';
    const session = params.get('session') || '2025/2026';
    const schoolId = params.get('schoolId');

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

  const handleSelectSubdomain = (subdomain: string) => {
    if (subdomain === 'super') {
      setIsSuperAdminAuthOpen(true);
      return;
    } else {
      const school = storageService.getSchools().find((s) => s.subdomain === subdomain);
      if (school) {
        handleOpenSchoolLogin(school);
      }
    }
  };

  const handleOpenSchoolLogin = (school: School) => {
    storageService.setActiveSchoolId(school.id);
    setActiveSchool(school);
    
    // If the active user is already logged in for this specific school, proceed directly
    if (currentUser && currentUser.schoolId === school.id) {
      setActiveView('dashboard');
    } else {
      // Require PIN / authorization check to enter this school portal
      setSelectedSchoolForLogin(school);
      setIsSchoolLoginOpen(true);
    }
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
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
        {/* Simple Landing Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900 rounded-xl shadow-lg ring-4 ring-blue-50">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-blue-950 uppercase tracking-tighter">EduSmart <span className="text-blue-600">Network</span></h1>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Enterprise School Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('admission_form')}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-widest rounded-lg transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                <span>Online Admission Form</span>
              </button>
              <button
                onClick={() => setActiveView('pin_checker')}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase tracking-widest rounded-lg transition shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>Check Result PIN</span>
              </button>
              <button
                onClick={() => setIsSchoolRegisterOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-widest rounded-lg transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register Your School</span>
              </button>
              <button
                onClick={() => setIsSuperAdminAuthOpen(true)}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl transition active:scale-95 flex items-center gap-2 ring-4 ring-blue-50"
                title="Restricted platform governance login (Passcode required)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin Portal</span>
              </button>
            </div>
          </div>
        </header>

        <main className="grow">
          {/* Hero Section */}
          <section className="relative py-16 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-gradient-to-b from-blue-50/50 to-transparent rounded-full blur-3xl -z-10"></div>
            <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                <span>Comprehensive Bio-Data & Admission Portal Active</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-slate-950 uppercase tracking-tighter leading-none">
                One Platform. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-indigo-600">Every Modern School.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Empower your institution with EduSmart. Online student admissions with complete biodata, automated results, CBT exams, 
                secure PIN verification, and comprehensive school management — all in one place.
              </p>
              {/* Hero Action CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveView('admission_form')}
                  className="px-6 py-3.5 bg-blue-900 hover:bg-blue-800 text-amber-300 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl transition flex items-center gap-2 ring-4 ring-blue-50"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Open Online Admission Form</span>
                </button>
                <button
                  onClick={() => setActiveView('pin_checker')}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Check Result PIN</span>
                </button>
              </div>
            </div>
          </section>

          {/* School Directory */}
          <section className="max-w-7xl mx-auto px-6 pb-24">
            <div className="flex items-center justify-between gap-4 mb-10 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-blue-900" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select your portal to continue</h3>
              </div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {schools.length} Active Institutions
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schools.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:border-blue-900/20 transition-all group relative overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 -z-10"></div>
                  
                  <div className="flex items-start justify-between mb-8">
                    <img
                      src={s.logo}
                      alt={s.name}
                      className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg shadow-slate-200"
                    />
                    <button
                      onClick={() => handleSelectSubdomain(s.subdomain)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-900 hover:text-amber-300 text-blue-900 text-[10px] font-black uppercase tracking-widest rounded-full transition"
                    >
                      Enter Portal →
                    </button>
                  </div>

                  <div className="space-y-2 flex-grow">
                    <h4
                      onClick={() => handleSelectSubdomain(s.subdomain)}
                      className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-900 transition cursor-pointer"
                    >
                      {s.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 italic">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>{s.subdomain}.edusmartportal.com</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-4 line-clamp-3">
                      Access official results, online admission registration, and manage accounts for {s.name}.
                    </p>
                  </div>

                  {/* Institution Quick Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        storageService.setActiveSchoolId(s.id);
                        setActiveSchool(s);
                        setActiveView('admission_form');
                      }}
                      className="grow px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Apply Online</span>
                    </button>
                    <button
                      onClick={() => {
                        storageService.setActiveSchoolId(s.id);
                        setActiveSchool(s);
                        setActiveView('pin_checker');
                      }}
                      className="grow px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Check PIN</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Register New CTA */}
              <div
                onClick={() => setIsSchoolRegisterOpen(true)}
                className="bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-3xl p-8 transition-all hover:bg-blue-50 hover:border-blue-300 cursor-pointer flex flex-col items-center justify-center text-center gap-4 h-full"
              >
                <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-900 group-hover:scale-110 transition">
                  <PlusCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-blue-900 uppercase tracking-tight">Add Your School</h4>
                  <p className="text-xs text-slate-500 font-medium">Join the EduSmart network and digitize your institution today.</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Improved Landing Footer */}
        <footer className="bg-slate-950 py-16 text-white border-t-8 border-blue-900">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900 rounded-xl">
                  <Building2 className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">EduSmart <span className="text-blue-500">Portal</span></h3>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-medium">
                The leading academic management ecosystem in West Africa. 
                Providing enterprise-grade solutions for results, 
                admissions, and student data governance.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Core Features</h4>
              <ul className="text-xs text-slate-300 space-y-2.5 font-bold">
                <li>Automated Result Processing</li>
                <li>CBT Examination Engine</li>
                <li>Secure Result Verification</li>
                <li>School Fee Management</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Global Network</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-900 rounded text-[9px] font-black uppercase tracking-widest border border-slate-800">Lagos</span>
                <span className="px-2 py-1 bg-slate-900 rounded text-[9px] font-black uppercase tracking-widest border border-slate-800">Abuja</span>
                <span className="px-2 py-1 bg-slate-900 rounded text-[9px] font-black uppercase tracking-widest border border-slate-800">Enugu</span>
                <span className="px-2 py-1 bg-slate-900 rounded text-[9px] font-black uppercase tracking-widest border border-slate-800">Port Harcourt</span>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
              © 2026 EduSmart Academic Management System • Trusted by {schools.length} Schools
            </p>
            <div className="flex items-center gap-6 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
            </div>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
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
        onOpenAdmissionForm={(sch) => {
          storageService.setActiveSchoolId(sch.id);
          setActiveSchool(sch);
          setActiveView('admission_form');
        }}
        onOpenPinChecker={(sch) => {
          storageService.setActiveSchoolId(sch.id);
          setActiveSchool(sch);
          setActiveView('pin_checker');
        }}
      />
    </div>
  );
}
