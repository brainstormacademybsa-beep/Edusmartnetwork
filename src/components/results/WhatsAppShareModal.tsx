import React, { useState } from 'react';
import { School, StudentResult, User } from '../../types';
import { MessageCircle, Send, Check, Phone, X, Edit3, ExternalLink } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  student: User | { regNo: string; name: string; className?: string; parentPhone?: string; parentWhatsapp?: string; phone?: string; id?: string };
  results: StudentResult[];
  term: string;
  session: string;
}

export function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  }
  return cleaned;
}

export function generateWhatsAppResultText(
  school: School,
  student: { regNo: string; name: string; className?: string },
  results: StudentResult[],
  term: string,
  session: string
): string {
  const totalMarks = results.reduce((sum, r) => sum + r.total, 0);
  const average = results.length > 0 ? (totalMarks / results.length).toFixed(1) : '0';
  const overallPosition = results[0]?.position || 1;

  const directResultUrl = `${window.location.origin}/?view=result&regNo=${encodeURIComponent(student.regNo)}&term=${encodeURIComponent(term)}&session=${encodeURIComponent(session)}&schoolId=${encodeURIComponent(school.id)}`;

  let text = `🏫 *${school.name.toUpperCase()}*\n`;
  text += `📜 *OFFICIAL STUDENT RESULT NOTIFICATION*\n\n`;
  text += `Dear Parent / Guardian,\n`;
  text += `Here is the academic report card summary for *${student.name}* (${student.regNo}) for *${term} (${session})*:\n\n`;
  text += `📚 *Class:* ${student.className || results[0]?.className || 'N/A'}\n`;
  if (school.showPositionOnResult !== false) {
    text += `🏆 *Class Position:* #${overallPosition}\n`;
  }
  text += `📊 *Average Score:* ${average}%\n`;
  text += `📝 *Total Subjects:* ${results.length}\n\n`;

  if (results.length > 0) {
    text += `*SUBJECT SCORES:*\n`;
    results.forEach((r) => {
      text += `• ${r.subject}: ${r.total}/100 (${r.grade})\n`;
    });
    text += `\n`;
  }

  text += `🔗 *Click link to preview & print full report card directly:*\n`;
  text += `${directResultUrl}\n\n`;
  text += `Thank you for partnering with ${school.name}!\n`;
  text += `📞 ${school.phone}`;

  return text;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  school,
  student,
  results,
  term,
  session,
}) => {
  const initialPhone = student.parentWhatsapp || student.parentPhone || student.phone || '';
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [savePhoneToUser, setSavePhoneToUser] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
  const messageText = generateWhatsAppResultText(school, student, results, term, session);

  const handleSendWhatsApp = () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a valid WhatsApp phone number for the parent.');
      return;
    }

    // Optionally update user record in storage with parent phone
    if (savePhoneToUser && 'id' in student && student.id) {
      const allUsers = storageService.getUsers();
      const target = allUsers.find((u) => u.id === student.id || u.regNo === student.regNo);
      if (target) {
        target.parentWhatsapp = phoneNumber;
        target.parentPhone = phoneNumber;
        storageService.updateUser(target);
      }
    }

    const encodedMsg = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
    setStatusMsg('WhatsApp window opened successfully!');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700/80 rounded-xl border border-emerald-600 shadow-inner">
              <MessageCircle className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight uppercase">Send Result via WhatsApp</h3>
              <p className="text-xs text-emerald-200 font-medium">Direct result dispatch to parent WhatsApp number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:bg-emerald-700/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Student Banner */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student</span>
              <p className="font-bold text-slate-900 text-sm">{student.name}</p>
              <p className="text-xs text-slate-500 font-mono">{student.regNo} • {student.className || 'Class N/A'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session</span>
              <p className="text-xs font-bold text-amber-700">{term} ({session})</p>
              <p className="text-xs text-emerald-700 font-black">{results.length} Subjects</p>
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>Parent WhatsApp Registration Number</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. +234 803 123 4567 or 08031234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white shadow-sm"
              />
              <span className="absolute right-3 top-3 text-xs text-slate-400 font-mono">
                {formattedPhone ? `wa.me/${formattedPhone}` : 'No phone'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Supports international (+234...) or local Nigerian numbers (080...).</span>
            </p>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">WhatsApp Message Preview</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Edit3 className="w-3.5 h-3.5" />}
                {copied ? 'Copied Text!' : 'Copy Text'}
              </button>
            </div>
            <div className="bg-emerald-950/90 text-emerald-100 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border border-emerald-900 shadow-inner">
              {messageText}
            </div>
          </div>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={!phoneNumber.trim()}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Open WhatsApp & Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
