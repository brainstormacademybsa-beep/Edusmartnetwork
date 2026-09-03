import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  FileQuestion,
  Award,
  DollarSign,
  Printer,
  Play,
  CheckCircle2,
  Lock,
  KeyRound,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { CbtAttempt, CbtExam, School, StudentResult, User } from '../../types';
import { CbtExamPlayer } from '../cbt/CbtExamPlayer';
import { CbtAttemptDetailsModal } from '../cbt/CbtAttemptDetailsModal';
import { ResultCardPrint } from '../results/ResultCardPrint';
import { ResultPinChecker } from '../results/ResultPinChecker';
import { FeeReceiptPrint } from '../fees/FeeReceiptPrint';

interface StudentDashboardProps {
  school: School;
  student: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ school, student }) => {
  const [activeTab, setActiveTab] = useState<'cbt' | 'results' | 'fees'>('cbt');
  const [selectedExam, setSelectedExam] = useState<CbtExam | null>(null);
  const [selectedAttemptForModal, setSelectedAttemptForModal] = useState<CbtAttempt | null>(null);
  const [selectedExamForModal, setSelectedExamForModal] = useState<CbtExam | null>(null);
  const [, setDataVersion] = useState(0);

  useEffect(() => {
    return storageService.subscribe(() => {
      setDataVersion((v) => v + 1);
    });
  }, []);

  const cbtExams = storageService.getCbtExams(school.id).filter((e) => e.className === student.className || !student.className);
  const attempts = storageService.getCbtAttempts(school.id).filter((a) => a.studentRegNo === student.regNo);
  const myResults = storageService.getResults(school.id).filter((r) => r.studentRegNo === student.regNo);
  const myPayments = storageService.getFeePayments(school.id).filter((p) => p.studentRegNo === student.regNo);

  if (selectedExam) {
    return (
      <CbtExamPlayer
        exam={selectedExam}
        student={student}
        school={school}
        onFinished={() => setSelectedExam(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Student Banner */}
      <div className="bg-blue-900 border-b-4 border-amber-500 rounded p-6 shadow-sm text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={student.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
              alt={student.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-blue-950 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full border-2 border-blue-900">
              <Award className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">{student.name}</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-widest shadow-sm">
                {student.className || 'Student'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
                Reg No: <span className="text-white">{student.regNo}</span>
              </p>
              <div className="w-1 h-1 rounded-full bg-blue-700"></div>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
                Portal: <span className="text-white">Active</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-blue-950 p-1.5 rounded border border-blue-800 text-xs">
          <button
            onClick={() => setActiveTab('cbt')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition ${
              activeTab === 'cbt' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" /> CBT Exams & Scores
            {attempts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-blue-900 text-white rounded text-[9px] font-mono">
                {attempts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition ${
              activeTab === 'results' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Report Card & PIN Checker
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition ${
              activeTab === 'fees' ? 'bg-amber-500 text-slate-950 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Fees & Receipts
          </button>
        </div>
      </div>

      {/* TAB 1: AVAILABLE CBT EXAMS & SCORES */}
      {activeTab === 'cbt' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
            <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileQuestion className="w-5 h-5 text-amber-500" />
                  <span>Available Computer Based Tests (CBT)</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">
                  Select an exam to begin. Timers will start immediately upon clicking "Start Examination".
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                Class: <strong className="text-blue-900">{student.className}</strong>
              </span>
            </div>

            {cbtExams.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded space-y-3">
                <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No CBT Exams currently assigned to your class.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cbtExams.map((e) => {
                  const prevAttempt = attempts.find((a) => a.examId === e.id);

                  return (
                    <div key={e.id} className="bg-white p-5 rounded border border-slate-200 space-y-4 relative shadow-sm hover:border-blue-900 transition-all group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-900 group-hover:w-2 transition-all"></div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">
                            {e.subject}
                          </span>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                            <Play className="w-2.5 h-2.5" /> ID: {e.id.slice(-6)}
                          </div>
                        </div>
                        <h3 className="font-black text-slate-900 uppercase text-sm leading-tight tracking-tight">
                          {e.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col gap-0.5">
                          <span className="text-slate-400 text-[8px]">Duration</span>
                          <span className="text-slate-900">{e.durationMinutes} Minutes</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col gap-0.5">
                          <span className="text-slate-400 text-[8px]">Questions</span>
                          <span className="text-slate-900">{e.questions.length} Items</span>
                        </div>
                      </div>

                      {prevAttempt ? (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">Score Attained</span>
                              <span className="text-sm font-black text-emerald-950 font-mono">
                                {prevAttempt.score} / {prevAttempt.maxScore} ({prevAttempt.percentage}%)
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              prevAttempt.isPassed ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {prevAttempt.isPassed ? 'PASSED ✓' : 'FAILED ✗'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedAttemptForModal(prevAttempt);
                              setSelectedExamForModal(e);
                            }}
                            className="w-full py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-950 rounded text-[10px] font-black uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            <Award className="w-3.5 h-3.5 text-emerald-700" /> View Answers & Score Details
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedExam(e)}
                          className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black uppercase tracking-widest rounded text-[10px] shadow-sm transition flex items-center justify-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-amber-400" /> Start Examination
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DEDICATED STUDENT CBT TEST SCORES HISTORY TABLE */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    My CBT Test Scores & Performance History
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                    All completed computer based test attempts, grades, and full answer sheets
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded">
                Total Completed: <strong className="text-slate-900">{attempts.length}</strong>
              </span>
            </div>

            {attempts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-500">
                You have not completed any CBT exams yet. Take an exam above to view your score history here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <th className="p-3">Exam Title</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Points Scored</th>
                      <th className="p-3">Percentage</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date Completed</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {attempts.map((att) => {
                      const matchedExam = cbtExams.find((e) => e.id === att.examId);
                      const formattedDate = att.submittedAt
                        ? new Date(att.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Completed';

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900">{att.examTitle}</td>
                          <td className="p-3 font-semibold text-blue-900">{matchedExam?.subject || 'CBT Subject'}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {att.score} / {att.maxScore}
                          </td>
                          <td className="p-3 font-mono font-black text-blue-700">
                            {att.percentage}%
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                att.isPassed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {att.isPassed ? 'PASS ✓' : 'FAIL ✗'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{formattedDate}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedAttemptForModal(att);
                                setSelectedExamForModal(matchedExam || null);
                              }}
                              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-wider rounded text-[10px] shadow-sm transition"
                            >
                              View Answers
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REPORT CARD & RESULT PIN CHECKER */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Direct Portal Result Card View */}
          <ResultCardPrint
            school={school}
            student={student}
            results={myResults}
            term="First Term"
            session="2025/2026"
          />

          {/* Result Scratch Card PIN Checker Portal */}
          <ResultPinChecker school={school} />
        </div>
      )}

      {/* TAB 3: FEES & RECEIPT */}
      {activeTab === 'fees' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
            <DollarSign className="w-5 h-5 text-amber-500" /> My Fee Payments & Receipts
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Term / Session</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3">Balance Remaining</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {myPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-900">{p.receiptNo}</td>
                    <td className="p-3 font-semibold text-slate-900">{p.term} ({p.session})</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">${p.amountPaid}</td>
                    <td className="p-3 font-mono font-bold text-red-600">${p.balanceRemaining}</td>
                    <td className="p-3 font-bold text-emerald-700 uppercase tracking-wider text-[10px]">{p.status}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold uppercase tracking-wider rounded text-xs shadow-sm"
                      >
                        Print PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CBT ATTEMPT & ANSWER DETAILS MODAL */}
      <CbtAttemptDetailsModal
        isOpen={!!selectedAttemptForModal}
        onClose={() => {
          setSelectedAttemptForModal(null);
          setSelectedExamForModal(null);
        }}
        attempt={selectedAttemptForModal}
        exam={selectedExamForModal}
      />
    </div>
  );
};
