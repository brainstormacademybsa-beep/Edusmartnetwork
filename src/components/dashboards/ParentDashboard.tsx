import React, { useState } from 'react';
import { Users, Award, DollarSign, Printer, ChevronRight } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { School, User } from '../../types';
import { ResultCardPrint } from '../results/ResultCardPrint';

interface ParentDashboardProps {
  school: School;
  parent: User;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ school, parent }) => {
  const allUsers = storageService.getUsers();
  const childRegNos = parent.childRegNos || ['CRA/2026/001', 'CRA/2026/002'];
  const children = allUsers.filter((u) => childRegNos.includes(u.regNo));

  const [selectedChildRegNo, setSelectedChildRegNo] = useState(childRegNos[0] || '');

  const activeChild = children.find((c) => c.regNo === selectedChildRegNo) || children[0] || {
    id: 'temp',
    schoolId: school.id,
    regNo: 'CRA/2026/001',
    name: 'Tobi Adeleke',
    email: '',
    role: 'STUDENT' as const,
    className: 'JSS 1A',
  };

  const childResults = storageService.getResults(school.id).filter((r) => r.studentRegNo === activeChild.regNo);
  const childPayments = storageService.getFeePayments(school.id).filter((p) => p.studentRegNo === activeChild.regNo);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Parent Banner */}
      <div className="bg-blue-900 border-b-4 border-amber-500 rounded p-6 shadow-sm text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={parent.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}
              alt={parent.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-blue-950 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full border-2 border-blue-900">
              <Users className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Parent Portal • {parent.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
                Account: <span className="text-white">Guardian</span>
              </p>
              <div className="w-1 h-1 rounded-full bg-blue-700"></div>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
                Linked Wards: <span className="text-white">{children.length} Students</span>
              </p>
            </div>
          </div>
        </div>

        {/* Children Selector */}
        <div className="flex items-center gap-2 bg-blue-950 p-2 rounded border border-blue-800">
          <span className="text-blue-400 font-black uppercase tracking-widest text-[9px] px-2">Select Ward Profile:</span>
          <div className="flex items-center gap-1.5">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChildRegNo(c.regNo)}
                className={`px-3 py-1.5 rounded font-black uppercase tracking-widest text-[10px] transition flex items-center gap-2 shadow-sm ${
                  activeChild.regNo === c.regNo
                    ? 'bg-amber-500 text-slate-950 scale-105'
                    : 'bg-blue-900 text-blue-200 hover:text-white hover:bg-blue-800'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[9px] opacity-70 font-mono">[{c.className}]</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Child Report Card Section */}
      <ResultCardPrint
        school={school}
        student={activeChild}
        results={childResults}
        term="First Term"
        session="2025/2026"
      />

      {/* Ward Fee Payments Ledger */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 text-xs">
        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
          <DollarSign className="w-5 h-5 text-amber-500" />
          <span>Fee Ledger & Financial Receipts: {activeChild.name}</span>
        </h2>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                <th className="p-3">Receipt No</th>
                <th className="p-3">Term & Session</th>
                <th className="p-3">Amount Paid</th>
                <th className="p-3">Balance Remaining</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {childPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-900">{p.receiptNo}</td>
                  <td className="p-3 font-semibold text-slate-900">{p.term} ({p.session})</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">${p.amountPaid}</td>
                  <td className="p-3 font-mono font-bold text-red-600">${p.balanceRemaining}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold uppercase tracking-wider rounded text-xs shadow-sm"
                    >
                      Print Receipt PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
