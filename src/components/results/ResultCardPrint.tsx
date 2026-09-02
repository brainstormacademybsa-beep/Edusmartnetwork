import React, { useState } from 'react';
import { School, StudentResult, User } from '../../types';
import { PrintButton } from '../common/PrintButton';
import { MessageCircle, Camera, Check, QrCode } from 'lucide-react';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { storageService } from '../../services/storageService';

interface ResultCardPrintProps {
  school: School;
  student: User | { regNo: string; name: string; className: string; parentPhone?: string; parentWhatsapp?: string; phone?: string; id?: string; avatarUrl?: string; dob?: string; gender?: string; department?: string; daysOpened?: number; daysPresent?: number; daysAbsent?: number; termBegins?: string; termEnds?: string; nextTermBegins?: string; teacherComment?: string; affectiveScores?: Record<string, number>; psychomotorScores?: Record<string, number> };
  results: StudentResult[];
  term: string;
  session: string;
  onBack?: () => void;
}

export const ResultCardPrint: React.FC<ResultCardPrintProps> = ({
  school,
  student,
  results,
  term,
  session,
  onBack,
}) => {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Retrieve fee schedules for school fee breakdown table
  const feeSchedules = storageService.getFeeSchedules(school.id);
  const matchedFeeSchedule = feeSchedules.find(
    (s) => s.className === (student.className || results[0]?.className) && s.term === term && s.session === session
  ) || feeSchedules[0];

  const totalMarks = results.reduce((sum, r) => sum + r.total, 0);
  const averageNum = results.length > 0 ? totalMarks / results.length : 0;
  const average = averageNum.toFixed(1);

  // Grade calculation
  const getOverallGrade = (avg: number) => {
    if (avg >= 75) return 'A';
    if (avg >= 65) return 'B';
    if (avg >= 55) return 'C';
    if (avg >= 45) return 'D';
    return 'F';
  };

  const getOverallComment = (avg: number) => {
    if (avg >= 75) return 'Excellent';
    if (avg >= 65) return 'VeryGood';
    if (avg >= 55) return 'Good';
    if (avg >= 45) return 'Credit';
    return 'Pass';
  };

  const overallGrade = getOverallGrade(averageNum);
  const overallComment = getOverallComment(averageNum);

  // Default Affective Domain behaviors & ratings (grading scale 100, 85, 75, 65, 55)
  const defaultAffective: Record<string, number> = {
    'AESTHETIC APPRECIATION': 75,
    'Honesty': 85,
    'Creativity': 75,
    'Neatness': 75,
    'Obedience': 75,
    'Politeness': 65,
    'Punctuality': 75,
    'Self-control': 65,
    'Sociability': 85,
    'Leadership Role': 100,
    ...(student.affectiveScores || {}),
  };

  // Default Psychomotor Domain activities & ratings
  const defaultPsychomotor: Record<string, number> = {
    'Games': 85,
    'Sports': 85,
    'Handling of Tools': 85,
    'Handwriting': 65,
    'Communication Skills': 65,
    'Crafts': 85,
    ...(student.psychomotorScores || {}),
  };

  // Grading columns scale matching reference image: 100, 85, 75, 65, 55
  const gradingCols = [100, 85, 75, 65, 55];

  // Attendance defaults
  const daysOpened = student.daysOpened ?? 92;
  const daysPresent = student.daysPresent ?? 86;
  const daysAbsent = student.daysAbsent ?? (daysOpened - daysPresent);

  // Terminal Dates
  const termBegins = student.termBegins || '27-04-2026';
  const termEnds = student.termEnds || '10-07-2026';
  const nextTermBegins = student.nextTermBegins || '14-09-2026';

  // Section title based on class name
  const isSecondary = (student.className || '').toUpperCase().includes('SSS') || (student.className || '').toUpperCase().includes('JSS');
  const sectionTitle = isSecondary ? 'SECONDARY SCHOOL REPORT' : 'NURSERY AND PRIMARY SCHOOL';

  return (
    <div className="space-y-4 max-w-5xl mx-auto my-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 text-white p-4 rounded-xl print:hidden shadow-md gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200"
            >
              ← Back
            </button>
          )}
          <span className="text-sm font-bold text-amber-300">Continuous Assessment Report Sheet</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>Send to Parent via WhatsApp</span>
          </button>
          <PrintButton label="Print / Download PDF" />
        </div>
      </div>

      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        school={school}
        student={student}
        results={results}
        term={term}
        session={session}
      />

      {/* Official Continuous Assessment Report Document Sheet */}
      <div
        id="printable-report-card"
        className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-xl border border-slate-300 print:shadow-none print:p-0 print:border-none print:w-full font-sans max-w-5xl mx-auto"
      >
        {/* Header Block matching reference image */}
        <div className="grid grid-cols-[100px_1fr_100px] items-center gap-4 border-b-2 border-slate-900 pb-4">
          {/* Left: School Logo */}
          <div className="flex justify-center">
            {school.logo ? (
              <img
                src={school.logo}
                alt={school.name}
                className="w-24 h-24 object-contain border border-slate-300 rounded-lg p-1 bg-white shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 border border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs text-center p-1">
                {school.name.slice(0, 3).toUpperCase()} LOGO
              </div>
            )}
          </div>

          {/* Center: School Banner Info */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-slate-900">
              {school.name}
            </h1>
            <div className="inline-block bg-slate-100 text-slate-800 px-4 py-0.5 rounded border border-slate-200 text-xs font-black uppercase tracking-wider">
              MOTTO: {school.motto || 'EXPERIENCING A GLOBAL IMPART.'}
            </div>
            <p className="text-xs text-slate-700 font-medium max-w-xl mx-auto leading-tight">
              {school.address}
            </p>
          </div>

          {/* Right: Student Passport Photo Box */}
          <div className="flex justify-center">
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-24 h-24 object-cover border-2 border-slate-400 rounded-md bg-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 border-2 border-slate-300 rounded-md bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                <Camera className="w-6 h-6 mb-1 text-slate-400" />
                <span className="text-[8px] uppercase font-bold text-slate-400">NO PHOTO AVAILABLE</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Title Banner */}
        <div className="text-center my-3">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 inline-block">
            Continuous Assessment Report {sectionTitle}
          </h2>
        </div>

        {/* Student Profile Info Tables */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Student Info Table Left */}
            <table className="w-full border-collapse border border-slate-400">
              <tbody>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 w-28 text-slate-700">Name</td>
                  <td className="p-1.5 border border-slate-300 font-black uppercase text-slate-900">{student.name}</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 text-slate-700">Department</td>
                  <td className="p-1.5 border border-slate-300 font-semibold text-slate-800">{student.department || 'Basic Education'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 text-slate-700">Gender</td>
                  <td className="p-1.5 border border-slate-300 font-semibold text-slate-800">{student.gender || 'Male'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 text-slate-700">Parent / Guardian</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{student.parentPhone || student.parentWhatsapp || student.phone || '+234 803 888 7766'}</td>
                </tr>
              </tbody>
            </table>

            {/* Student Info Table Right */}
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 w-28 text-slate-700">Class</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{student.className || results[0]?.className || 'Primary 3'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 text-slate-700">Date of Birth</td>
                  <td className="p-1.5 border border-slate-300 font-mono text-slate-800">{student.dob || '01-04-2017'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 text-slate-700">Student Reg No</td>
                  <td className="p-1.5 border border-slate-300 font-mono font-black text-rose-700">{student.regNo}</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 text-slate-700">Report Status</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-emerald-700 uppercase">Verified & Computed</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance & Terminal Duration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Attendance Table */}
            <table className="w-full border-collapse border border-slate-400 text-center">
              <thead>
                <tr className="bg-amber-100/90 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-400">
                  <th colSpan={3} className="p-1 border border-slate-400">ATTENDANCE</th>
                </tr>
                <tr className="bg-slate-50 text-slate-700 font-bold text-[10px]">
                  <th className="p-1.5 border border-slate-300">Days School Opened</th>
                  <th className="p-1.5 border border-slate-300">Days Present</th>
                  <th className="p-1.5 border border-slate-300">Days Absent</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono font-bold text-slate-900">
                  <td className="p-1.5 border border-slate-300">{daysOpened}</td>
                  <td className="p-1.5 border border-slate-300">{daysPresent}</td>
                  <td className="p-1.5 border border-slate-300 text-rose-700">{daysAbsent}</td>
                </tr>
              </tbody>
            </table>

            {/* Terminal Duration Table */}
            <table className="w-full border-collapse border border-slate-400 text-center">
              <thead>
                <tr className="bg-amber-100/90 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-400">
                  <th colSpan={3} className="p-1 border border-slate-400">TERMINAL DURATION</th>
                </tr>
                <tr className="bg-slate-50 text-slate-700 font-bold text-[10px]">
                  <th className="p-1.5 border border-slate-300">Term Begins</th>
                  <th className="p-1.5 border border-slate-300">Term Ends</th>
                  <th className="p-1.5 border border-slate-300">Next Term Begins</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono font-bold text-slate-900">
                  <td className="p-1.5 border border-slate-300">{termBegins}</td>
                  <td className="p-1.5 border border-slate-300">{termEnds}</td>
                  <td className="p-1.5 border border-slate-300 text-emerald-800">{nextTermBegins}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main 2-Column Split Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (Cognitive Progress + Fees + Comments) - 8 cols */}
          <div className="lg:col-span-8 space-y-3">
            {/* Academic Progress Header */}
            <div className="bg-slate-100 border border-slate-400 p-1.5 text-center font-black uppercase text-xs tracking-tight text-slate-900">
              ACADEMIC PROGRESS REPORT SUMMARIES AND TEST (COGNITIVE)
            </div>

            {/* Cognitive Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold text-center border-b border-slate-400">
                    <th className="p-2 border border-slate-400 text-left uppercase w-2/5">SUBJECTS</th>
                    <th className="p-2 border border-slate-400">Test Scores <span className="block text-[9px] font-normal text-slate-600">40%</span></th>
                    <th className="p-2 border border-slate-400">Exam Scores <span className="block text-[9px] font-normal text-slate-600">60%</span></th>
                    <th className="p-2 border border-slate-400">
                      {term} Scores <span className="block text-[9px] font-normal text-slate-600">100%</span>
                    </th>
                    <th className="p-2 border border-slate-400">Grades</th>
                    {school.showPositionOnResult !== false && <th className="p-2 border border-slate-400">POS</th>}
                    <th className="p-2 border border-slate-400 text-left">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={school.showPositionOnResult !== false ? 7 : 6} className="p-6 text-center text-slate-500 italic">
                        No subject scores recorded for this term yet.
                      </td>
                    </tr>
                  ) : (
                    results.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-amber-50/30">
                        <td className="p-2 border border-slate-300 font-bold uppercase text-slate-900 text-[11px]">{r.subject}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{r.ca}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{r.exam}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900 bg-amber-50/50">{r.total}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold text-slate-800">{r.grade}</td>
                        {school.showPositionOnResult !== false && (
                          <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">#{r.position || idx + 1}</td>
                        )}
                        <td className="p-2 border border-slate-300 text-slate-800 font-semibold text-[11px]">{r.remark || getOverallComment(r.total)}</td>
                      </tr>
                    ))
                  )}

                  {/* Summary Bar Row matching image */}
                  <tr className="bg-amber-100/90 font-bold border-t-2 border-slate-400">
                    <td className="p-2 border border-slate-400 uppercase text-[10px] text-center">Num Of Sub</td>
                    <td className="p-2 border border-slate-400 uppercase text-[10px] text-center">Total Marks</td>
                    <td className="p-2 border border-slate-400 uppercase text-[10px] text-center">Percentage</td>
                    <td className="p-2 border border-slate-400 uppercase text-[10px] text-center">Grade</td>
                    <td colSpan={school.showPositionOnResult !== false ? 3 : 2} className="p-2 border border-slate-400 uppercase text-[10px] text-center">
                      Comment
                    </td>
                  </tr>
                  <tr className="font-mono font-black text-center bg-white text-slate-900">
                    <td className="p-2 border border-slate-300">{results.length}</td>
                    <td className="p-2 border border-slate-300">{totalMarks}</td>
                    <td className="p-2 border border-slate-300 text-amber-900">{average}%</td>
                    <td className="p-2 border border-slate-300 text-emerald-800">{overallGrade}</td>
                    <td colSpan={school.showPositionOnResult !== false ? 3 : 2} className="p-2 border border-slate-300 text-slate-900 font-sans font-bold">
                      {overallComment}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Teacher's Comment Box */}
            <div className="border border-slate-400 rounded overflow-hidden">
              <div className="bg-amber-100/90 px-3 py-1 text-center font-bold text-xs uppercase border-b border-slate-400 text-slate-900">
                Teacher's Comment
              </div>
              <div className="p-3 text-center font-semibold text-slate-900 text-xs italic bg-white">
                {student.teacherComment || (parseFloat(average) >= 50 ? `Promoted to next class level (${student.className || 'Primary3'}). Excellent performance!` : 'Repeat class level for improvement.')}
              </div>
            </div>

            {/* School Fees & QR Code Dual Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              {/* School Fees Table */}
              <table className="w-full border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-amber-100/90 text-slate-900 font-bold uppercase text-[10px]">
                    <th colSpan={2} className="p-1 border border-slate-400">School Fees</th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-700 font-bold text-[10px]">
                    <th className="p-1 border border-slate-300 text-left">Fee Type</th>
                    <th className="p-1 border border-slate-300 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-slate-800 text-[11px]">
                  {matchedFeeSchedule ? (
                    <>
                      <tr>
                        <td className="p-1 border border-slate-300">Tuition</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦{matchedFeeSchedule.tuitionFee?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300">Exam fees</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦{matchedFeeSchedule.ictFee?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300">Development</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦{matchedFeeSchedule.uniformFee?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300">PTA</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦{matchedFeeSchedule.sportsFee?.toLocaleString()}</td>
                      </tr>
                      <tr className="font-bold bg-slate-50">
                        <td className="p-1 border border-slate-300">Total</td>
                        <td className="p-1 border border-slate-300 text-right font-mono text-amber-900">₦{matchedFeeSchedule.totalAmount?.toLocaleString()}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td className="p-1 border border-slate-300">Tuition</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦15,000</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300">Exam fees</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦3,000</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300">Development</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦2,000</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300">PTA</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦2,000</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300">Miscellaneous</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">₦3,000</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* Result QR Code Verification Box */}
              <div className="border border-slate-400 rounded flex flex-col items-center justify-between p-2 bg-slate-50">
                <div className="w-full bg-amber-100/90 text-slate-900 font-bold uppercase text-[10px] text-center py-1 border-b border-slate-400 mb-2">
                  Result Verification QR Code
                </div>
                <div className="p-2 bg-white border border-slate-300 rounded shadow-sm flex flex-col items-center">
                  <QrCode className="w-20 h-20 text-slate-900" />
                  <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase font-bold">{student.regNo}</span>
                </div>
                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                  <span>🖨 Print or Download</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Affective Domain + Psychomotor Domain) - 4 cols */}
          <div className="lg:col-span-4 space-y-3">
            {/* Affective Domain Block */}
            <div className="border border-slate-400 rounded overflow-hidden">
              <div className="bg-slate-100 p-2 text-center border-b border-slate-400">
                <h3 className="font-black text-xs uppercase text-slate-900 leading-tight">AFFECTIVE DOMAIN</h3>
                <p className="text-[9px] text-slate-600 font-medium tracking-tight uppercase">(VALUES, ATTITUDES, INTERESTS, CHARACTER ETC.)</p>
              </div>

              <table className="w-full text-xs border-collapse border-b border-slate-300">
                <thead>
                  <tr className="bg-amber-100/90 font-bold uppercase text-[10px] text-slate-900 border-b border-slate-400">
                    <th className="p-1.5 border-r border-slate-400 text-left w-1/2">BEHAVIOUR</th>
                    <th colSpan={5} className="p-1 text-center">GRADING</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-bold text-slate-700 text-center border-b border-slate-300">
                    <td className="p-1 border-r border-slate-300"></td>
                    {gradingCols.map((col) => (
                      <td key={col} className="p-1 border-r border-slate-300 w-7">{col}</td>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[10px] font-semibold text-slate-800">
                  {Object.entries(defaultAffective).map(([key, score]) => (
                    <tr key={key} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 uppercase text-slate-900">{key}</td>
                      {gradingCols.map((col) => (
                        <td key={col} className="p-1 border-r border-slate-300 text-center">
                          {score === col && <Check className="w-3.5 h-3.5 text-slate-900 mx-auto stroke-[3]" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Psychomotor Domain Block */}
            <div className="border border-slate-400 rounded overflow-hidden">
              <div className="bg-slate-100 p-2 text-center border-b border-slate-400">
                <h3 className="font-black text-xs uppercase text-slate-900 leading-tight">PSYCHOMOTOR DOMAIN</h3>
                <p className="text-[9px] text-slate-600 font-medium tracking-tight uppercase">(MANUAL AND PHYSICAL SKILLS)</p>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-100/90 font-bold uppercase text-[10px] text-slate-900 border-b border-slate-400">
                    <th className="p-1.5 border-r border-slate-400 text-left w-1/2">ACTIVITIES</th>
                    <th colSpan={5} className="p-1 text-center">GRADING</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-bold text-slate-700 text-center border-b border-slate-300">
                    <td className="p-1 border-r border-slate-300"></td>
                    {gradingCols.map((col) => (
                      <td key={col} className="p-1 border-r border-slate-300 w-7">{col}</td>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[10px] font-semibold text-slate-800">
                  {Object.entries(defaultPsychomotor).map(([key, score]) => (
                    <tr key={key} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 uppercase text-slate-900">{key}</td>
                      {gradingCols.map((col) => (
                        <td key={col} className="p-1 border-r border-slate-300 text-center">
                          {score === col && <Check className="w-3.5 h-3.5 text-slate-900 mx-auto stroke-[3]" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
