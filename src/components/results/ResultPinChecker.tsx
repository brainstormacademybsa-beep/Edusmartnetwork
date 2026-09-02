import React, { useState } from 'react';
import { KeyRound, Search, AlertCircle, CheckCircle2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { School, StudentResult, User } from '../../types';
import { ResultCardPrint } from './ResultCardPrint';

interface ResultPinCheckerProps {
  school: School;
}

export const ResultPinChecker: React.FC<ResultPinCheckerProps> = ({ school }) => {
  const [regNo, setRegNo] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [term, setTerm] = useState('First Term');
  const [session, setSession] = useState('2025/2026');

  const [error, setError] = useState('');
  const [verifiedResults, setVerifiedResults] = useState<StudentResult[] | null>(null);
  const [verifiedStudent, setVerifiedStudent] = useState<User | null>(null);

  const handleVerifyPinAndCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifiedResults(null);

    if (!regNo.trim() || !pinCode.trim()) {
      setError('Please provide both Registration Number and PIN Code.');
      return;
    }

    const verification = storageService.verifyPin(pinCode, regNo, term, session);

    if (!verification.valid) {
      setError(verification.message);
      return;
    }

    // PIN verified successfully! Retrieve student results for this school, regNo, term & session
    const allResults = storageService.getResults(school.id);
    const matchedResults = allResults.filter(
      (r) =>
        r.studentRegNo.toLowerCase() === regNo.trim().toLowerCase() &&
        r.term === term &&
        r.session === session
    );

    if (matchedResults.length === 0) {
      setError(`No published results found for Reg No "${regNo}" in ${term} (${session}). Please confirm details with your school admin.`);
      return;
    }

    const users = storageService.getUsers();
    const studentUser = users.find((u) => u.regNo.toLowerCase() === regNo.trim().toLowerCase()) || {
      id: 'temp',
      schoolId: school.id,
      regNo,
      name: matchedResults[0].studentName,
      email: '',
      role: 'STUDENT',
      className: matchedResults[0].className,
    };

    setVerifiedStudent(studentUser);
    setVerifiedResults(matchedResults);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm text-slate-800">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
          <div className="p-3 bg-blue-900 text-amber-400 rounded shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter">Online Result Verification Portal</h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter your Registration Number, Academic Session, Term, and 12-Digit Scratch Card PIN to check your report card.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyPinAndCheck} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Registration Number <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CRA/2026/001"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                12-Digit PIN Code <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="4829-1058-3921"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-blue-900 font-mono font-bold tracking-wider placeholder-slate-400 focus:outline-none focus:border-blue-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Academic Session</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
              >
                <option value="2025/2026">2025/2026 Session</option>
                <option value="2024/2025">2024/2025 Session</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Academic Term</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-blue-900 font-mono flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Demo PIN for testing: <strong className="text-slate-900">4829-1058-3921</strong>
            </span>

            <button
              type="submit"
              id="btn-check-result-pin"
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold uppercase tracking-wider rounded text-xs shadow-sm transition flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Verify PIN & Access Report Card</span>
            </button>
          </div>
        </form>
      </div>

      {/* Verified Report View */}
      {verifiedResults && verifiedStudent && (
        <ResultCardPrint
          school={school}
          student={verifiedStudent}
          results={verifiedResults}
          term={term}
          session={session}
          onBack={() => setVerifiedResults(null)}
        />
      )}
    </div>
  );
};
