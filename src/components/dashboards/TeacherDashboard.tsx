import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  FileSpreadsheet,
  Plus,
  Upload,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Save,
  Users,
  Award,
  Eye,
  MessageCircle,
  Edit,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { CbtAttempt, CbtExam, School, StudentResult, User } from '../../types';
import { DEFAULT_SCHOOL_CLASSES } from '../../constants/classes';
import { CbtCreator } from '../cbt/CbtCreator';
import { CbtAttemptDetailsModal } from '../cbt/CbtAttemptDetailsModal';
import { StudentResultPreviewModal } from '../results/StudentResultPreviewModal';
import { StudentReportEditorModal } from '../results/StudentReportEditorModal';
import { WhatsAppShareModal } from '../results/WhatsAppShareModal';
import { calculateTotalAndGrade } from '../../utils/calcUtils';
import { downloadResultTemplate, parseResultExcel, ParsedExcelResult } from '../../utils/excelUtils';
import { PrintButton } from '../common/PrintButton';

interface TeacherDashboardProps {
  school: School;
  teacher: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ school, teacher }) => {
  const [activeTab, setActiveTab] = useState<'results' | 'cbt-promote' | 'excel' | 'cbt' | 'broadsheet'>('results');
  const [isCreatingCbt, setIsCreatingCbt] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<any | null>(null);
  const [editReportStudent, setEditReportStudent] = useState<any | null>(null);
  const [whatsAppStudent, setWhatsAppStudent] = useState<any | null>(null);
  const [selectedCbtAttemptForModal, setSelectedCbtAttemptForModal] = useState<CbtAttempt | null>(null);
  const [selectedCbtExamForModal, setSelectedCbtExamForModal] = useState<CbtExam | null>(null);
  const [cbtSearchTerm, setCbtSearchTerm] = useState('');

  // Class & Subject filters
  const teacherAssignedClasses =
    teacher.assignedClasses && teacher.assignedClasses.length > 0
      ? teacher.assignedClasses
      : [teacher.className || 'JSS 1A'];

  const [selectedClass, setSelectedClass] = useState(
    teacherAssignedClasses[0] || teacher.className || 'JSS 1A'
  );
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2025/2026');

  // Excel bulk upload state
  const [parsedExcelRows, setParsedExcelRows] = useState<ParsedExcelResult[]>([]);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState('');

  // Save feedback
  const [saveMsg, setSaveMsg] = useState('');
  const [, setDataVersion] = useState(0);

  useEffect(() => {
    return storageService.subscribe(() => {
      setDataVersion((v) => v + 1);
    });
  }, []);

  const cbtExams = storageService.getCbtExams(school.id).filter((e) => e.teacherId === teacher.id || e.className === selectedClass);
  const cbtAttempts = storageService.getCbtAttempts(school.id);
  const allResults = storageService.getResults(school.id);
  const students = storageService.getUsers().filter((u) => u.schoolId === school.id && u.role === 'STUDENT' && u.className === selectedClass);

  // Filtered results for this class + subject + term + session
  const currentResults = allResults.filter(
    (r) =>
      r.className === selectedClass &&
      r.subject === selectedSubject &&
      r.term === selectedTerm &&
      r.session === selectedSession
  );

  // CBT Attempts for current class & subject
  const currentCbtAttempts = cbtAttempts.filter((a) => {
    const exam = cbtExams.find((e) => e.id === a.examId);
    return (
      (a.studentRegNo.startsWith('CRA') || a.studentRegNo.length > 0) &&
      (exam ? exam.className === selectedClass && exam.subject === selectedSubject : true)
    );
  });

  // Form score state for manual result entry
  const [manualScores, setManualScores] = useState<
    Record<string, { ca: number; exam: number }>
  >({});

  // Initialize or update local form state
  const getStudentScore = (regNo: string) => {
    if (manualScores[regNo]) return manualScores[regNo];
    const existing = currentResults.find((r) => r.studentRegNo === regNo);
    return {
      ca: existing ? existing.ca : 28,
      exam: existing ? existing.exam : 45,
    };
  };

  const handleScoreChange = (regNo: string, field: 'ca' | 'exam', value: number) => {
    const current = getStudentScore(regNo);
    setManualScores((prev) => ({
      ...prev,
      [regNo]: { ...current, [field]: value },
    }));
  };

  // Promote single CBT attempt to result sheet
  const handlePromoteCbtAttempt = (attempt: CbtAttempt) => {
    const regNo = attempt.studentRegNo;
    const scores = getStudentScore(regNo);
    const promotedExamScore = Math.min(60, Math.round(attempt.score));
    const calc = calculateTotalAndGrade(scores.ca, promotedExamScore);

    const updatedRes: StudentResult = {
      id: `res-${regNo.replace(/\//g, '')}-${selectedSubject}-${selectedTerm}`,
      schoolId: school.id,
      studentRegNo: regNo,
      studentName: attempt.studentName,
      className: selectedClass,
      term: selectedTerm,
      session: selectedSession,
      subject: selectedSubject,
      ca: scores.ca,
      exam: promotedExamScore,
      total: calc.total,
      grade: calc.grade,
      remark: `CBT Promoted (${attempt.score}/${attempt.maxScore})`,
      cbtScore: attempt.score,
    };

    storageService.saveResult(updatedRes);
    setManualScores((prev) => ({
      ...prev,
      [regNo]: { ...scores, exam: promotedExamScore },
    }));
    setSaveMsg(`CBT Score for ${attempt.studentName} (${attempt.score}/${attempt.maxScore}) promoted to report card!`);
    setTimeout(() => setSaveMsg(''), 3500);
  };

  // Promote ALL CBT attempts in class
  const handlePromoteAllCbtAttempts = () => {
    if (currentCbtAttempts.length === 0) return;
    currentCbtAttempts.forEach((a) => {
      handlePromoteCbtAttempt(a);
    });
    setSaveMsg(`Promoted all ${currentCbtAttempts.length} student CBT scores to class report card sheet!`);
    setTimeout(() => setSaveMsg(''), 3500);
  };

  const handleSaveManualResults = () => {
    const updatedList: StudentResult[] = students.map((s) => {
      const scores = getStudentScore(s.regNo);
      const calc = calculateTotalAndGrade(scores.ca, scores.exam);

      return {
        id: `res-${s.regNo.replace(/\//g, '')}-${selectedSubject}-${selectedTerm}`,
        schoolId: school.id,
        studentRegNo: s.regNo,
        studentName: s.name,
        className: selectedClass,
        term: selectedTerm,
        session: selectedSession,
        subject: selectedSubject,
        ca: calc.ca,
        exam: calc.exam,
        total: calc.total,
        grade: calc.grade,
        remark: calc.remark,
      };
    });

    storageService.bulkSaveResults(updatedList);
    setSaveMsg(`Results for ${students.length} students in ${selectedSubject} saved & positions calculated!`);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // Handle Excel File Drop
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseResultExcel(file);
      setParsedExcelRows(parsed);
    } catch (err) {
      alert('Error reading Excel file. Please ensure valid .xlsx format.');
    }
  };

  const handleSaveExcelRows = () => {
    const validRows = parsedExcelRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newResults: StudentResult[] = validRows.map((r) => ({
      id: `res-${r.studentRegNo.replace(/\//g, '')}-${selectedSubject}-${selectedTerm}`,
      schoolId: school.id,
      studentRegNo: r.studentRegNo,
      studentName: r.studentName,
      className: selectedClass,
      term: selectedTerm,
      session: selectedSession,
      subject: selectedSubject,
      ca: r.ca,
      exam: r.exam,
      total: r.total,
      grade: r.grade,
      remark: r.remark,
    }));

    storageService.bulkSaveResults(newResults);
    setExcelSuccessMsg(`Successfully imported ${validRows.length} student scores from Excel!`);
    setParsedExcelRows([]);
    setTimeout(() => setExcelSuccessMsg(''), 3000);
  };

  if (isCreatingCbt) {
    return (
      <CbtCreator
        school={school}
        teacher={teacher}
        onSaved={() => setIsCreatingCbt(false)}
        onCancel={() => setIsCreatingCbt(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Teacher Banner */}
      <div className="bg-blue-900 border-b-4 border-amber-500 rounded p-6 shadow-sm text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-950 text-amber-400 border border-amber-500/40 rounded shadow-sm">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">Teacher Portal • {teacher.name}</h1>
              <span className="px-2 py-0.5 bg-amber-400 text-blue-950 font-black text-[10px] rounded-full uppercase">
                {teacherAssignedClasses.length} {teacherAssignedClasses.length === 1 ? 'Class' : 'Classes'} Assigned
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Create CBT exams, record CA/Exam scores, bulk import Excel results, and print broadsheets.
            </p>
            {/* Quick Assigned Classes Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">My Classes:</span>
              {teacherAssignedClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    selectedClass === cls
                      ? 'bg-amber-400 text-blue-950 shadow-xs ring-2 ring-white/40'
                      : 'bg-blue-800/80 hover:bg-blue-700 text-blue-100'
                  }`}
                >
                  {cls} {selectedClass === cls && '★'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-blue-950 p-1.5 rounded border border-blue-800 text-xs">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition ${
              activeTab === 'results' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Manual Result Entry
          </button>

          <button
            onClick={() => setActiveTab('cbt-promote')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition relative ${
              activeTab === 'cbt-promote' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> CBT Test Scores & Promotion
            {currentCbtAttempts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-slate-950 font-black">
                {currentCbtAttempts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition ${
              activeTab === 'excel' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Excel Upload
          </button>

          <button
            onClick={() => setActiveTab('cbt')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition ${
              activeTab === 'cbt' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" /> CBT Exams
          </button>

          <button
            onClick={() => setActiveTab('broadsheet')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition ${
              activeTab === 'broadsheet' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> Class Broadsheet
          </button>
        </div>
      </div>

      {/* Class & Subject Selector Bar */}
      <div className="bg-white border border-slate-200 p-5 rounded shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Select Class (My Classes First)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900 shadow-sm"
            >
              <optgroup label="🌟 My Assigned Classes">
                {teacherAssignedClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} (Assigned)
                  </option>
                ))}
              </optgroup>
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
            <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Subject Domain</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900 shadow-sm"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="English Language">English Language</option>
              <option value="Basic Science">Basic Science</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Agricultural Science">Agricultural Science</option>
              <option value="Social Studies">Social Studies</option>
              <option value="Civic Education">Civic Education</option>
              <option value="Computer Studies / ICT">Computer Studies / ICT</option>
              <option value="Economics">Economics</option>
              <option value="Financial Accounting">Financial Accounting</option>
              <option value="Commerce">Commerce</option>
              <option value="Government">Government</option>
              <option value="Literature in English">Literature in English</option>
              <option value="Christian Religious Knowledge">Christian Religious Knowledge</option>
              <option value="Islamic Religious Knowledge">Islamic Religious Knowledge</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Academic Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
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
          <span className="font-black text-amber-600 text-sm tracking-tight">{students.length} Students Enrolled</span>
        </div>
      </div>

      {/* TAB 1: MANUAL RESULT ENTRY WITH AUTO TOTAL, GRADE & POSITION */}
      {activeTab === 'results' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                <span>Manual Result Entry Score Sheet</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                {selectedClass} • {selectedSubject} • {selectedTerm}
              </p>
            </div>

            <button
              onClick={handleSaveManualResults}
              id="btn-save-manual-results"
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-widest rounded shadow-sm transition flex items-center gap-2 text-[11px]"
            >
              <Save className="w-4 h-4 text-amber-400" /> Save & Update Positions
            </button>
          </div>

          {saveMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{saveMsg}</span>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-3">Student RegNo & Name</th>
                  <th className="p-3 text-center">CA (0-40)</th>
                  <th className="p-3 text-center">EXAM (0-60)</th>
                  <th className="p-3 text-center text-blue-900 font-bold">TOTAL (100)</th>
                  <th className="p-3 text-center">GRADE</th>
                  {school.showPositionOnResult !== false && <th className="p-3 text-center">POS</th>}
                  <th className="p-3">REMARK / SOURCE</th>
                  <th className="p-3 text-center">REPORT CARD & WHATSAPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students.map((s) => {
                  const scores = getStudentScore(s.regNo);
                  const calc = calculateTotalAndGrade(scores.ca, scores.exam);
                  const savedRes = currentResults.find((r) => r.studentRegNo === s.regNo);
                  const isCbtPromoted = savedRes?.cbtScore !== undefined;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 uppercase tracking-tight text-[11px]">{s.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono tracking-tighter">{s.regNo}</div>
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={scores.ca}
                          onChange={(e) => handleScoreChange(s.regNo, 'ca', Number(e.target.value))}
                          className="w-16 bg-white border border-slate-300 rounded p-1.5 text-center font-mono font-black text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={scores.exam}
                          onChange={(e) => handleScoreChange(s.regNo, 'exam', Number(e.target.value))}
                          className="w-16 bg-white border border-slate-300 rounded p-1.5 text-center font-mono font-black text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                        />
                      </td>

                      <td className="p-3 text-center font-mono font-black text-blue-900 text-xs bg-blue-50/30">
                        {calc.total}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            calc.grade === 'A'
                              ? 'bg-emerald-500 text-white'
                              : calc.grade === 'B'
                              ? 'bg-blue-500 text-white'
                              : calc.grade === 'C'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {calc.grade}
                        </span>
                      </td>

                      {school.showPositionOnResult !== false && (
                        <td className="p-3 text-center font-bold text-slate-700">
                          #{savedRes?.position || '-'}
                        </td>
                      )}

                      <td className="p-3">
                        {isCbtPromoted ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CBT Promoted
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">{calc.remark}</span>
                        )}
                      </td>

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
                            title="Preview Official Report Card"
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CBT PROMOTED SYSTEM */}
      {activeTab === 'cbt-promote' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>CBT Promoted System (Auto & Manual CBT Score Promotion)</span>
              </h2>
              <p className="text-xs text-slate-500">
                View student CBT test results for <strong className="text-blue-900">{selectedClass} ({selectedSubject})</strong> and promote scores directly into student terminal report card sheets.
              </p>
            </div>

            {currentCbtAttempts.length > 0 && (
              <button
                onClick={handlePromoteAllCbtAttempts}
                id="btn-promote-all-cbt"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase tracking-wider rounded shadow-sm transition flex items-center gap-2 text-xs"
              >
                <Award className="w-4 h-4 text-amber-300" /> Promote All ({currentCbtAttempts.length}) CBT Scores
              </button>
            )}
          </div>

          {saveMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{saveMsg}</span>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-slate-700 text-xs leading-relaxed space-y-1">
            <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              💡 How the CBT Promoted System Works:
            </h4>
            <p>
              1. When students complete a Computer Based Test (CBT), their submission is instantly recorded.
            </p>
            <p>
              2. Click <strong>"Promote CBT Score to Report Card"</strong> below to transfer any student's CBT marks directly into their main Exam score field for {selectedSubject}.
            </p>
            <p>
              3. Promoted scores automatically combine with Continuous Assessment (CA) to calculate Total, Grade, Remark, and Class Position.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase">Search Candidates:</span>
              <input
                type="text"
                value={cbtSearchTerm}
                onChange={(e) => setCbtSearchTerm(e.target.value)}
                placeholder="Search student name or reg no..."
                className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-900 w-64 shadow-xs"
              />
              {cbtSearchTerm && (
                <button onClick={() => setCbtSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-700">Clear</button>
              )}
            </div>
            <div className="text-xs font-bold text-slate-600">
              Showing <span className="text-blue-900 font-black">{currentCbtAttempts.filter((a) => !cbtSearchTerm || a.studentName.toLowerCase().includes(cbtSearchTerm.toLowerCase()) || a.studentRegNo.toLowerCase().includes(cbtSearchTerm.toLowerCase())).length}</span> submissions for {selectedClass} • {selectedSubject}
            </div>
          </div>

          {currentCbtAttempts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded space-y-2">
              <FileQuestion className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No CBT attempts submitted yet for {selectedClass} • {selectedSubject}</p>
              <p className="text-xs text-slate-500">When students complete their CBT exams, their results will appear here ready for promotion.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Student Name & Reg No</th>
                    <th className="p-3">Exam Title</th>
                    <th className="p-3 text-center">Score Achieved</th>
                    <th className="p-3 text-center">Percentage</th>
                    <th className="p-3 text-center">Promotion Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentCbtAttempts
                    .filter(
                      (a) =>
                        !cbtSearchTerm ||
                        a.studentName.toLowerCase().includes(cbtSearchTerm.toLowerCase()) ||
                        a.studentRegNo.toLowerCase().includes(cbtSearchTerm.toLowerCase())
                    )
                    .map((att) => {
                      const savedRes = currentResults.find((r) => r.studentRegNo === att.studentRegNo);
                      const isPromoted = savedRes && savedRes.cbtScore !== undefined;

                      return (
                        <tr key={att.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 uppercase">{att.studentName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{att.studentRegNo}</div>
                          </td>

                          <td className="p-3 font-semibold text-slate-800">{att.examTitle}</td>

                          <td className="p-3 text-center font-mono font-bold text-blue-900">
                            {att.score} / {att.maxScore}
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-emerald-700">
                            {att.percentage}%
                          </td>

                          <td className="p-3 text-center">
                            {isPromoted ? (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Promoted to Report Card
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
                                Pending Promotion
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const exam = cbtExams.find((e) => e.id === att.examId);
                                  setSelectedCbtAttemptForModal(att);
                                  setSelectedCbtExamForModal(exam || null);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold uppercase tracking-wider rounded text-[10px] shadow-sm transition flex items-center gap-1"
                                title="View candidate detailed answers and solutions"
                              >
                                <Eye className="w-3.5 h-3.5" /> Answers
                              </button>
                              <button
                                onClick={() => handlePromoteCbtAttempt(att)}
                                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold uppercase tracking-wider rounded text-[10px] shadow-sm transition"
                              >
                                Promote
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK EXCEL RESULT UPLOAD */}
      {activeTab === 'excel' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <span>Bulk Result Upload via Excel Spreadsheet</span>
              </h2>
              <p className="text-xs text-slate-500">Download pre-filled class template, populate marks offline, and upload.</p>
            </div>

            <button
              onClick={() => downloadResultTemplate(selectedClass, selectedSubject, students)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold uppercase tracking-wider rounded text-xs flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Class Excel Template (.xlsx)
            </button>
          </div>

          {excelSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{excelSuccessMsg}</span>
            </div>
          )}

          {/* Upload Drop Area */}
          <div className="p-8 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded bg-slate-50 text-center space-y-3 transition">
            <Upload className="w-10 h-10 text-amber-500 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Upload Populated Excel File (.xlsx)</h3>
              <p className="text-xs text-slate-500">Drag & drop your excel file here, or click to browse</p>
            </div>

            <label className="inline-block cursor-pointer px-5 py-2 bg-blue-900 hover:bg-blue-800 font-bold uppercase tracking-wider text-amber-300 rounded text-xs">
              <span>Select Excel File</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleExcelFileUpload} className="hidden" />
            </label>
          </div>

          {/* Parsed Excel Review Table */}
          {parsedExcelRows.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">
                  Parsed Results Preview ({parsedExcelRows.length} Rows)
                </h3>
                <button
                  onClick={handleSaveExcelRows}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded text-xs flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Confirm & Import Scores to Database
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                      <th className="p-2.5">RegNo</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5 text-center">CA (40)</th>
                      <th className="p-2.5 text-center">Exam (60)</th>
                      <th className="p-2.5 text-center text-blue-900">Total</th>
                      <th className="p-2.5 text-center">Grade</th>
                      <th className="p-2.5">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedExcelRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-blue-900 font-bold">{r.studentRegNo}</td>
                        <td className="p-2.5 font-bold text-slate-900 uppercase">{r.studentName}</td>
                        <td className="p-2.5 text-center font-mono">{r.ca}</td>
                        <td className="p-2.5 text-center font-mono">{r.exam}</td>
                        <td className="p-2.5 text-center font-black font-mono text-blue-900">{r.total}</td>
                        <td className="p-2.5 text-center font-bold">{r.grade}</td>
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                              <AlertCircle className="w-3.5 h-3.5" /> {r.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CBT EXAMS MANAGEMENT */}
      {activeTab === 'cbt' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-amber-500" />
                <span>Computer Based Tests (CBT) Center</span>
              </h2>
              <p className="text-xs text-slate-500">Create tests with options A-D, timers, and automatic instant grading.</p>
            </div>

            <button
              onClick={() => setIsCreatingCbt(true)}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-wider rounded text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Create New CBT Exam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cbtExams.map((e) => (
              <div key={e.id} className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-sm text-slate-900 uppercase">{e.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase tracking-wider">
                    PUBLISHED
                  </span>
                </div>

                <div className="text-slate-600 text-[11px] space-y-1">
                  <div>Subject: <strong className="text-blue-900 font-bold">{e.subject}</strong> | Class: {e.className}</div>
                  <div>Questions: <strong className="text-slate-900 font-bold">{e.questions.length}</strong> | Duration: {e.durationMinutes} mins</div>
                  <div>Pass Mark: {e.passPercentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLASS BROADSHEET */}
      {activeTab === 'broadsheet' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Class Broadsheet Summary: {selectedClass}</h2>
              <p className="text-xs text-slate-500">Master result overview across all recorded subjects for {selectedTerm}.</p>
            </div>

            <PrintButton label="Print Class Broadsheet" />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
                  <th className="p-3 border-r border-slate-200">Reg No</th>
                  <th className="p-3 border-r border-slate-200">Student Name</th>
                  <th className="p-3 border-r border-slate-200 text-center">Subject Total</th>
                  <th className="p-3 border-r border-slate-200 text-center">Grade</th>
                  {school.showPositionOnResult !== false && <th className="p-3 border-r border-slate-200 text-center">Class Rank</th>}
                  <th className="p-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-100">{r.studentRegNo}</td>
                    <td className="p-3 font-bold text-slate-900 uppercase border-r border-slate-100">{r.studentName}</td>
                    <td className="p-3 text-center font-mono font-black text-slate-900 border-r border-slate-100">{r.total} / 100</td>
                    <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-100">{r.grade}</td>
                    {school.showPositionOnResult !== false && (
                      <td className="p-3 text-center font-bold text-blue-900 border-r border-slate-100">#{r.position}</td>
                    )}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPreviewStudent({ regNo: r.studentRegNo, name: r.studentName, className: selectedClass })}
                          className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-[10px] uppercase rounded shadow-sm flex items-center gap-1 transition"
                          title="Preview Official Report Card"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => setWhatsAppStudent({ regNo: r.studentRegNo, name: r.studentName, className: selectedClass })}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase rounded shadow-sm flex items-center gap-1 transition"
                          title="Send Result Card via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-200" /> WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Report Card Full Details Editor Modal */}
      <StudentReportEditorModal
        isOpen={!!editReportStudent}
        onClose={() => setEditReportStudent(null)}
        school={school}
        student={editReportStudent}
        term={selectedTerm}
        session={selectedSession}
        onSaved={() => {
          // refresh if needed
        }}
      />

      {/* Result Preview Modal */}
      <StudentResultPreviewModal
        isOpen={!!previewStudent}
        onClose={() => setPreviewStudent(null)}
        school={school}
        student={previewStudent}
        term={selectedTerm}
        session={selectedSession}
      />

      {/* WhatsApp Dispatch Modal */}
      <WhatsAppShareModal
        isOpen={!!whatsAppStudent}
        onClose={() => setWhatsAppStudent(null)}
        school={school}
        student={whatsAppStudent || { regNo: '', name: '' }}
        results={
          whatsAppStudent
            ? storageService.getResults(school.id).filter((r) => r.studentRegNo === whatsAppStudent.regNo && r.term === selectedTerm && r.session === selectedSession)
            : []
        }
        term={selectedTerm}
        session={selectedSession}
      />

      {/* CBT Attempt & Answers Modal */}
      <CbtAttemptDetailsModal
        isOpen={!!selectedCbtAttemptForModal}
        onClose={() => {
          setSelectedCbtAttemptForModal(null);
          setSelectedCbtExamForModal(null);
        }}
        attempt={selectedCbtAttemptForModal}
        exam={selectedCbtExamForModal}
      />
    </div>
  );
};
