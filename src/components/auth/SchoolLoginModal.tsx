import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  GraduationCap,
  Users,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { School, User } from '../../types';
import { storageService } from '../../services/storageService';
import { PasswordResetModal } from './PasswordResetModal';

export type SchoolLoginRoleTab = 'admin' | 'teacher' | 'student' | 'parents';

interface SchoolLoginModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onOpenAdmissionForm?: (school: School) => void;
  onOpenPinChecker?: (school: School) => void;
  defaultRoleTab?: SchoolLoginRoleTab;
}

export const SchoolLoginModal: React.FC<SchoolLoginModalProps> = ({
  school,
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenAdmissionForm,
  onOpenPinChecker,
  defaultRoleTab = 'admin',
}) => {
  if (!isOpen || !school) return null;

  // Active role tab: 'admin', 'teacher', 'student', 'parents'
  const [activeTab, setActiveTab] = useState<SchoolLoginRoleTab>(defaultRoleTab);

  // 1. Admin Form State (Email + Password)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // 2. Teacher Form State (Email + Password)
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);

  // 3. Student Form State (Student Full Name + Admission Number)
  const [studentFullName, setStudentFullName] = useState('');
  const [studentAdmissionNo, setStudentAdmissionNo] = useState('');

  // 4. Parents Form State (Child Full Name + Child Admission Number)
  const [childFullName, setChildFullName] = useState('');
  const [childAdmissionNo, setChildAdmissionNo] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');

  // Load sample users for quick demo chips
  const allSchoolUsers = storageService.getUsers().filter((u) => u.schoolId === school.id);
  const sampleAdmin = allSchoolUsers.find((u) => u.role === 'SCHOOL_ADMIN');
  const sampleTeachers = allSchoolUsers.filter((u) => u.role === 'TEACHER');
  const sampleStudents = allSchoolUsers.filter((u) => u.role === 'STUDENT');

  useEffect(() => {
    setError('');
    setIsLoading(false);
    setShowAdminPassword(false);
    setShowTeacherPassword(false);

    // Pre-populate sample defaults if fields are empty
    if (sampleAdmin && !adminEmail) {
      setAdminEmail(sampleAdmin.email || `admin@${school.subdomain}.edu.ng`);
      setAdminPassword('password123');
    }
    if (sampleTeachers.length > 0 && !teacherEmail) {
      setTeacherEmail(sampleTeachers[0].email || '');
      setTeacherPassword('password123');
    }
    if (sampleStudents.length > 0 && !studentFullName) {
      setStudentFullName(sampleStudents[0].name);
      setStudentAdmissionNo(sampleStudents[0].regNo);
      setChildFullName(sampleStudents[0].name);
      setChildAdmissionNo(sampleStudents[0].regNo);
    }
  }, [isOpen, school?.id]);

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!adminEmail.trim()) {
      setError('Please enter your school administrator email address.');
      return;
    }
    if (!adminPassword.trim()) {
      setError('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = storageService.authenticateAdmin(school.id, adminEmail, adminPassword);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setError(result.message || 'Invalid administrator email address or password.');
      }
    }, 250);
  };

  // Handle Teacher Login
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!teacherEmail.trim()) {
      setError('Please enter your teacher/staff email address.');
      return;
    }
    if (!teacherPassword.trim()) {
      setError('Please enter your teacher password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = storageService.authenticateTeacher(school.id, teacherEmail, teacherPassword);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setError(result.message || 'Invalid teacher email address or password.');
      }
    }, 250);
  };

  // Handle Student Login (Student Full Name + Admission Number)
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentFullName.trim()) {
      setError('Please enter your full student name as registered.');
      return;
    }
    if (!studentAdmissionNo.trim()) {
      setError('Please enter your student admission or registration number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = storageService.authenticateStudent(school.id, studentFullName, studentAdmissionNo);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setError(result.message || 'Student login failed. Please verify the Full Name and Admission Number.');
      }
    }, 250);
  };

  // Handle Parent Login (Child Full Name + Child Admission Number)
  const handleParentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!childFullName.trim()) {
      setError("Please enter your child's full registered name.");
      return;
    }
    if (!childAdmissionNo.trim()) {
      setError("Please enter your child's official admission number.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = storageService.authenticateParent(school.id, childFullName, childAdmissionNo);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setError(result.message || "Parent login failed. Please verify your child's name and admission number.");
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative my-auto text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          id="btn-close-school-login"
          className="absolute top-4 right-4 text-slate-300 hover:text-white bg-black/25 hover:bg-black/50 p-2 rounded-full transition z-20 backdrop-blur-xs"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Institution Branding Header */}
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12"></div>

          <div className="flex items-center gap-3.5 relative z-10">
            <img
              src={school.logo}
              alt={school.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-xl bg-white shrink-0"
            />
            <div className="min-w-0 pr-8">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Unified School Portal</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate leading-tight">
                {school.name}
              </h2>
              <p className="text-[10px] text-slate-300 font-mono truncate">
                {school.subdomain}.edusmartportal.com
              </p>
            </div>
          </div>
        </div>

        {/* Four Role Selection Tabs */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {/* Admin Tab */}
            <button
              type="button"
              id="tab-role-admin"
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-blue-900 text-amber-300 shadow-md ring-2 ring-blue-900/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">Admin</span>
            </button>

            {/* Teacher Tab */}
            <button
              type="button"
              id="tab-role-teacher"
              onClick={() => {
                setActiveTab('teacher');
                setError('');
              }}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === 'teacher'
                  ? 'bg-blue-900 text-amber-300 shadow-md ring-2 ring-blue-900/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span className="truncate">Teacher</span>
            </button>

            {/* Student Tab */}
            <button
              type="button"
              id="tab-role-student"
              onClick={() => {
                setActiveTab('student');
                setError('');
              }}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-blue-900 text-amber-300 shadow-md ring-2 ring-blue-900/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="truncate">Student</span>
            </button>

            {/* Parents Tab */}
            <button
              type="button"
              id="tab-role-parents"
              onClick={() => {
                setActiveTab('parents');
                setError('');
              }}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === 'parents'
                  ? 'bg-blue-900 text-amber-300 shadow-md ring-2 ring-blue-900/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">Parents</span>
            </button>
          </div>

          {/* Role Header Banner */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex items-start gap-2.5">
            <div className="p-1.5 bg-blue-900 text-amber-300 rounded-lg shrink-0 mt-0.5">
              {activeTab === 'admin' && <ShieldCheck className="w-4 h-4" />}
              {activeTab === 'teacher' && <Award className="w-4 h-4" />}
              {activeTab === 'student' && <GraduationCap className="w-4 h-4" />}
              {activeTab === 'parents' && <Users className="w-4 h-4" />}
            </div>
            <div className="text-xs">
              <div className="font-black text-blue-950 uppercase tracking-tight">
                {activeTab === 'admin' && 'School Administrator Login'}
                {activeTab === 'teacher' && 'Teacher & Staff Portal Login'}
                {activeTab === 'student' && 'Student Academic Portal Login'}
                {activeTab === 'parents' && 'Parent & Guardian Portal Access'}
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {activeTab === 'admin' && 'Enter your registered school admin email address and password.'}
                {activeTab === 'teacher' && 'Enter your teacher email address and password to manage assigned classes.'}
                {activeTab === 'student' && 'Sign in directly with your registered Student Full Name and Admission Number.'}
                {activeTab === 'parents' && "Enter your Child's Full Name and Admission Number to access report card & fees."}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. ADMIN TAB (Requires Email Address + Password) */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Administrator Email Address</span>
                  <span className="text-[10px] text-blue-900 font-bold lowercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="input-admin-email"
                    required
                    autoFocus
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={`e.g. admin@${school.subdomain}.edu.ng`}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Administrator Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(adminEmail);
                      setIsPasswordResetOpen(true);
                    }}
                    className="text-[10px] text-blue-900 hover:text-blue-700 hover:underline font-bold capitalize"
                  >
                    Forgot Password?
                  </button>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    id="input-admin-password"
                    required
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter admin password..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sample Admin Quick Autofill */}
              {sampleAdmin && (
                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-600">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminEmail(sampleAdmin.email || `admin@${school.subdomain}.edu.ng`);
                      setAdminPassword('password123');
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-blue-900 font-mono text-[10px] rounded-md transition border border-slate-200 truncate max-w-xs"
                  >
                    {sampleAdmin.email}
                  </button>
                </div>
              )}

              <button
                type="submit"
                id="btn-login-admin"
                disabled={isLoading}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Authenticating Administrator...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Sign In as Admin</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 2. TEACHER TAB (Requires Email Address + Password) */}
          {/* ========================================================================= */}
          {activeTab === 'teacher' && (
            <form onSubmit={handleTeacherLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Teacher Email Address</span>
                  <span className="text-[10px] text-blue-900 font-bold lowercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="input-teacher-email"
                    required
                    autoFocus
                    value={teacherEmail}
                    onChange={(e) => {
                      setTeacherEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. david.okon@crownacademy.edu.ng"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Teacher Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(teacherEmail);
                      setIsPasswordResetOpen(true);
                    }}
                    className="text-[10px] text-blue-900 hover:text-blue-700 hover:underline font-bold capitalize"
                  >
                    Forgot Password?
                  </button>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    id="input-teacher-password"
                    required
                    value={teacherPassword}
                    onChange={(e) => {
                      setTeacherPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter teacher password..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sample Teachers Quick Autofill Chips */}
              {sampleTeachers.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Available Teachers in {school.name}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleTeachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTeacherEmail(t.email || '');
                          setTeacherPassword('password123');
                        }}
                        className={`px-2.5 py-1 text-[10px] rounded-lg transition border text-left flex items-center gap-1 ${
                          teacherEmail === t.email
                            ? 'bg-blue-900 text-amber-300 border-blue-900 font-bold'
                            : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{t.name}</span>
                        <span className="text-[9px] opacity-75 font-mono">({t.assignedClasses?.join(', ') || t.className})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="btn-login-teacher"
                disabled={isLoading}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Signing In Teacher...</span>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Sign In as Teacher</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 3. STUDENT TAB (Requires Student Full Name + Admission Number) */}
          {/* ========================================================================= */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Student Full Name</span>
                  <span className="text-[10px] text-blue-900 font-bold lowercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-student-fullname"
                    required
                    autoFocus
                    value={studentFullName}
                    onChange={(e) => {
                      setStudentFullName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. Tobi Adeleke"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Student Admission / Reg Number</span>
                  <span className="text-[10px] text-blue-900 font-bold lowercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-student-adm-no"
                    required
                    value={studentAdmissionNo}
                    onChange={(e) => {
                      setStudentAdmissionNo(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. CRA/2026/001"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 uppercase"
                  />
                </div>
              </div>

              {/* Sample Students Quick Autofill Chips */}
              {sampleStudents.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Sample Registered Students:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleStudents.slice(0, 3).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setStudentFullName(st.name);
                          setStudentAdmissionNo(st.regNo);
                        }}
                        className={`px-2.5 py-1 text-[10px] rounded-lg transition border text-left flex items-center gap-1 ${
                          studentAdmissionNo === st.regNo
                            ? 'bg-blue-900 text-amber-300 border-blue-900 font-bold'
                            : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <GraduationCap className="w-3 h-3" />
                        <span>{st.name}</span>
                        <span className="text-[9px] font-mono opacity-80 font-bold">({st.regNo})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="btn-login-student"
                disabled={isLoading}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Verifying Student Records...</span>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <span>Enter Student Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 4. PARENTS TAB (Requires Child Full Name + Child Admission Number) */}
          {/* ========================================================================= */}
          {activeTab === 'parents' && (
            <form onSubmit={handleParentLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Child's Full Name</span>
                  <span className="text-[10px] text-blue-900 font-bold lowercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-parent-child-name"
                    required
                    autoFocus
                    value={childFullName}
                    onChange={(e) => {
                      setChildFullName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. Tobi Adeleke"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Child's Admission / Reg Number</span>
                  <span className="text-[10px] text-blue-900 font-bold lowercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-parent-child-reg"
                    required
                    value={childAdmissionNo}
                    onChange={(e) => {
                      setChildAdmissionNo(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. CRA/2026/001"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 uppercase"
                  />
                </div>
              </div>

              {/* Sample Children Quick Autofill Chips */}
              {sampleStudents.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Sample Enrolled Wards:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleStudents.slice(0, 3).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setChildFullName(st.name);
                          setChildAdmissionNo(st.regNo);
                        }}
                        className={`px-2.5 py-1 text-[10px] rounded-lg transition border text-left flex items-center gap-1 ${
                          childAdmissionNo === st.regNo
                            ? 'bg-blue-900 text-amber-300 border-blue-900 font-bold'
                            : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>{st.name}</span>
                        <span className="text-[9px] font-mono opacity-80 font-bold">({st.regNo})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="btn-login-parent"
                disabled={isLoading}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Accessing Ward Portal...</span>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Access Ward Report Card & Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Public Portals Quick Access & Reset Trigger */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setResetIdentifier(activeTab === 'admin' ? adminEmail : activeTab === 'teacher' ? teacherEmail : '');
                setIsPasswordResetOpen(true);
              }}
              className="text-amber-800 hover:text-amber-950 hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Forgot Password / Reset Credentials</span>
            </button>

            <div className="flex items-center gap-3">
              {onOpenAdmissionForm && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmissionForm(school);
                  }}
                  className="text-blue-900 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admissions</span>
                </button>
              )}

              {onOpenPinChecker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPinChecker(school);
                  }}
                  className="text-emerald-800 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PIN Checker</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Password Reset Modal */}
      <PasswordResetModal
        isOpen={isPasswordResetOpen}
        onClose={() => setIsPasswordResetOpen(false)}
        defaultSchool={school}
        initialIdentifier={resetIdentifier}
        onSwitchToLogin={(sch, roleTab, loginId, newPassword) => {
          if (roleTab) {
            setActiveTab(roleTab);
          }
          if (roleTab === 'admin') {
            if (loginId) setAdminEmail(loginId);
            if (newPassword) setAdminPassword(newPassword);
          } else if (roleTab === 'teacher') {
            if (loginId) setTeacherEmail(loginId);
            if (newPassword) setTeacherPassword(newPassword);
          } else if (roleTab === 'student') {
            if (loginId) setStudentAdmissionNo(loginId);
          } else if (roleTab === 'parents') {
            if (loginId) setChildAdmissionNo(loginId);
          }
          setIsPasswordResetOpen(false);
        }}
      />
    </div>
  );
};
