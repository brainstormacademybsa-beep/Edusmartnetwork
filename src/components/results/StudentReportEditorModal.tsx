import React, { useState, useEffect } from 'react';
import { School, StudentResult, User } from '../../types';
import { storageService } from '../../services/storageService';
import { calculateTotalAndGrade } from '../../utils/calcUtils';
import { X, Save, Plus, Trash2, Check, FileText, User as UserIcon, Calendar, DollarSign, Award, HeartHandshake } from 'lucide-react';

interface StudentReportEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  student: User | { regNo: string; name: string; className: string; id?: string; department?: string; dob?: string; gender?: string; daysOpened?: number; daysPresent?: number; daysAbsent?: number; termBegins?: string; termEnds?: string; nextTermBegins?: string; teacherComment?: string; affectiveScores?: Record<string, number>; psychomotorScores?: Record<string, number> } | null;
  term: string;
  session: string;
  onSaved?: () => void;
}

export const StudentReportEditorModal: React.FC<StudentReportEditorModalProps> = ({
  isOpen,
  onClose,
  school,
  student,
  term,
  session,
  onSaved,
}) => {
  if (!isOpen || !student) return null;

  const [studentData, setStudentData] = useState({
    name: student.name || '',
    regNo: student.regNo || '',
    className: student.className || 'Primary3',
    department: student.department || 'Middle Basic',
    gender: student.gender || 'Male',
    dob: student.dob || '01-04-2017',
    daysOpened: student.daysOpened ?? 92,
    daysPresent: student.daysPresent ?? 86,
    daysAbsent: student.daysAbsent ?? 6,
    termBegins: student.termBegins || '27-04-2026',
    termEnds: student.termEnds || '10-07-2026',
    nextTermBegins: student.nextTermBegins || '14-09-2026',
    teacherComment: student.teacherComment || '',
  });

  const [results, setResults] = useState<StudentResult[]>([]);
  const [feeDetails, setFeeDetails] = useState({
    tuition: 15000,
    exam: 3000,
    development: 2000,
    pta: 2000,
    misc: 3000,
  });

  const gradingCols = [100, 85, 75, 65, 55];

  const [affectiveScores, setAffectiveScores] = useState<Record<string, number>>({
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
  });

  const [psychomotorScores, setPsychomotorScores] = useState<Record<string, number>>({
    'Games': 85,
    'Sports': 85,
    'Handling of Tools': 85,
    'Handwriting': 65,
    'Communication Skills': 65,
    'Crafts': 85,
  });

  const [successMsg, setSuccessMsg] = useState('');

  // Load initial student results and domain scores on mount/open
  useEffect(() => {
    if (student) {
      const allResults = storageService.getResults(school.id);
      const studentRes = allResults.filter(
        (r) => r.studentRegNo === student.regNo && r.term === term && r.session === session
      );

      setResults(studentRes);

      if (student.affectiveScores) setAffectiveScores({ ...affectiveScores, ...student.affectiveScores });
      if (student.psychomotorScores) setPsychomotorScores({ ...psychomotorScores, ...student.psychomotorScores });

      const feeSchedules = storageService.getFeeSchedules(school.id);
      const matchedFee = feeSchedules.find(
        (s) => s.className === student.className && s.term === term && s.session === session
      );
      if (matchedFee) {
        setFeeDetails({
          tuition: matchedFee.tuitionFee || 15000,
          exam: matchedFee.ictFee || 3000,
          development: matchedFee.uniformFee || 2000,
          pta: matchedFee.sportsFee || 2000,
          misc: 3000,
        });
      }
    }
  }, [student, term, session, school.id]);

  const handleScoreChange = (index: number, field: 'ca' | 'exam' | 'subject' | 'remark', value: string | number) => {
    const updated = [...results];
    const item = { ...updated[index] };

    if (field === 'subject') {
      item.subject = value as string;
    } else if (field === 'remark') {
      item.remark = value as string;
    } else {
      const caVal = field === 'ca' ? Number(value) : item.ca;
      const examVal = field === 'exam' ? Number(value) : item.exam;
      const calc = calculateTotalAndGrade(caVal, examVal);
      item.ca = calc.ca;
      item.exam = calc.exam;
      item.total = calc.total;
      item.grade = calc.grade;
      item.remark = calc.remark;
    }

    updated[index] = item;
    setResults(updated);
  };

  const handleAddSubject = () => {
    const calc = calculateTotalAndGrade(30, 45);
    const newRes: StudentResult = {
      id: `res-${Date.now()}-${Math.random()}`,
      schoolId: school.id,
      studentRegNo: studentData.regNo,
      studentName: studentData.name,
      className: studentData.className,
      subject: 'NEW SUBJECT',
      ca: calc.ca,
      exam: calc.exam,
      total: calc.total,
      grade: calc.grade,
      remark: calc.remark,
      term,
      session,
      position: results.length + 1,
    };
    setResults([...results, newRes]);
  };

  const handleDeleteSubject = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    try {
      // 1. Update Student User Details
      const existingUsers = storageService.getUsers();
      const userMatch = existingUsers.find((u) => u.regNo === studentData.regNo || u.id === (student as any).id);
      if (userMatch) {
        const updatedUser: User = {
          ...userMatch,
          name: studentData.name,
          className: studentData.className,
          department: studentData.department,
          gender: studentData.gender,
          dob: studentData.dob,
          daysOpened: studentData.daysOpened,
          daysPresent: studentData.daysPresent,
          daysAbsent: studentData.daysAbsent,
          termBegins: studentData.termBegins,
          termEnds: studentData.termEnds,
          nextTermBegins: studentData.nextTermBegins,
          teacherComment: studentData.teacherComment,
          affectiveScores,
          psychomotorScores,
        };
        storageService.updateUser(updatedUser);
      }

      // 2. Save Subject Results
      storageService.bulkSaveResults(results);

      setSuccessMsg('Report Card details saved successfully!');
      if (onSaved) onSaved();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving report details:', err);
      alert('Failed to save report details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base uppercase tracking-tight text-white flex items-center gap-2">
                <span>Edit Student Report Card Details</span>
              </h2>
              <p className="text-xs text-amber-300 font-mono">
                {studentData.name} ({studentData.regNo}) • {studentData.className} • {term} ({session})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Report Card</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {successMsg && (
          <div className="bg-emerald-600 text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-900 bg-slate-50/50">
          {/* SECTION 1: STUDENT PROFILE & TERMINAL DATES */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-xs uppercase text-slate-800 border-b pb-2 flex items-center gap-2 text-blue-900">
              <UserIcon className="w-4 h-4 text-amber-500" />
              <span>1. Student Profile & Terminal Duration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  value={studentData.name}
                  onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Student ID / RegNo</label>
                <input
                  type="text"
                  value={studentData.regNo}
                  onChange={(e) => setStudentData({ ...studentData, regNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={studentData.department}
                  onChange={(e) => setStudentData({ ...studentData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Date of Birth</label>
                <input
                  type="text"
                  value={studentData.dob}
                  onChange={(e) => setStudentData({ ...studentData, dob: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Gender</label>
                <select
                  value={studentData.gender}
                  onChange={(e) => setStudentData({ ...studentData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-bold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Term Begins</label>
                <input
                  type="text"
                  value={studentData.termBegins}
                  onChange={(e) => setStudentData({ ...studentData, termBegins: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Term Ends</label>
                <input
                  type="text"
                  value={studentData.termEnds}
                  onChange={(e) => setStudentData({ ...studentData, termEnds: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Next Term Begins</label>
                <input
                  type="text"
                  value={studentData.nextTermBegins}
                  onChange={(e) => setStudentData({ ...studentData, nextTermBegins: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono text-center text-emerald-800 font-bold"
                />
              </div>
            </div>

            {/* Attendance */}
            <div className="pt-2 border-t border-slate-200">
              <span className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Attendance Summary</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600">Days School Opened</label>
                  <input
                    type="number"
                    value={studentData.daysOpened}
                    onChange={(e) => setStudentData({ ...studentData, daysOpened: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-1.5 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600">Days Present</label>
                  <input
                    type="number"
                    value={studentData.daysPresent}
                    onChange={(e) => {
                      const pres = Number(e.target.value);
                      setStudentData({
                        ...studentData,
                        daysPresent: pres,
                        daysAbsent: Math.max(0, studentData.daysOpened - pres),
                      });
                    }}
                    className="w-full border border-slate-300 rounded p-1.5 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600">Days Absent</label>
                  <input
                    type="number"
                    value={studentData.daysAbsent}
                    onChange={(e) => setStudentData({ ...studentData, daysAbsent: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-1.5 text-center font-mono font-bold text-rose-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC SUBJECT SCORES */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-xs uppercase text-blue-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>2. Academic Progress Report (Cognitive Subject Scores)</span>
              </h3>
              <button
                onClick={handleAddSubject}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[10px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <th className="p-2">Subject Name</th>
                    <th className="p-2 text-center w-24">CA (40%)</th>
                    <th className="p-2 text-center w-24">Exam (60%)</th>
                    <th className="p-2 text-center w-24">Total (100%)</th>
                    <th className="p-2 text-center w-20">Grade</th>
                    <th className="p-2 text-left">Teacher Remark</th>
                    <th className="p-2 text-center w-12">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                        No subject scores added yet. Click "Add Subject" to begin.
                      </td>
                    </tr>
                  ) : (
                    results.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.subject}
                            onChange={(e) => handleScoreChange(idx, 'subject', e.target.value)}
                            className="w-full border border-slate-300 rounded p-1.5 font-bold uppercase"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={40}
                            value={r.ca}
                            onChange={(e) => handleScoreChange(idx, 'ca', e.target.value)}
                            className="w-16 border border-slate-300 rounded p-1.5 text-center font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={r.exam}
                            onChange={(e) => handleScoreChange(idx, 'exam', e.target.value)}
                            className="w-16 border border-slate-300 rounded p-1.5 text-center font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 text-center font-mono font-black text-blue-900 bg-amber-50">
                          {r.total}
                        </td>
                        <td className="p-2 text-center font-bold">
                          {r.grade}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.remark || ''}
                            onChange={(e) => handleScoreChange(idx, 'remark', e.target.value)}
                            className="w-full border border-slate-300 rounded p-1.5 text-slate-800"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleDeleteSubject(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: AFFECTIVE & PSYCHOMOTOR DOMAINS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Affective Domain */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-black text-xs uppercase text-blue-900 border-b pb-2 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-500" />
                <span>3. Affective Domain (Values & Character)</span>
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.entries(affectiveScores).map(([trait, score]) => (
                  <div key={trait} className="flex items-center justify-between border-b pb-1.5 text-[11px]">
                    <span className="font-bold text-slate-800 uppercase">{trait}</span>
                    <div className="flex items-center gap-1">
                      {gradingCols.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setAffectiveScores({ ...affectiveScores, [trait]: col })}
                          className={`w-7 h-6 rounded text-[10px] font-bold border ${
                            score === col
                              ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Psychomotor Domain */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-black text-xs uppercase text-blue-900 border-b pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>4. Psychomotor Domain (Manual & Physical Skills)</span>
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.entries(psychomotorScores).map(([activity, score]) => (
                  <div key={activity} className="flex items-center justify-between border-b pb-1.5 text-[11px]">
                    <span className="font-bold text-slate-800 uppercase">{activity}</span>
                    <div className="flex items-center gap-1">
                      {gradingCols.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setPsychomotorScores({ ...psychomotorScores, [activity]: col })}
                          className={`w-7 h-6 rounded text-[10px] font-bold border ${
                            score === col
                              ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: TEACHER'S COMMENT */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-black text-xs uppercase text-blue-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>5. Official Teacher's Comment</span>
            </h3>
            <textarea
              rows={2}
              value={studentData.teacherComment}
              onChange={(e) => setStudentData({ ...studentData, teacherComment: e.target.value })}
              className="w-full border border-slate-300 rounded p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Promoted to next primary level. Emmanuel is a dedicated and smart student."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-2 uppercase tracking-wider"
          >
            <Save className="w-4 h-4" /> Save Report Details
          </button>
        </div>
      </div>
    </div>
  );
};
