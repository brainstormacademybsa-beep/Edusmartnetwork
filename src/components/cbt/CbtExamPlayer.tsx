import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  Award,
  RefreshCw,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storageService } from '../../services/storageService';
import { CbtAttempt, CbtExam, School, User } from '../../types';

interface CbtExamPlayerProps {
  exam: CbtExam;
  student: User;
  school: School;
  onFinished: () => void;
}

export const CbtExamPlayer: React.FC<CbtExamPlayerProps> = ({
  exam,
  student,
  school,
  onFinished,
}) => {
  // Check if student already attempted this exam to prevent retaking!
  const existingAttempts = storageService.getCbtAttempts(school.id);
  const previousAttempt = existingAttempts.find(
    (a) => a.examId === exam.id && a.studentRegNo === student.regNo
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalAttempt, setFinalAttempt] = useState<CbtAttempt | null>(previousAttempt || null);

  // Countdown timer effect
  useEffect(() => {
    if (previousAttempt || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, previousAttempt]);

  const currentQuestion = exam.questions[currentIdx];

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted || previousAttempt) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  };

  const handleAutoSubmit = () => {
    if (isSubmitted || previousAttempt) return;

    // Calculate score
    let score = 0;
    let maxScore = 0;

    exam.questions.forEach((q) => {
      maxScore += q.points;
      if (answers[q.id] === q.correctAnswer) {
        score += q.points;
      }
    });

    const percentage = Math.round((score / Math.max(1, maxScore)) * 100);
    const isPassed = percentage >= exam.passPercentage;

    const attempt: CbtAttempt = {
      id: `att-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: student.id,
      studentRegNo: student.regNo,
      studentName: student.name,
      schoolId: school.id,
      score,
      maxScore,
      percentage,
      isPassed,
      submittedAt: new Date().toISOString(),
      answers,
    };

    storageService.submitCbtAttempt(attempt);
    setFinalAttempt(attempt);
    setIsSubmitted(true);

    if (isPassed) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Format time MM:SS
  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  const isTimeWarning = timeLeftSeconds < 180;

  // Render retake protection or completed result
  if (previousAttempt || isSubmitted) {
    const res = finalAttempt || previousAttempt;
    return (
      <div className="max-w-3xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white space-y-6">
        <div className="text-center space-y-3 pb-6 border-b border-slate-800">
          {res?.isPassed ? (
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-10 h-10 animate-bounce" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-10 h-10" />
            </div>
          )}

          <h2 className="text-2xl font-black text-white">CBT Exam Result Summary</h2>
          <p className="text-xs text-slate-400">
            {previousAttempt ? 'You have already completed this CBT exam. Retaking is restricted.' : 'Exam submitted successfully! Your score has been auto-graded.'}
          </p>
        </div>

        {/* Score metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-bold block">Points Scored</span>
            <span className="text-2xl font-black text-amber-400">{res?.score} / {res?.maxScore}</span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-bold block">Percentage</span>
            <span className="text-2xl font-black text-blue-400">{res?.percentage}%</span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-bold block">Status</span>
            <span className={`text-xl font-black uppercase ${res?.isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
              {res?.isPassed ? 'PASS ✓' : 'FAIL ✗'}
            </span>
          </div>
        </div>

        {/* Question by question solution review */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-amber-300">Detailed Question Breakdown & Answers</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {exam.questions.map((q, idx) => {
              const studentChoice = res?.answers[q.id];
              const isCorrect = studentChoice === q.correctAnswer;

              return (
                <div key={q.id} className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">Q{idx + 1}. {q.questionText}</span>
                    <span className={isCorrect ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                      {isCorrect ? 'Correct (+10)' : 'Incorrect (0)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className={`p-1.5 rounded border ${studentChoice === 'A' ? (q.correctAnswer === 'A' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-red-950/60 border-red-500 text-red-300') : 'text-slate-400 border-slate-800'}`}>
                      A. {q.optionA}
                    </div>
                    <div className={`p-1.5 rounded border ${studentChoice === 'B' ? (q.correctAnswer === 'B' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-red-950/60 border-red-500 text-red-300') : 'text-slate-400 border-slate-800'}`}>
                      B. {q.optionB}
                    </div>
                    <div className={`p-1.5 rounded border ${studentChoice === 'C' ? (q.correctAnswer === 'C' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-red-950/60 border-red-500 text-red-300') : 'text-slate-400 border-slate-800'}`}>
                      C. {q.optionC}
                    </div>
                    <div className={`p-1.5 rounded border ${studentChoice === 'D' ? (q.correctAnswer === 'D' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-red-950/60 border-red-500 text-red-300') : 'text-slate-400 border-slate-800'}`}>
                      D. {q.optionD}
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="text-[11px] text-amber-300/90 italic bg-amber-950/30 p-2 rounded border border-amber-500/20">
                      💡 Solution Note: {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={onFinished}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white space-y-6">
      {/* Top Bar with Timer */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white">{exam.title}</h2>
          <p className="text-xs text-slate-400">{exam.subject} • {exam.className} • Candidate: <strong className="text-amber-300">{student.name} ({student.regNo})</strong></p>
        </div>

        {/* Timer display */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm ${isTimeWarning ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse' : 'bg-slate-900 border-amber-500/40 text-amber-400'}`}>
          <Clock className="w-5 h-5" />
          <span>Timer: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Main 1 Question Per Page Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left 3 cols: Current Question */}
        <div className="md:col-span-3 space-y-4 bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-700 pb-3">
            <span className="text-amber-400 font-bold">Question {currentIdx + 1} of {exam.questions.length}</span>
            <button
              type="button"
              onClick={toggleFlag}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${flagged[currentQuestion.id] ? 'bg-amber-500 text-slate-950 font-bold border-amber-600' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{flagged[currentQuestion.id] ? 'Flagged for Review' : 'Flag Question'}</span>
            </button>
          </div>

          <h3 className="text-base font-medium text-slate-100 leading-relaxed py-2">
            {currentQuestion.questionText}
          </h3>

          {/* Options A - D */}
          <div className="space-y-2.5 pt-2">
            {[
              { key: 'A', text: currentQuestion.optionA },
              { key: 'B', text: currentQuestion.optionB },
              { key: 'C', text: currentQuestion.optionC },
              { key: 'D', text: currentQuestion.optionD },
            ].map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelectOption(opt.key as any)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-white font-semibold shadow'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center text-xs ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                      {opt.key}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400 font-bold" />}
                </button>
              );
            })}
          </div>

          {/* Prev / Next controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1 border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentIdx < exam.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-submit-cbt-exam"
                onClick={handleAutoSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black rounded-lg text-xs flex items-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" /> Submit CBT Exam
              </button>
            )}
          </div>
        </div>

        {/* Right 1 col: Question Palette Grid */}
        <div className="space-y-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700 text-xs">
          <h4 className="font-bold text-amber-300 uppercase text-[11px]">Question Palette</h4>

          <div className="grid grid-cols-4 gap-2">
            {exam.questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isFlag = flagged[q.id];
              const isCurrent = idx === currentIdx;

              let btnStyle = 'bg-slate-900 border-slate-700 text-slate-300';
              if (isCurrent) btnStyle = 'bg-amber-500 text-slate-950 font-black border-amber-400 ring-2 ring-amber-400';
              else if (isFlag) btnStyle = 'bg-amber-900/60 text-amber-300 border-amber-500';
              else if (isAnswered) btnStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-lg border text-xs font-mono font-bold flex items-center justify-center transition ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-700 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-900 border border-emerald-500"></span>
              <span>Answered ({Object.keys(answers).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-900 border border-amber-500"></span>
              <span>Flagged ({Object.keys(flagged).filter((k) => flagged[k]).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700"></span>
              <span>Unanswered ({exam.questions.length - Object.keys(answers).length})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
