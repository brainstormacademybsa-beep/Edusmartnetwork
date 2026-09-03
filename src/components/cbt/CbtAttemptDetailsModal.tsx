import React from 'react';
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Calendar,
  AlertTriangle,
  FileQuestion,
  User as UserIcon,
} from 'lucide-react';
import { CbtAttempt, CbtExam } from '../../types';

interface CbtAttemptDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: CbtAttempt | null;
  exam?: CbtExam | null;
}

export const CbtAttemptDetailsModal: React.FC<CbtAttemptDetailsModalProps> = ({
  isOpen,
  onClose,
  attempt,
  exam,
}) => {
  if (!isOpen || !attempt) return null;

  const formattedDate = attempt.submittedAt
    ? new Date(attempt.submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${attempt.isPassed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                CBT Score Report & Answer Breakdown
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{attempt.examTitle}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{attempt.studentName} ({attempt.studentRegNo})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Score Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Score Scored</span>
              <span className="text-2xl font-black text-amber-400">{attempt.score} / {attempt.maxScore}</span>
            </div>

            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Percentage</span>
              <span className="text-2xl font-black text-blue-400">{attempt.percentage}%</span>
            </div>

            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Result Status</span>
              <span className={`text-xl font-black uppercase ${attempt.isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                {attempt.isPassed ? 'PASS ✓' : 'FAIL ✗'}
              </span>
            </div>

            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Date Taken</span>
              <span className="text-xs font-bold text-slate-200 block mt-1">{formattedDate}</span>
            </div>
          </div>

          {/* Student & Exam Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-amber-400" />
              <span>Student: <strong className="text-white">{attempt.studentName}</strong> ({attempt.studentRegNo})</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Exam: <strong className="text-white">{attempt.examTitle}</strong></span>
            </div>
            {exam && (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Duration: <strong className="text-white">{exam.durationMinutes} mins</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-purple-400" />
                  <span>Pass Threshold: <strong className="text-white">{exam.passPercentage}%</strong></span>
                </div>
              </>
            )}
          </div>

          {/* Detailed Question by Question Solution Review */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <FileQuestion className="w-4 h-4" />
                <span>Question Responses & Answer Key</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                {exam?.questions?.length || Object.keys(attempt.answers).length} Questions Total
              </span>
            </div>

            {exam && exam.questions && exam.questions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {exam.questions.map((q, idx) => {
                  const studentChoice = attempt.answers[q.id];
                  const isCorrect = studentChoice === q.correctAnswer;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        isCorrect
                          ? 'bg-slate-800/40 border-emerald-500/30'
                          : 'bg-slate-800/40 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-100">
                          Question {idx + 1}: {q.questionText}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {isCorrect ? 'Correct (+10)' : 'Incorrect (0)'}
                        </span>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        {[
                          { key: 'A', text: q.optionA },
                          { key: 'B', text: q.optionB },
                          { key: 'C', text: q.optionC },
                          { key: 'D', text: q.optionD },
                        ].map((opt) => {
                          const isStudentSelected = studentChoice === opt.key;
                          const isTheCorrectAnswer = q.correctAnswer === opt.key;

                          let badgeStyle = 'border-slate-800 bg-slate-900/60 text-slate-400';
                          if (isStudentSelected && isTheCorrectAnswer) {
                            badgeStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                          } else if (isStudentSelected && !isTheCorrectAnswer) {
                            badgeStyle = 'bg-red-950/80 border-red-500 text-red-200 font-bold';
                          } else if (isTheCorrectAnswer) {
                            badgeStyle = 'bg-emerald-950/50 border-emerald-600/70 text-emerald-300 font-semibold';
                          }

                          return (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${badgeStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold">{opt.key}.</span>
                                <span>{opt.text}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase">
                                {isStudentSelected && (
                                  <span className="text-amber-400">(Selected)</span>
                                )}
                                {isTheCorrectAnswer && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="text-[11px] text-amber-300/90 italic bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20">
                          💡 Explanation: {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-2">
                <p className="font-bold text-amber-400">Raw Recorded Answers:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  {Object.entries(attempt.answers).map(([qKey, ans]) => (
                    <div key={qKey} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">{qKey}:</span>
                      <span className="font-bold text-amber-400">{ans}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Attempt ID: {attempt.id}</span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
