import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Save,
  FileQuestion,
  Clock,
  Award,
  ArrowLeft,
  Upload,
  FileDown,
  AlertCircle,
  Clipboard,
  Copy,
  FileText,
  Check,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { CbtExam, CbtQuestion, School, User } from '../../types';
import { DEFAULT_SCHOOL_CLASSES } from '../../constants/classes';
import {
  downloadCbtQuestionTemplate,
  downloadCbtQuestionCsvTemplate,
  SAMPLE_CBT_QUESTIONS_ROWS,
  parseCbtQuestionsExcel,
} from '../../utils/excelUtils';
import { parseRawTextQuestions } from '../../utils/cbtTextParser';

interface CbtCreatorProps {
  school: School;
  teacher: User;
  onSaved: () => void;
  onCancel: () => void;
}

export const CbtCreator: React.FC<CbtCreatorProps> = ({ school, teacher, onSaved, onCancel }) => {
  const teacherAssignedClasses =
    teacher.assignedClasses && teacher.assignedClasses.length > 0
      ? teacher.assignedClasses
      : [teacher.className || 'JSS 1A'];

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [className, setClassName] = useState(teacherAssignedClasses[0] || teacher.className || 'JSS 1A');
  const [term, setTerm] = useState('First Term');
  const [session, setSession] = useState('2025/2026');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passPercentage, setPassPercentage] = useState(50);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedRawText, setPastedRawText] = useState('');
  const [singlePasteIdx, setSinglePasteIdx] = useState<number | null>(null);
  const [singlePastedText, setSinglePastedText] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [copiedTemplateMsg, setCopiedTemplateMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    setDownloadStatus(`Preparing ${format.toUpperCase()} template...`);
    try {
      if (format === 'csv') {
        downloadCbtQuestionCsvTemplate('CBT_Questions_Template.csv');
      } else {
        downloadCbtQuestionTemplate('CBT_Questions_Template.xlsx');
      }
      setTimeout(() => {
        setDownloadStatus(`✓ ${format.toUpperCase()} template downloaded!`);
        setTimeout(() => setDownloadStatus(''), 3500);
      }, 300);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadStatus('Download error. Please use Copy Template option below.');
    }
  };

  const handleCopyTemplateData = () => {
    const csvHeader = 'Question Text,Option A,Option B,Option C,Option D,Correct Answer (A/B/C/D),Points (1-100),Explanation (Optional)';
    const rows = SAMPLE_CBT_QUESTIONS_ROWS.map(
      (r) =>
        `"${r['Question Text']}","${r['Option A']}","${r['Option B']}","${r['Option C']}","${r['Option D']}","${r['Correct Answer (A/B/C/D)']}",${r['Points (1-100)']},"${r['Explanation (Optional)']}"`
    );
    const content = `${csvHeader}\n${rows.join('\n')}`;
    navigator.clipboard.writeText(content);
    setCopiedTemplateMsg(true);
    setTimeout(() => setCopiedTemplateMsg(false), 3000);
  };

  const [questions, setQuestions] = useState<CbtQuestion[]>([
    {
      id: `q-${Date.now()}-1`,
      questionText: 'What is the value of 5 x 12?',
      optionA: '50',
      optionB: '60',
      optionC: '70',
      optionD: '80',
      correctAnswer: 'B',
      points: 10,
      explanation: '5 multiplied by 12 equals 60.',
    },
  ]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newQuestions = await parseCbtQuestionsExcel(file);
      if (newQuestions.length > 0) {
        setQuestions((prev) => [...prev, ...newQuestions]);
        setShowBulkUpload(false);
      } else {
        alert('No valid questions found in the Excel file.');
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing Excel file. Please ensure it follows the template format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyPastedQuestions = (mode: 'append' | 'replace') => {
    const parsed = parseRawTextQuestions(pastedRawText);
    if (parsed.length === 0) {
      alert('No valid questions were detected. Please ensure your text includes questions and options A, B, C, D.');
      return;
    }

    if (mode === 'replace') {
      setQuestions(parsed);
    } else {
      setQuestions((prev) => [...prev, ...parsed]);
    }

    setPastedRawText('');
    setShowPasteModal(false);
  };

  const handleSinglePasteApply = (idx: number) => {
    const parsed = parseRawTextQuestions(singlePastedText);
    if (parsed.length === 0) {
      alert('Could not parse question text. Please make sure it includes question text and options A, B, C, D.');
      return;
    }

    const first = parsed[0];
    const updated = [...questions];
    updated[idx] = {
      ...updated[idx],
      questionText: first.questionText,
      optionA: first.optionA,
      optionB: first.optionB,
      optionC: first.optionC,
      optionD: first.optionD,
      correctAnswer: first.correctAnswer,
      explanation: first.explanation || updated[idx].explanation,
    };
    setQuestions(updated);
    setSinglePasteIdx(null);
    setSinglePastedText('');
  };

  const handleCopyQuestionText = (q: CbtQuestion, idx: number) => {
    const textToCopy = `Question ${idx + 1}: ${q.questionText}
A. ${q.optionA}
B. ${q.optionB}
C. ${q.optionC}
D. ${q.optionD}
Answer: ${q.correctAnswer}
${q.explanation ? `Explanation: ${q.explanation}` : ''}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const duplicated: CbtQuestion = {
      ...target,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, duplicated);
    setQuestions(updated);
  };

  const loadSamplePastedText = () => {
    setPastedRawText(`1. Which city is the official capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Ibadan
Answer: B
Explanation: Abuja became the official capital city of Nigeria in December 1991.

2. What is the sum of angles in a triangle?
A) 90 degrees
B) 180 degrees
C) 360 degrees
D) 270 degrees
Ans: B
Explanation: The interior angles of any Euclidean triangle always sum to 180 degrees.

3. Which organ in the human body filters blood to produce urine?
a. Heart
b. Liver
c. Kidney
d. Lungs
Correct: C
Note: The kidneys filter around 120-150 quarts of blood daily.`);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${questions.length + 1}`,
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        points: 10,
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, key: keyof CbtQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [key]: value };
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.some((q) => !q.questionText.trim())) {
      alert('Please fill out the exam title and all question texts.');
      return;
    }

    const newExam: CbtExam = {
      id: `cbt-${Date.now()}`,
      schoolId: school.id,
      teacherId: teacher.id,
      teacherName: teacher.name,
      title,
      subject,
      className,
      term,
      session,
      durationMinutes,
      passPercentage,
      questions,
      isPublished: true,
      createdAt: new Date().toISOString(),
    };

    storageService.saveCbtExam(newExam);
    onSaved();
  };

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white border border-slate-200 rounded p-6 shadow-sm text-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Create Computer-Based Test (CBT)</h2>
            <p className="text-xs text-slate-500 font-medium">
              Build an automated multiple-choice test with timer and auto-grading system.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          id="btn-save-cbt-exam"
          className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded uppercase tracking-widest text-[11px] shadow-sm transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Publish CBT Exam</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Exam Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded border border-slate-200">
          <div className="md:col-span-3">
            <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">
              Exam Title <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. First Term Mathematics CBT Examination"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Subject Category</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900 font-medium"
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
            <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Target Class</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900 font-medium"
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
            <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Exam Duration (Mins)</label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-900" />
              <input
                type="number"
                min={1}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 10)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-900 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-[11px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-amber-500" /> Exam Questions List ({questions.length})
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Copy & paste questions directly from Word, PDFs, WhatsApp, or text files.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition shadow-sm"
              >
                <Clipboard className="w-3.5 h-3.5" /> Paste Raw Text / Clipboard
              </button>

              <button
                type="button"
                onClick={() => setShowBulkUpload(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" /> Bulk Upload Excel
              </button>

              <button
                type="button"
                onClick={addQuestion}
                className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Question
              </button>
            </div>
          </div>

          {/* Raw Text / Clipboard Paste Modal */}
          {showPasteModal && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 uppercase tracking-tight">
                      <Clipboard className="w-5 h-5 text-emerald-600" />
                      <span>Paste Questions from Anywhere</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Copy questions from Word, PDF, WhatsApp, Google Docs, or AI tools and paste them directly below.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasteModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-900" /> Paste Copied Questions Text Below:
                    </label>
                    <button
                      type="button"
                      onClick={loadSamplePastedText}
                      className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" /> Try Sample Format
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedRawText}
                    onChange={(e) => setPastedRawText(e.target.value)}
                    placeholder={`Paste your copied questions here. Example format:

1. What is the capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Ibadan
Answer: B
Explanation: Abuja became the official capital city in 1991.`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-900 shadow-inner leading-relaxed"
                  />

                  {pastedRawText.trim() && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-bold flex items-center justify-between">
                      <span>Detected Questions: {parseRawTextQuestions(pastedRawText).length} question(s) parsed</span>
                      <span className="text-[10px] font-normal text-emerald-700 italic">Auto-detects options A-D, answers & explanations</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 italic">Supports formats: 1. 1) Q1. Option A-D, Ans/Answer/Key</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteModal(false)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider text-[10px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPastedQuestions('append')}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-lg uppercase tracking-wider text-[10px] shadow transition"
                    >
                      + Add to Questions
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPastedQuestions('replace')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] shadow transition"
                    >
                      Replace All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Single Question Paste Modal */}
          {singlePasteIdx !== null && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 uppercase tracking-tight">
                    <Clipboard className="w-4 h-4 text-blue-900" />
                    <span>Paste Text into Question {singlePasteIdx + 1}</span>
                  </h3>
                  <button
                    onClick={() => setSinglePasteIdx(null)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Paste text for a single question with options below:</p>
                  <textarea
                    rows={5}
                    value={singlePastedText}
                    onChange={(e) => setSinglePastedText(e.target.value)}
                    placeholder={`Example:
What is 10 / 2?
A) 2
B) 4
C) 5
D) 10
Answer: C`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSinglePasteIdx(null)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSinglePasteApply(singlePasteIdx)}
                    className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded uppercase tracking-wider text-[10px]"
                  >
                    Apply to Question {singlePasteIdx + 1}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showBulkUpload && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded max-w-lg w-full p-6 shadow-xl space-y-5 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 uppercase tracking-tight">
                    <Upload className="w-5 h-5 text-blue-900" />
                    <span>Bulk Question Upload</span>
                  </h3>
                  <button
                    onClick={() => setShowBulkUpload(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-700 leading-relaxed font-medium">
                        <p className="font-bold text-blue-900 mb-1 uppercase tracking-wider">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Download the structured Excel template below.</li>
                          <li>Fill in your questions, options, and correct answers.</li>
                          <li>Upload the completed file to add questions in bulk.</li>
                        </ol>
                      </div>
                    </div>

                    {downloadStatus && (
                      <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-2 animate-fadeIn">
                        <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{downloadStatus}</span>
                      </div>
                    )}

                    {copiedTemplateMsg && (
                      <div className="p-2.5 bg-blue-100 border border-blue-300 text-blue-900 rounded-lg text-xs font-bold flex items-center gap-2 animate-fadeIn">
                        <Check className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>Template headers & sample data copied to clipboard!</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        id="btn-download-cbt-xlsx"
                        onClick={() => handleDownloadTemplate('xlsx')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 text-blue-900 rounded-lg font-bold transition border border-blue-200 shadow-sm text-[11px] uppercase tracking-wider active:scale-98"
                      >
                        <FileDown className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>Download Template (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        id="btn-download-cbt-csv"
                        onClick={() => handleDownloadTemplate('csv')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 text-emerald-800 rounded-lg font-bold transition border border-emerald-200 shadow-sm text-[11px] uppercase tracking-wider active:scale-98"
                      >
                        <FileDown className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Download (.csv) Mobile</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyTemplateData}
                      className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-blue-900 flex items-center justify-center gap-1 py-1 transition"
                    >
                      <Copy className="w-3 h-3" /> Or Click to Copy Template Headers to Clipboard
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Select Completed Template
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleBulkUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Parsing Questions...</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-white rounded-full border border-slate-200 shadow-sm group-hover:scale-110 transition duration-300">
                            <Upload className="w-8 h-8 text-blue-900" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-900">Click to select file</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Supported: .xlsx, .xls, .csv</p>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkUpload(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-5 rounded border border-slate-200 space-y-4 relative shadow-sm hover:border-blue-200 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="font-bold text-blue-900 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-900 text-white rounded-full text-[9px]">Question {idx + 1}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSinglePasteIdx(idx)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition"
                    title="Paste raw question text into this card"
                  >
                    <Clipboard className="w-3 h-3 text-blue-900" /> Quick Paste
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyQuestionText(q, idx)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition"
                    title="Copy formatted question text to clipboard"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-600" /> Copy Text
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateQuestion(idx)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition"
                    title="Duplicate this question"
                  >
                    <Plus className="w-3 h-3 text-amber-600" /> Duplicate
                  </button>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="text-red-500 hover:text-red-700 font-bold uppercase text-[9px] flex items-center gap-1 transition px-1 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Question Text Content</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter multiple choice question..."
                  value={q.questionText}
                  onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-inner"
                />
              </div>

              {/* Options A - D */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-widest text-[9px]">Option A</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter choice A"
                    value={q.optionA}
                    onChange={(e) => updateQuestion(idx, 'optionA', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 text-[11px] font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-widest text-[9px]">Option B</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter choice B"
                    value={q.optionB}
                    onChange={(e) => updateQuestion(idx, 'optionB', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 text-[11px] font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-widest text-[9px]">Option C</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter choice C"
                    value={q.optionC}
                    onChange={(e) => updateQuestion(idx, 'optionC', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 text-[11px] font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-widest text-[9px]">Option D</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter choice D"
                    value={q.optionD}
                    onChange={(e) => updateQuestion(idx, 'optionD', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 text-[11px] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div>
                  <label className="block text-emerald-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">Correct Answer Key</label>
                  <select
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(idx, 'correctAnswer', e.target.value)}
                    className="w-full bg-emerald-50 border border-emerald-200 rounded px-3 py-2 text-emerald-800 font-black text-[11px] uppercase tracking-widest"
                  >
                    <option value="A">Option A (Correct)</option>
                    <option value="B">Option B (Correct)</option>
                    <option value="C">Option C (Correct)</option>
                    <option value="D">Option D (Correct)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1.5">Explanation (Shown after exam)</label>
                  <input
                    type="text"
                    placeholder="Brief explanation or solution note..."
                    value={q.explanation || ''}
                    onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 text-[11px] italic"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
};
