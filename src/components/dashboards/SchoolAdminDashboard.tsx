import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  UserCheck,
  KeyRound,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Printer,
  Upload,
  Sparkles,
  Search,
  Building2,
  FileQuestion,
  Save,
  Download,
  Eye,
  MessageCircle,
  Edit,
  RefreshCw,
  MapPin,
  Image as ImageIcon,
  Home,
  HeartHandshake,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { School, User, FeeSchedule, FeePayment, AdmissionApplication, ResultPin, CbtExam } from '../../types';
import { DEFAULT_SCHOOL_CLASSES } from '../../constants/classes';
import { NIGERIAN_STATES_AND_LGAS, calculateAgeFromDob } from '../../constants/locations';
import { CbtCreator } from '../cbt/CbtCreator';
import { FeeReceiptPrint } from '../fees/FeeReceiptPrint';
import { AdmissionSlipPrint } from '../admissions/AdmissionSlipPrint';
import { OnlineAdmissionForm } from '../admissions/OnlineAdmissionForm';
import { StudentResultPreviewModal } from '../results/StudentResultPreviewModal';
import { StudentReportEditorModal } from '../results/StudentReportEditorModal';
import { WhatsAppShareModal } from '../results/WhatsAppShareModal';
import { EditStudentProfileModal } from './EditStudentProfileModal';
import { EditTeacherClassesModal } from './EditTeacherClassesModal';
import { SecurityAndAuditTab } from './SecurityAndAuditTab';
import { PasswordResetModal } from '../auth/PasswordResetModal';
import { generatePinCode, generateReceiptNo, calculateTotalAndGrade } from '../../utils/calcUtils';
import { exportFeeReportToExcel, downloadResultTemplate, parseResultExcel, ParsedExcelResult } from '../../utils/excelUtils';
import { PrintButton } from '../common/PrintButton';

interface SchoolAdminDashboardProps {
  school: School;
  currentUser: User;
}

export const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({ school, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'results' | 'fees' | 'admissions' | 'users' | 'pins' | 'cbt' | 'security'>('branding');
  const [isCreatingCbt, setIsCreatingCbt] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<User | null>(null);
  const [editReportStudent, setEditReportStudent] = useState<User | null>(null);
  const [whatsAppStudent, setWhatsAppStudent] = useState<User | null>(null);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editingTeacherClasses, setEditingTeacherClasses] = useState<User | null>(null);
  const [newUserAssignedClasses, setNewUserAssignedClasses] = useState<string[]>(['JSS 1A']);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserTarget, setResetUserTarget] = useState<User | null>(null);

  // School Branding State
  const [schoolName, setSchoolName] = useState(school.name);
  const [motto, setMotto] = useState(school.motto);
  const [address, setAddress] = useState(school.address);
  const [logo, setLogo] = useState(school.logo);
  const [primaryColor, setPrimaryColor] = useState(school.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(school.secondaryColor);
  const [showPositionOnResult, setShowPositionOnResult] = useState(school.showPositionOnResult ?? true);
  const [brandingSuccess, setBrandingSuccess] = useState('');

  // Fee State
  const [selectedFeeReceipt, setSelectedFeeReceipt] = useState<FeePayment | null>(null);
  const [studentRegNoPay, setStudentRegNoPay] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Card' | 'POS'>('Bank Transfer');
  const [feeTerm, setFeeTerm] = useState('First Term');
  const [feeSession, setFeeSession] = useState('2025/2026');

  // Admissions state
  const [selectedAdmissionSlip, setSelectedAdmissionSlip] = useState<AdmissionApplication | null>(null);
  const [editingAdmission, setEditingAdmission] = useState<AdmissionApplication | null>(null);

  // Users state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserParentPhone, setNewUserParentPhone] = useState('');
  const [newUserParentWhatsapp, setNewUserParentWhatsapp] = useState('');
  const [newUserStudentPin, setNewUserStudentPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'TEACHER' | 'STUDENT' | 'PARENT'>('STUDENT');
  const [newUserClass, setNewUserClass] = useState('JSS 1A');
  const [newUserGender, setNewUserGender] = useState<'Male' | 'Female'>('Male');
  const [newUserDob, setNewUserDob] = useState('2015-05-12');
  const [newUserAdmissionDate, setNewUserAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newUserPreviousSchool, setNewUserPreviousSchool] = useState('');
  const [newUserLastClassAttended, setNewUserLastClassAttended] = useState('');
  const [newUserNationality, setNewUserNationality] = useState('Nigerian');
  const [newUserReligion, setNewUserReligion] = useState('Christianity');
  const [newUserStateOfOrigin, setNewUserStateOfOrigin] = useState('Lagos');
  const [newUserLga, setNewUserLga] = useState('Ikeja');
  const [newUserResidentAddress, setNewUserResidentAddress] = useState('');
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState('');
  const [customRegNo, setCustomRegNo] = useState('');

  // Student Living Arrangement & Parent vs Guardian differentiation
  const [newUserLivingWith, setNewUserLivingWith] = useState<string>('Biological Parents');
  const [newUserPrimaryContactPerson, setNewUserPrimaryContactPerson] = useState<string>('Both Parents');
  const [newUserFatherName, setNewUserFatherName] = useState('');
  const [newUserFatherPhone, setNewUserFatherPhone] = useState('');
  const [newUserFatherOccupation, setNewUserFatherOccupation] = useState('');
  const [newUserMotherName, setNewUserMotherName] = useState('');
  const [newUserMotherPhone, setNewUserMotherPhone] = useState('');
  const [newUserMotherOccupation, setNewUserMotherOccupation] = useState('');
  const [newUserGuardianName, setNewUserGuardianName] = useState('');
  const [newUserGuardianRelationship, setNewUserGuardianRelationship] = useState('Uncle');
  const [newUserGuardianPhone, setNewUserGuardianPhone] = useState('');
  const [newUserGuardianWhatsapp, setNewUserGuardianWhatsapp] = useState('');
  const [newUserGuardianOccupation, setNewUserGuardianOccupation] = useState('');
  const [newUserGuardianAddress, setNewUserGuardianAddress] = useState('');

  // PINs state
  const [pinCountToGenerate, setPinCountToGenerate] = useState(5);
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  
  // Results Management State
  const [selectedClassRes, setSelectedClassRes] = useState('JSS 1A');
  const [selectedSubjectRes, setSelectedSubjectRes] = useState('Mathematics');
  const [selectedTermRes, setSelectedTermRes] = useState('First Term');
  const [selectedSessionRes, setSelectedSessionRes] = useState('2025/2026');
  const [manualScores, setManualScores] = useState<Record<string, { ca: number; exam: number }>>({});
  const [saveMsg, setSaveMsg] = useState('');
  const [excelSuccessMsg, setExcelSuccessMsg] = useState('');
  const [parsedExcelRows, setParsedExcelRows] = useState<ParsedExcelResult[]>([]);

  const feeSchedules = storageService.getFeeSchedules(school.id);
  const feePayments = storageService.getFeePayments(school.id);
  const admissions = storageService.getAdmissions(school.id);
  const users = storageService.getUsers().filter((u) => u.schoolId === school.id);
  const pins = storageService.getPins(school.id);
  const cbtExams = storageService.getCbtExams(school.id);

  // Save Branding
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: School = {
      ...school,
      name: schoolName,
      motto,
      address,
      logo,
      primaryColor,
      secondaryColor,
      showPositionOnResult,
    };
    storageService.updateSchool(updated);
    setBrandingSuccess('School portal branding updated successfully!');
    setTimeout(() => setBrandingSuccess(''), 3000);
  };

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = users.find((u) => u.regNo.toLowerCase() === studentRegNoPay.trim().toLowerCase());
    const studentName = targetStudent ? targetStudent.name : 'Student';
    const className = targetStudent?.className || 'JSS 1A';

    const totalExpected = 900;
    const existingPayments = feePayments.filter((p) => p.studentRegNo.toLowerCase() === studentRegNoPay.trim().toLowerCase());
    const totalAlreadyPaid = existingPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    const newAmountPaid = Number(amountPaidInput);
    const cumulativePaid = totalAlreadyPaid + newAmountPaid;
    const balanceRemaining = Math.max(0, totalExpected - cumulativePaid);

    const newPayment: FeePayment = {
      id: `pay-${Date.now()}`,
      schoolId: school.id,
      studentRegNo: studentRegNoPay,
      studentName,
      className,
      amountPaid: newAmountPaid,
      totalExpected,
      balanceRemaining,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      term: feeTerm,
      session: feeSession,
      receiptNo: generateReceiptNo(),
      status: balanceRemaining === 0 ? 'PAID' : 'PARTIAL',
      remarks: balanceRemaining === 0 ? 'Full fees settled.' : `Part payment received. Balance $${balanceRemaining}`,
    };

    storageService.recordFeePayment(newPayment);
    setSelectedFeeReceipt(newPayment);
  };

  // Approve Admission
  const handleApproveAdmission = (appId: string) => {
    const newStudent = storageService.approveAdmission(appId);
    if (newStudent) {
      alert(`Student "${newStudent.name}" admitted successfully! Assigned Reg No: ${newStudent.regNo}`);
    }
  };

  // Photo upload handler
  const handleStudentPassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setNewUserAvatarUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // State change handler
  const handleUserStateChange = (newState: string) => {
    setNewUserStateOfOrigin(newState);
    const found = NIGERIAN_STATES_AND_LGAS.find((s) => s.state === newState);
    if (found && found.lgas.length > 0) {
      setNewUserLga(found.lgas[0]);
    } else {
      setNewUserLga('');
    }
  };

  // Auto generated RegNo computation
  const initials = school.subdomain ? school.subdomain.toUpperCase().slice(0, 3) : 'SCH';
  const count = users.length + 1;
  const autoGeneratedRegNo =
    newUserRole === 'TEACHER'
      ? `TCH/${initials}/${String(count).padStart(2, '0')}`
      : newUserRole === 'STUDENT'
      ? `${initials}/2026/${String(count).padStart(3, '0')}`
      : `PRN/${initials}/${String(count).padStart(3, '0')}`;

  const studentAge = calculateAgeFromDob(newUserDob);

  // Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    if (newUserRole !== 'STUDENT' && !newUserEmail.trim()) {
      alert('Email address is required for Teachers and Parents.');
      return;
    }

    const finalRegNo = customRegNo.trim() || autoGeneratedRegNo;
    const finalStudentName = newUserName.trim() || `Student (${finalRegNo})`;

    const derivedPrimaryPhone =
      newUserParentPhone.trim() ||
      (newUserLivingWith.includes('Guardian') ? newUserGuardianPhone.trim() : newUserFatherPhone.trim() || newUserMotherPhone.trim()) ||
      '';

    const derivedPrimaryWhatsapp =
      newUserParentWhatsapp.trim() ||
      (newUserLivingWith.includes('Guardian') ? newUserGuardianWhatsapp.trim() : newUserFatherPhone.trim() || newUserMotherPhone.trim()) ||
      derivedPrimaryPhone;

    storageService.addUser({
      schoolId: school.id,
      regNo: finalRegNo,
      name: newUserRole === 'STUDENT' ? finalStudentName : newUserName.trim(),
      email: newUserRole === 'STUDENT' ? undefined : newUserEmail.trim(),
      role: newUserRole,
      parentPhone: newUserRole === 'STUDENT' ? derivedPrimaryPhone : undefined,
      parentWhatsapp: newUserRole === 'STUDENT' ? derivedPrimaryWhatsapp : undefined,
      studentPin: newUserRole === 'STUDENT' ? (newUserStudentPin || '1234') : undefined,
      className: newUserRole === 'STUDENT' ? newUserClass : (newUserAssignedClasses[0] || newUserClass),
      assignedClasses: newUserRole === 'TEACHER' ? (newUserAssignedClasses.length > 0 ? newUserAssignedClasses : [newUserClass]) : undefined,
      gender: newUserRole === 'STUDENT' ? newUserGender : undefined,
      dob: newUserRole === 'STUDENT' ? newUserDob : undefined,
      age: newUserRole === 'STUDENT' ? studentAge : undefined,
      admissionDate: newUserRole === 'STUDENT' ? (newUserAdmissionDate || new Date().toISOString().split('T')[0]) : undefined,
      previousSchool: newUserRole === 'STUDENT' ? newUserPreviousSchool.trim() : undefined,
      lastClassAttended: newUserRole === 'STUDENT' ? newUserLastClassAttended.trim() : undefined,
      nationality: newUserRole === 'STUDENT' ? (newUserNationality.trim() || 'Nigerian') : undefined,
      religion: newUserRole === 'STUDENT' ? (newUserReligion.trim() || 'Christianity') : undefined,
      stateOfOrigin: newUserRole === 'STUDENT' ? newUserStateOfOrigin : undefined,
      lga: newUserRole === 'STUDENT' ? newUserLga : undefined,
      residentAddress: newUserRole === 'STUDENT' ? newUserResidentAddress.trim() : undefined,
      livingWith: newUserRole === 'STUDENT' ? newUserLivingWith : undefined,
      primaryContactPerson: newUserRole === 'STUDENT' ? newUserPrimaryContactPerson : undefined,
      fatherName: newUserRole === 'STUDENT' ? newUserFatherName.trim() : undefined,
      fatherPhone: newUserRole === 'STUDENT' ? newUserFatherPhone.trim() : undefined,
      fatherOccupation: newUserRole === 'STUDENT' ? newUserFatherOccupation.trim() : undefined,
      motherName: newUserRole === 'STUDENT' ? newUserMotherName.trim() : undefined,
      motherPhone: newUserRole === 'STUDENT' ? newUserMotherPhone.trim() : undefined,
      motherOccupation: newUserRole === 'STUDENT' ? newUserMotherOccupation.trim() : undefined,
      guardianName: newUserRole === 'STUDENT' ? newUserGuardianName.trim() : undefined,
      guardianRelationship: newUserRole === 'STUDENT' ? newUserGuardianRelationship.trim() : undefined,
      guardianPhone: newUserRole === 'STUDENT' ? newUserGuardianPhone.trim() : undefined,
      guardianWhatsapp: newUserRole === 'STUDENT' ? newUserGuardianWhatsapp.trim() : undefined,
      guardianOccupation: newUserRole === 'STUDENT' ? newUserGuardianOccupation.trim() : undefined,
      guardianAddress: newUserRole === 'STUDENT' ? newUserGuardianAddress.trim() : undefined,
      avatarUrl: newUserAvatarUrl || (newUserRole === 'STUDENT' ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'),
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserParentPhone('');
    setNewUserParentWhatsapp('');
    setNewUserPreviousSchool('');
    setNewUserLastClassAttended('');
    setNewUserNationality('Nigerian');
    setNewUserReligion('Christianity');
    setNewUserAdmissionDate(new Date().toISOString().split('T')[0]);
    setNewUserFatherName('');
    setNewUserFatherPhone('');
    setNewUserFatherOccupation('');
    setNewUserMotherName('');
    setNewUserMotherPhone('');
    setNewUserMotherOccupation('');
    setNewUserGuardianName('');
    setNewUserGuardianPhone('');
    setNewUserGuardianWhatsapp('');
    setNewUserGuardianOccupation('');
    setNewUserGuardianAddress('');
    setNewUserStudentPin('1234');
    setCustomRegNo('');
    setNewUserResidentAddress('');
    setNewUserAvatarUrl('');
    alert(`New ${newUserRole} registered successfully!\nAssigned Reg No: ${finalRegNo}${newUserRole === 'STUDENT' ? `\nStudent Login PIN: ${newUserStudentPin || '1234'}\nLiving With: ${newUserLivingWith}` : ''}`);
  };

  // Result Management Logic
  const allResults = storageService.getResults(school.id);
  const studentsInClass = users.filter((u) => u.role === 'STUDENT' && u.className === selectedClassRes);
  const currentResults = allResults.filter(
    (r) =>
      r.className === selectedClassRes &&
      r.subject === selectedSubjectRes &&
      r.term === selectedTermRes &&
      r.session === selectedSessionRes
  );

  const getStudentScore = (regNo: string) => {
    if (manualScores[regNo]) return manualScores[regNo];
    const existing = currentResults.find((r) => r.studentRegNo === regNo);
    return {
      ca: existing ? existing.ca : 0,
      exam: existing ? existing.exam : 0,
    };
  };

  const handleScoreChange = (regNo: string, field: 'ca' | 'exam', value: number) => {
    const current = getStudentScore(regNo);
    setManualScores((prev) => ({
      ...prev,
      [regNo]: { ...current, [field]: value },
    }));
  };

  const handleSaveManualResults = () => {
    const updatedList = studentsInClass.map((s) => {
      const scores = getStudentScore(s.regNo);
      const calc = calculateTotalAndGrade(scores.ca, scores.exam);
      return {
        id: `res-${s.regNo.replace(/\//g, '')}-${selectedSubjectRes}-${selectedTermRes}`,
        schoolId: school.id,
        studentRegNo: s.regNo,
        studentName: s.name,
        className: selectedClassRes,
        term: selectedTermRes,
        session: selectedSessionRes,
        subject: selectedSubjectRes,
        ca: scores.ca,
        exam: scores.exam,
        total: calc.total,
        grade: calc.grade,
        remark: calc.remark,
      };
    });
    storageService.bulkSaveResults(updatedList);
    setSaveMsg(`Results for ${studentsInClass.length} students in ${selectedSubjectRes} saved & positions updated!`);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseResultExcel(file);
      setParsedExcelRows(parsed);
    } catch (err) {
      alert('Error reading Excel file.');
    }
  };

  const handleSaveExcelRows = () => {
    const validRows = parsedExcelRows.filter((r) => r.isValid);
    const newResults = validRows.map((r) => ({
      id: `res-${r.studentRegNo.replace(/\//g, '')}-${selectedSubjectRes}-${selectedTermRes}`,
      schoolId: school.id,
      studentRegNo: r.studentRegNo,
      studentName: r.studentName,
      className: selectedClassRes,
      term: selectedTermRes,
      session: selectedSessionRes,
      subject: selectedSubjectRes,
      ca: r.ca,
      exam: r.exam,
      total: r.total,
      grade: r.grade,
      remark: r.remark,
    }));
    storageService.bulkSaveResults(newResults);
    setExcelSuccessMsg(`Imported ${validRows.length} scores from Excel!`);
    setParsedExcelRows([]);
    setTimeout(() => setExcelSuccessMsg(''), 3000);
  };

  // Generate PINs
  const handleGeneratePins = () => {
    for (let i = 0; i < pinCountToGenerate; i++) {
      const pinCode = generatePinCode();
      storageService.addPin({
        id: `pin-${Date.now()}-${i}`,
        schoolId: school.id,
        pinCode,
        term: 'First Term',
        session: '2025/2026',
        isUsed: false,
        usesCount: 0,
        maxUses: 5,
        createdAt: new Date().toISOString(),
      });
    }
    setPinSuccessMsg(`Generated ${pinCountToGenerate} new result checking PIN codes!`);
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  if (selectedFeeReceipt) {
    return <FeeReceiptPrint school={school} payment={selectedFeeReceipt} onBack={() => setSelectedFeeReceipt(null)} />;
  }

  if (editingAdmission) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between bg-blue-900 text-white p-4 rounded-xl shadow-md gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingAdmission(null)}
              className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5"
            >
              ← Back to Admissions Queue
            </button>
            <div>
              <span className="text-xs text-amber-300 font-bold block">
                Administrator Edit Mode
              </span>
              <span className="text-[11px] text-blue-100">
                Application: <strong className="font-mono text-white">{editingAdmission.id}</strong> — {editingAdmission.studentName}
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded uppercase tracking-wider">
            All fields can be modified & re-submitted
          </span>
        </div>

        <OnlineAdmissionForm
          school={school}
          initialApplicationToEdit={editingAdmission}
          onSubmitted={() => {
            setEditingAdmission(null);
            setSelectedAdmissionSlip(null);
          }}
        />
      </div>
    );
  }

  if (selectedAdmissionSlip) {
    return (
      <AdmissionSlipPrint
        school={school}
        admission={selectedAdmissionSlip}
        onBack={() => setSelectedAdmissionSlip(null)}
        onEdit={() => {
          const adm = selectedAdmissionSlip;
          setSelectedAdmissionSlip(null);
          setEditingAdmission(adm);
        }}
      />
    );
  }

  if (isCreatingCbt) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <CbtCreator
          school={school}
          teacher={currentUser}
          onSaved={() => setIsCreatingCbt(false)}
          onCancel={() => setIsCreatingCbt(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</p>
            <p className="text-lg font-black text-slate-950">{users.filter((u) => u.role === 'STUDENT').length} Students</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('admissions')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 text-left hover:border-amber-500 transition group"
        >
          <div className="p-2.5 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition">
            <UserCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Review</p>
            <p className="text-lg font-black text-amber-600">
              {admissions.filter((a) => a.status === 'PENDING').length} Admissions
            </p>
          </div>
        </button>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue (MTD)</p>
            <p className="text-lg font-black text-slate-950">₦{feePayments.reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString()}k</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('results')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 text-left hover:border-blue-900 transition group"
        >
          <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Results Management</p>
            <p className="text-lg font-black text-slate-950">Prepare Scores</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pins')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 text-left hover:border-blue-900 transition group"
        >
          <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition">
            <KeyRound className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active PINs</p>
            <p className="text-lg font-black text-slate-950">{pins.filter((p) => !p.isUsed).length} Unused</p>
          </div>
        </button>
      </div>

      {/* Admin Header Banner */}
      <div className="bg-blue-900 border-b-4 border-amber-500 rounded p-6 shadow-sm text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={school.logo} alt={school.name} className="w-14 h-14 rounded object-cover border-2 border-amber-400 bg-white shadow-sm" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">{school.name} Admin Portal</h1>
            <p className="text-xs text-blue-200">
              Customize portal branding, manage fees & payments, approve online admissions, and issue result PINs.
            </p>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/10 p-1.5 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition ${
              activeTab === 'branding' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Branding
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition ${
              activeTab === 'results' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Results
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition ${
              activeTab === 'fees' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Fees
          </button>

          <button
            onClick={() => setActiveTab('admissions')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition relative ${
              activeTab === 'admissions' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Admissions
            {admissions.filter((a) => a.status === 'PENDING').length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-blue-900 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition ${
              activeTab === 'users' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff/Students
          </button>

          <button
            onClick={() => setActiveTab('pins')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition ${
              activeTab === 'pins' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> PINs
          </button>

          <button
            onClick={() => setActiveTab('cbt')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition ${
              activeTab === 'cbt' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" /> CBT
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 rounded font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 transition ${
              activeTab === 'security' ? 'bg-amber-500 text-slate-950 shadow-lg scale-105' : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Security & Audit
          </button>
        </div>
      </div>

      {/* TAB 1: SCHOOL BRANDING & CUSTOMIZATION */}
      {activeTab === 'branding' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>School Portal Customization & Identity</span>
            </h2>
            <p className="text-xs text-slate-500">
              Customize your School Name, Logo Upload, Theme Colors, Address, Motto, and Result Position settings.
            </p>
          </div>

          {brandingSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{brandingSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">School Name</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">School Motto</label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Primary Color</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-300">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                  <span className="font-mono text-slate-800 font-bold">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Secondary Gold Accent Color</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-300">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                  <span className="font-mono text-slate-800 font-bold">{secondaryColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">School Logo URL</label>
              <div className="flex items-center gap-3">
                <img src={logo} alt="School Logo" className="w-12 h-12 rounded object-cover border border-amber-400 bg-white shadow-sm" />
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="grow bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Full Campus Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Result Sheet Position Ranking Display</p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Choose whether student overall class position (e.g. 1st, 2nd, 3rd) should appear on the student report sheets and broadsheets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label
                  onClick={() => setShowPositionOnResult(true)}
                  className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 transition ${
                    showPositionOnResult
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center font-black text-xs ${
                    showPositionOnResult ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {showPositionOnResult ? '✓' : ''}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">SHOW Position on Results (✓)</p>
                    <p className="text-[10px] text-slate-500">Include student class position (e.g. 1st, 2nd) on report cards</p>
                  </div>
                </label>

                <label
                  onClick={() => setShowPositionOnResult(false)}
                  className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 transition ${
                    !showPositionOnResult
                      ? 'border-red-600 bg-red-50/80 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center font-black text-xs ${
                    !showPositionOnResult ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300'
                  }`}>
                    {!showPositionOnResult ? '✕' : ''}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">HIDE Position on Results (✕)</p>
                    <p className="text-[10px] text-slate-500">Omit position ranking completely from report cards</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-wider rounded shadow-sm transition flex items-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Save Branding Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SCHOOL FEES TRACKING & RECEIPT GENERATION */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Record Payment Form */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <span>Record Fee Payment & Generate Receipt</span>
                </h2>
                <p className="text-xs text-slate-500">Record student payments, track remaining balances, and issue PDF receipts.</p>
              </div>

              <button
                onClick={() => exportFeeReportToExcel(feePayments, school.name)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Fee Report (.xlsx)
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Student Reg Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRA/2026/002"
                  value={studentRegNoPay}
                  onChange={(e) => setStudentRegNoPay(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Amount Paid ($)</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-blue-900 font-bold font-mono focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="POS">POS Terminal</option>
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold uppercase tracking-wider rounded text-xs shadow-sm transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-amber-400" /> Record Payment & Issue PDF Receipt
                </button>
              </div>
            </form>
          </div>

          {/* Payment Ledgers Table */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Fee Payment Records</h3>
            <div className="overflow-x-auto text-xs border border-slate-200 rounded">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Student Name / RegNo</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Paid ($)</th>
                    <th className="p-3">Balance ($)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {feePayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-900">{p.receiptNo}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.studentRegNo}</div>
                      </td>
                      <td className="p-3 text-slate-700">{p.className}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">${p.amountPaid}</td>
                      <td className="p-3 font-mono font-bold text-red-600">${p.balanceRemaining}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedFeeReceipt(p)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold uppercase tracking-wider rounded text-xs flex items-center gap-1 ml-auto shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ONLINE ADMISSIONS QUEUE */}
      {activeTab === 'admissions' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <span>Online Admission Applications Queue</span>
              </h2>
              <p className="text-xs text-slate-500">Review prospective student applications and approve admissions.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-3">Applicant Name</th>
                  <th className="p-3">Class Applying</th>
                  <th className="p-3">Parent Contact Details</th>
                  <th className="p-3">Submitted Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-3">
                      <img src={adm.passportUrl} alt={adm.studentName} className="w-9 h-10 rounded object-cover border border-amber-400 shadow-sm" />
                      <div>
                        <div className="uppercase">{adm.studentName}</div>
                        <div className="text-[10px] text-slate-500">DOB: {adm.dob} ({adm.gender})</div>
                      </div>
                    </td>

                    <td className="p-3 font-bold text-blue-900">{adm.classApplying}</td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-800">
                        {adm.livingWith?.includes('Guardian')
                          ? adm.guardianName || adm.parentName || 'Guardian'
                          : adm.fatherName || adm.motherName || adm.parentName || 'Parents'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex flex-col">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase w-max my-0.5 ${
                          adm.livingWith?.includes('Guardian') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {adm.livingWith || 'Biological Parents'}
                        </span>
                        <span>Tel: {adm.parentPhone || adm.fatherPhone || adm.guardianPhone}</span>
                        <span className="text-emerald-700 font-bold">WhatsApp: {adm.parentWhatsapp || adm.guardianWhatsapp || adm.parentPhone}</span>
                      </div>
                    </td>

                    <td className="p-3 text-slate-500">{new Date(adm.submittedAt).toLocaleDateString()}</td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          adm.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedAdmissionSlip(adm)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded text-xs"
                        >
                          View Slip
                        </button>

                        <button
                          onClick={() => setEditingAdmission(adm)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded text-xs flex items-center gap-1 shadow-sm transition"
                          title="Edit & modify any field in this admission application"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        {adm.status === 'PENDING' && (
                          <button
                            onClick={() => handleApproveAdmission(adm.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded text-xs flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Admit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
              <Plus className="w-4 h-4 text-amber-500" /> Add New Staff / Student Account
            </h3>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Account Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-900"
                >
                  <option value="STUDENT">Student (Full Bio-Data & PIN)</option>
                  <option value="TEACHER">Teacher / Staff</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>

              {/* Student Registration Full Form */}
              {newUserRole === 'STUDENT' ? (
                <div className="space-y-4 pt-1 border-t border-slate-200">
                  {/* Photo Upload & Preview */}
                  <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {newUserAvatarUrl ? (
                        <div className="relative">
                          <img
                            src={newUserAvatarUrl}
                            alt="Student Preview"
                            className="w-12 h-14 rounded border border-blue-200 shadow-sm object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setNewUserAvatarUrl('')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-14 rounded border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <span className="block font-bold text-blue-900 uppercase text-[10px]">Student Photo</span>
                        <span className="text-[9px] text-slate-500">Passport portrait for ID card</span>
                      </div>
                    </div>
                    <label className="cursor-pointer bg-blue-900 hover:bg-blue-800 px-2.5 py-1.5 rounded text-[9px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition">
                      <Upload className="w-3 h-3 text-amber-400" />
                      <span>{newUserAvatarUrl ? 'Change' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={handleStudentPassportUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Student Full Name */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Student Full Name <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Emeka Obi"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900 font-medium"
                    />
                  </div>

                  {/* Auto Generate Student ID / Reg No */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                        Auto Generated Student ID <span className="text-amber-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomRegNo(autoGeneratedRegNo)}
                        className="text-[9px] text-blue-900 hover:underline font-bold flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Auto-Fill
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={autoGeneratedRegNo}
                        value={customRegNo || autoGeneratedRegNo}
                        onChange={(e) => setCustomRegNo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-blue-900 font-mono font-bold focus:outline-none focus:border-blue-900"
                      />
                      <span className="px-2 py-1.5 bg-blue-100 text-blue-950 font-bold text-[9px] rounded uppercase shrink-0">
                        Auto
                      </span>
                    </div>
                  </div>

                  {/* Gender & Class */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Gender <span className="text-amber-600">*</span>
                      </label>
                      <select
                        value={newUserGender}
                        onChange={(e) => setNewUserGender(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-900"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Assigned Class <span className="text-amber-600">*</span>
                      </label>
                      <select
                        value={newUserClass}
                        onChange={(e) => setNewUserClass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {DEFAULT_SCHOOL_CLASSES.map((group) => (
                          <optgroup key={group.category} label={group.category}>
                            {group.classes.map((cls) => (
                              <option key={cls} value={cls}>
                                {cls}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date of Admission & Religion */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Date of Admission
                      </label>
                      <input
                        type="date"
                        value={newUserAdmissionDate}
                        onChange={(e) => setNewUserAdmissionDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Religion
                      </label>
                      <select
                        value={newUserReligion}
                        onChange={(e) => setNewUserReligion(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-900"
                      >
                        <option value="Christianity">Christianity</option>
                        <option value="Islam">Islam</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Date of Birth & Auto Age */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={newUserDob}
                        onChange={(e) => setNewUserDob(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Auto Age
                      </label>
                      <div className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-slate-900 font-bold text-[11px] flex items-center justify-between">
                        <span>{studentAge > 0 ? `${studentAge} yrs` : 'Auto'}</span>
                        <span className="px-1.5 py-0.5 bg-blue-900 text-amber-300 text-[8px] font-black rounded uppercase">
                          Calculated
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nationality, State of Origin & Local Government (LGA) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Nationality
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nigerian"
                        value={newUserNationality}
                        onChange={(e) => setNewUserNationality(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-blue-900 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        State of Origin
                      </label>
                      <select
                        value={newUserStateOfOrigin}
                        onChange={(e) => handleUserStateChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-blue-900 text-xs"
                      >
                        {NIGERIAN_STATES_AND_LGAS.map((item) => (
                          <option key={item.state} value={item.state}>
                            {item.state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Local Govt (LGA)
                      </label>
                      <select
                        value={newUserLga}
                        onChange={(e) => setNewUserLga(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-blue-900 text-xs"
                      >
                        {(NIGERIAN_STATES_AND_LGAS.find((s) => s.state === newUserStateOfOrigin)?.lgas || []).map((lgaItem) => (
                          <option key={lgaItem} value={lgaItem}>
                            {lgaItem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Previous Academic Background */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-blue-900 tracking-wider block">
                      Previous Academic Background
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold text-[9px] uppercase tracking-wider mb-1">
                          Previous School Attended
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Corona Primary School"
                          value={newUserPreviousSchool}
                          onChange={(e) => setNewUserPreviousSchool(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold text-[9px] uppercase tracking-wider mb-1">
                          Last Class Attended
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Basic 6 / JSS 1"
                          value={newUserLastClassAttended}
                          onChange={(e) => setNewUserLastClassAttended(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resident Address */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Resident Address
                    </label>
                    <input
                      type="text"
                      placeholder="Street name, landmark and city"
                      value={newUserResidentAddress}
                      onChange={(e) => setNewUserResidentAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  {/* Differentiated Living Arrangement */}
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                    <label className="block text-amber-950 font-bold uppercase tracking-wider text-[10px]">
                      Living Arrangement (Caregiver Status)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Biological Parents', 'Father Only', 'Mother Only', 'Guardian / Relative'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setNewUserLivingWith(opt)}
                          className={`p-1.5 rounded border text-center font-bold text-[10px] transition ${
                            newUserLivingWith === opt
                              ? 'bg-blue-900 text-amber-300 border-blue-950 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-blue-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biological Parents Sub-Section */}
                  <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-200 space-y-2">
                    <span className="block font-bold text-blue-900 uppercase text-[10px]">👨‍👩‍👦 Biological Parents Info</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Father's Full Name"
                        value={newUserFatherName}
                        onChange={(e) => setNewUserFatherName(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] text-slate-800"
                      />
                      <input
                        type="tel"
                        placeholder="Father's Phone"
                        value={newUserFatherPhone}
                        onChange={(e) => setNewUserFatherPhone(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Mother's Full Name"
                        value={newUserMotherName}
                        onChange={(e) => setNewUserMotherName(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] text-slate-800"
                      />
                      <input
                        type="tel"
                        placeholder="Mother's Phone"
                        value={newUserMotherPhone}
                        onChange={(e) => setNewUserMotherPhone(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] font-mono"
                      />
                    </div>
                  </div>

                  {/* Guardian / Guidance Sub-Section */}
                  <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200 space-y-2">
                    <span className="block font-bold text-emerald-900 uppercase text-[10px]">🤝 Guardian / Guidance Details</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Guardian Full Name"
                        value={newUserGuardianName}
                        onChange={(e) => setNewUserGuardianName(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] text-slate-800"
                      />
                      <select
                        value={newUserGuardianRelationship}
                        onChange={(e) => setNewUserGuardianRelationship(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] font-bold"
                      >
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Grandparent">Grandparent</option>
                        <option value="Elder Sibling">Elder Sibling</option>
                        <option value="Foster Parent">Foster Parent</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Other Relative">Other Relative</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Guardian Phone"
                        value={newUserGuardianPhone}
                        onChange={(e) => setNewUserGuardianPhone(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] font-mono"
                      />
                      <input
                        type="tel"
                        placeholder="Guardian WhatsApp"
                        value={newUserGuardianWhatsapp}
                        onChange={(e) => setNewUserGuardianWhatsapp(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] font-mono"
                      />
                    </div>
                  </div>

                  {/* Primary Notifications & Login PIN */}
                  <div className="space-y-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Primary SMS / Notification Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="Primary phone number (+234)"
                        value={newUserParentPhone}
                        onChange={(e) => setNewUserParentPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Student Portal Login PIN (4-Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 4821"
                        value={newUserStudentPin}
                        onChange={(e) => setNewUserStudentPin(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-blue-900 font-mono font-bold tracking-widest focus:outline-none focus:border-blue-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-Student Staff/Parent Form */
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mr. John Doe"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="staff@school.edu"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  {newUserRole === 'TEACHER' && (
                    <div className="space-y-2 p-3 bg-slate-100/80 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                          Assign Multiple Classes to Teacher
                        </label>
                        <span className="text-[10px] font-mono font-bold bg-blue-900 text-amber-300 px-2 py-0.5 rounded-full">
                          {newUserAssignedClasses.length} Selected
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Click classes below to assign or unassign this teacher to multiple arms/grades.
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {DEFAULT_SCHOOL_CLASSES.map((grp) => (
                          <div key={grp.category} className="bg-white p-2 rounded-lg border border-slate-200">
                            <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                              {grp.category}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {grp.classes.map((cls) => {
                                const isSelected = newUserAssignedClasses.includes(cls);
                                return (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => {
                                      setNewUserAssignedClasses((prev) =>
                                        prev.includes(cls)
                                          ? prev.filter((c) => c !== cls)
                                          : [...prev, cls]
                                      );
                                    }}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                                      isSelected
                                        ? 'bg-blue-900 text-amber-300 shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    {cls} {isSelected && '✓'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                id="btn-register-student-account"
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black uppercase tracking-wider rounded text-xs shadow-sm mt-3 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>{newUserRole === 'STUDENT' ? 'Enroll & Register Student' : 'Create Staff Account'}</span>
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">
                School User Directory ({users.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setResetUserTarget(null);
                  setIsResetModalOpen(true);
                }}
                className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-[10px] uppercase rounded-lg flex items-center gap-1.5 transition shadow-xs"
                title="Reset password for any user and dispatch via email/SMS"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset User Password</span>
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {users.map((u) => (
                <div key={u.id} className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl || (u.role === 'STUDENT' ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300 shadow-xs"
                    />
                    <div>
                      <div className="font-bold text-slate-900 uppercase flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.role === 'STUDENT' && u.className && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded font-mono text-[9px] font-bold">
                            {u.className}
                          </span>
                        )}
                        {u.role === 'TEACHER' && (
                          <div className="flex flex-wrap items-center gap-1">
                            {(u.assignedClasses && u.assignedClasses.length > 0 ? u.assignedClasses : [u.className || 'All Classes']).map((c) => (
                              <span key={c} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded font-mono text-[9px] font-bold">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        {u.role === 'STUDENT' && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            u.livingWith?.includes('Guardian') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            {u.livingWith ? `Living: ${u.livingWith}` : 'Parents'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="font-bold text-slate-700">{u.regNo}</span>
                        {u.role === 'STUDENT' ? (
                          <>
                            {u.gender && <span>• {u.gender}</span>}
                            {u.age && <span>• {u.age} yrs</span>}
                            {u.studentPin && <span className="text-blue-900 font-bold">• PIN: {u.studentPin}</span>}
                            {u.parentPhone && <span className="text-emerald-700 font-bold">• Phone: {u.parentPhone}</span>}
                          </>
                        ) : (
                          u.email && <span> • {u.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {u.role === 'TEACHER' && (
                      <button
                        onClick={() => setEditingTeacherClasses(u)}
                        className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-[9px] uppercase rounded flex items-center gap-1 transition shadow-xs"
                        title="Assign or update teacher classes"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" /> Assign Classes ({u.assignedClasses?.length || 1})
                      </button>
                    )}
                    {u.role === 'STUDENT' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingStudent(u)}
                          className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] uppercase rounded flex items-center gap-1 transition shadow-xs"
                          title="Edit Student Bio-Data, Parent & Guardian Details"
                        >
                          <Edit3 className="w-3 h-3 text-slate-950" /> Edit
                        </button>
                        <button
                          onClick={() => setPreviewStudent(u)}
                          className="px-2 py-1 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-[9px] uppercase rounded flex items-center gap-1 transition"
                          title="Preview Official Report Card"
                        >
                          <Eye className="w-3 h-3" /> Result
                        </button>
                        <button
                          onClick={() => setWhatsAppStudent(u)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[9px] uppercase rounded flex items-center gap-1 transition"
                          title="Send Result to Parent via WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-200" /> WhatsApp
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setResetUserTarget(u);
                        setIsResetModalOpen(true);
                      }}
                      className="px-2 py-1 bg-slate-200 hover:bg-amber-100 hover:text-amber-950 text-slate-700 font-bold text-[9px] uppercase rounded flex items-center gap-1 transition"
                      title={`Reset password for ${u.name} and send to email/phone`}
                    >
                      <KeyRound className="w-3 h-3 text-amber-600" /> Reset
                    </button>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900 text-amber-300 uppercase tracking-wider">
                      {u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RESULT PINS */}
      {activeTab === 'pins' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>Result Checking Scratch Card PIN Generator</span>
              </h2>
              <p className="text-xs text-slate-500">Generate 12-digit PIN codes for students/parents to check results online.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={pinCountToGenerate}
                onChange={(e) => setPinCountToGenerate(Number(e.target.value))}
                className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-center text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-900 font-bold"
              />
              <button
                onClick={handleGeneratePins}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-wider rounded text-xs shadow-sm"
              >
                + Generate PINs
              </button>
            </div>
          </div>

          {pinSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold">
              {pinSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pins.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-mono text-blue-900 font-bold text-sm block">{p.pinCode}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Uses: {p.usesCount} / {p.maxUses}</span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.isUsed ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                  {p.isUsed ? 'USED' : 'UNUSED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CBT EXAMS MANAGEMENT */}
      {activeTab === 'cbt' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-amber-500" />
                <span>CBT Computer Based Test Management</span>
              </h2>
              <p className="text-xs text-slate-500">Create and manage online exams, set durations, and add multiple-choice questions.</p>
            </div>

            <button
              onClick={() => setIsCreatingCbt(true)}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-wider rounded text-xs shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New CBT Exam
            </button>
          </div>

          {cbtExams.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded space-y-3">
              <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">No CBT Exams Created Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Start by clicking the "Create New CBT Exam" button to define your first online test for students.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cbtExams.map((exam) => (
                <div key={exam.id} className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-tight text-sm leading-tight">{exam.title}</h4>
                      <div className="text-[10px] text-blue-900 font-bold uppercase tracking-widest mt-1">{exam.subject} • {exam.className}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                    <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> {exam.questions.length} Questions
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-1.5">
                      <Settings className="w-3 h-3 text-blue-500" /> {exam.durationMinutes} Minutes
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 mt-2">
                    <span className="text-[9px] text-slate-400 font-mono">ID: {exam.id.slice(-8)}</span>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this CBT exam?')) {
                          storageService.deleteCbtExam(exam.id);
                          window.location.reload();
                        }
                      }}
                      className="text-red-500 hover:text-red-700 font-bold uppercase text-[9px]"
                    >
                      Delete Exam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: RESULTS MANAGEMENT & BROADSHEET */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Class & Subject Selector Bar */}
          <div className="bg-white border border-slate-200 p-5 rounded shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Select Class</label>
                <select
                  value={selectedClassRes}
                  onChange={(e) => setSelectedClassRes(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900 shadow-sm"
                >
                  {DEFAULT_SCHOOL_CLASSES.map((group) => (
                    <optgroup key={group.category} label={group.category}>
                      {group.classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Subject</label>
                <select
                  value={selectedSubjectRes}
                  onChange={(e) => setSelectedSubjectRes(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900 shadow-sm"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Basic Science">Basic Science</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Studies / ICT">Computer Studies / ICT</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Economics">Economics</option>
                  <option value="Financial Accounting">Financial Accounting</option>
                  <option value="Government">Government</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Term</label>
                <select
                  value={selectedTermRes}
                  onChange={(e) => setSelectedTermRes(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900 shadow-sm"
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">Class Enrollment</span>
              <span className="font-black text-amber-600 text-sm tracking-tight">{studentsInClass.length} Students</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <span>Manual Score Entry & Position Calculation</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  {selectedClassRes} • {selectedSubjectRes} • {selectedTermRes}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => downloadResultTemplate(selectedClassRes, selectedSubjectRes, studentsInClass)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-widest rounded text-[10px] flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" /> Template
                </button>
                <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-widest rounded text-[10px] flex items-center gap-1.5 transition">
                  <Upload className="w-4 h-4" /> Import Excel
                  <input type="file" accept=".xlsx, .xls" onChange={handleExcelFileUpload} className="hidden" />
                </label>
                <button
                  onClick={handleSaveManualResults}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-widest rounded shadow-sm transition flex items-center gap-2 text-[11px]"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Save Scores
                </button>
              </div>
            </div>

            {saveMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{saveMsg}</span>
              </div>
            )}

            {excelSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{excelSuccessMsg}</span>
              </div>
            )}

            {parsedExcelRows.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Reviewing {parsedExcelRows.length} Parsed Excel Rows</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setParsedExcelRows([])} className="text-xs font-bold text-slate-500 uppercase">Cancel</button>
                    <button onClick={handleSaveExcelRows} className="px-4 py-1.5 bg-amber-600 text-white rounded font-bold uppercase text-[10px] shadow-sm">Confirm Import</button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">CA (40)</th>
                    <th className="p-3 text-center">EXAM (60)</th>
                    <th className="p-3 text-center text-blue-900 font-bold">TOTAL</th>
                    <th className="p-3 text-center">GRADE</th>
                    {school.showPositionOnResult !== false && <th className="p-3 text-center">POSITION</th>}
                    <th className="p-3 text-center">ACTIONS / WHATSAPP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {studentsInClass.length === 0 ? (
                    <tr>
                      <td colSpan={school.showPositionOnResult !== false ? 8 : 7} className="p-8 text-center text-slate-500 italic">No students found in {selectedClassRes}</td>
                    </tr>
                  ) : (
                    studentsInClass.map((s) => {
                      const scores = getStudentScore(s.regNo);
                      const calc = calculateTotalAndGrade(scores.ca, scores.exam);
                      const savedRes = currentResults.find((r) => r.studentRegNo === s.regNo);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 uppercase tracking-tight">{s.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{s.regNo}</div>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={40}
                              value={scores.ca}
                              onChange={(e) => handleScoreChange(s.regNo, 'ca', Number(e.target.value))}
                              className="w-16 bg-white border border-slate-300 rounded p-1.5 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={60}
                              value={scores.exam}
                              onChange={(e) => handleScoreChange(s.regNo, 'exam', Number(e.target.value))}
                              className="w-16 bg-white border border-slate-300 rounded p-1.5 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                            />
                          </td>

                          <td className="p-3 text-center font-black text-blue-900 bg-blue-50/30 text-xs">
                            {calc.total}
                          </td>

                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                              calc.grade === 'A' ? 'bg-emerald-500 text-white' : 
                              calc.grade === 'F' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                            }`}>
                              {calc.grade}
                            </span>
                          </td>

                          {school.showPositionOnResult !== false && (
                            <td className="p-3 text-center font-bold text-slate-700">
                              {savedRes?.position ? `#${savedRes.position}` : '-'}
                            </td>
                          )}

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setEditReportStudent(s)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded shadow-sm flex items-center gap-1 transition"
                                title="Edit Full Student Report Card Details (Attendance, Dates, Domain Traits, All Scores)"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Report
                              </button>
                              <button
                                onClick={() => setPreviewStudent(s)}
                                className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-[10px] uppercase rounded shadow-sm flex items-center gap-1 transition"
                                title="Preview Official Student Report Card"
                              >
                                <Eye className="w-3.5 h-3.5" /> Preview
                              </button>
                              <button
                                onClick={() => setWhatsAppStudent(s)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase rounded shadow-sm flex items-center gap-1 transition"
                                title="Send Result Card via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-200" /> WhatsApp
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="text-[10px] text-slate-500 italic font-medium max-w-md">
                💡 <strong>Admin Tip:</strong> Results entered here are instantly available for parents/students to check using their scratch card PINs or via direct WhatsApp dispatch.
              </div>
              <PrintButton label="Print Class Broadsheet" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SECURITY, MASTER PIN & AUDIT TRAIL */}
      {activeTab === 'security' && (
        <SecurityAndAuditTab school={school} />
      )}

      {/* Student Report Card Full Editor Modal */}
      <StudentReportEditorModal
        isOpen={!!editReportStudent}
        onClose={() => setEditReportStudent(null)}
        school={school}
        student={editReportStudent}
        term={selectedTermRes}
        session={selectedSessionRes}
        onSaved={() => {
          // refresh data if needed
        }}
      />

      {/* Result Preview Modal */}
      <StudentResultPreviewModal
        isOpen={!!previewStudent}
        onClose={() => setPreviewStudent(null)}
        school={school}
        student={previewStudent}
        term={selectedTermRes}
        session={selectedSessionRes}
      />

      {/* WhatsApp Dispatch Modal */}
      <WhatsAppShareModal
        isOpen={!!whatsAppStudent}
        onClose={() => setWhatsAppStudent(null)}
        school={school}
        student={whatsAppStudent || { regNo: '', name: '' }}
        results={
          whatsAppStudent
            ? storageService.getResults(school.id).filter((r) => r.studentRegNo === whatsAppStudent.regNo && r.term === selectedTermRes && r.session === selectedSessionRes)
            : []
        }
        term={selectedTermRes}
        session={selectedSessionRes}
      />

      {/* Edit Student Bio-Data, Parent & Guardian Profile Modal */}
      <EditStudentProfileModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        school={school}
        onSaved={(updated) => {
          setEditingStudent(null);
        }}
      />

      {/* Edit Teacher Multiple Classes Assignment Modal */}
      <EditTeacherClassesModal
        isOpen={!!editingTeacherClasses}
        onClose={() => setEditingTeacherClasses(null)}
        teacher={editingTeacherClasses}
        onSaved={(updated) => {
          setEditingTeacherClasses(null);
        }}
      />

      {/* Admin Password Reset & Dispatch Modal */}
      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setResetUserTarget(null);
        }}
        defaultSchool={school}
        initialIdentifier={resetUserTarget?.email || resetUserTarget?.regNo || ''}
      />
    </div>
  );
};
