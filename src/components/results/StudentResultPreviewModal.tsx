import React, { useState } from 'react';
import { School, StudentResult, User } from '../../types';
import { ResultCardPrint } from './ResultCardPrint';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { storageService } from '../../services/storageService';
import { X, MessageCircle, FileText, User as UserIcon } from 'lucide-react';

interface StudentResultPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  student: User | { regNo: string; name: string; className: string; parentPhone?: string; parentWhatsapp?: string; phone?: string; id?: string } | null;
  term?: string;
  session?: string;
}

export const StudentResultPreviewModal: React.FC<StudentResultPreviewModalProps> = ({
  isOpen,
  onClose,
  school,
  student,
  term = 'First Term',
  session = '2025/2026',
}) => {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  if (!isOpen || !student) return null;

  // Retrieve student's results for this school, term, and session
  const allResults = storageService.getResults(school.id);
  const studentResults = allResults.filter(
    (r) => r.studentRegNo === student.regNo && r.term === term && r.session === session
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Nav Header */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-white flex items-center gap-2">
                <span>Individual Student Report Card Preview</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {student.name} • {student.regNo} ({student.className || 'Class N/A'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Send via WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <ResultCardPrint
            school={school}
            student={student}
            results={studentResults}
            term={term}
            session={session}
          />
        </div>
      </div>

      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        school={school}
        student={student}
        results={studentResults}
        term={term}
        session={session}
      />
    </div>
  );
};
