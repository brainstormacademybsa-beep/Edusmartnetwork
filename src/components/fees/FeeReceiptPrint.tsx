import React from 'react';
import { FeePayment, School } from '../../types';
import { PrintButton } from '../common/PrintButton';

interface FeeReceiptPrintProps {
  school: School;
  payment: FeePayment;
  onBack?: () => void;
}

export const FeeReceiptPrint: React.FC<FeeReceiptPrintProps> = ({ school, payment, onBack }) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto my-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl print:hidden shadow-md">
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200"
          >
            ← Back to Payments
          </button>
        )}
        <span className="text-xs font-bold text-amber-300">Official Payment Receipt PDF</span>
        <PrintButton label="Print Receipt PDF" />
      </div>

      {/* Printable Receipt Container */}
      <div
        id="printable-fee-receipt"
        className="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 print:shadow-none print:p-0 print:border-none font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <img src={school.logo} alt={school.name} className="w-16 h-16 rounded-lg object-cover border border-amber-500" />
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">{school.name}</h2>
              <p className="text-xs text-slate-600">{school.address}</p>
              <p className="text-xs text-slate-500">Tel: {school.phone} • Email: {school.email}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded">
              OFFICIAL RECEIPT
            </span>
            <p className="font-mono text-xs font-bold text-amber-800 mt-2">No: {payment.receiptNo}</p>
            <p className="text-[11px] text-slate-500">Date: {payment.paymentDate}</p>
          </div>
        </div>

        {/* Student & Payment Summary Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Received From</span>
            <span className="font-bold text-sm text-slate-900">{payment.studentName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Registration Number</span>
            <span className="font-mono font-bold text-sm text-amber-800">{payment.studentRegNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Class & Term</span>
            <span className="font-bold text-slate-900">{payment.className} ({payment.term})</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Channel</span>
            <span className="font-semibold text-blue-900">{payment.paymentMethod}</span>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <table className="w-full text-xs border-collapse border border-slate-300 my-4">
          <thead>
            <tr className="bg-slate-900 text-white font-bold">
              <th className="p-2 border border-slate-700 text-left">DESCRIPTION</th>
              <th className="p-2 border border-slate-700 text-right">EXPECTED</th>
              <th className="p-2 border border-slate-700 text-right">AMOUNT PAID</th>
              <th className="p-2 border border-slate-700 text-right">BALANCE OWING</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2.5 border border-slate-300 font-medium">
                {payment.term} ({payment.session}) School Fees & Auxiliary Dues
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono">${payment.totalExpected}</td>
              <td className="p-2.5 border border-slate-300 text-right font-mono font-bold text-emerald-700">
                ${payment.amountPaid}
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono font-bold text-red-700">
                ${payment.balanceRemaining}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Status Badge & Remarks */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs my-2">
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Payment Status</span>
            <span
              className={`font-black uppercase tracking-wider text-sm ${
                payment.status === 'PAID'
                  ? 'text-emerald-700'
                  : payment.status === 'PARTIAL'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}
            >
              {payment.status === 'PAID' ? '✓ FULLY PAID' : payment.status === 'PARTIAL' ? '⚡ PART PAYMENT' : '❌ UNPAID'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] uppercase block">Bursar Remarks</span>
            <span className="italic text-slate-700">{payment.remarks || 'Thank you for your prompt payment.'}</span>
          </div>
        </div>

        {/* Footer & Stamps */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
          <div>
            <div className="h-8 font-serif italic text-slate-400 flex items-center justify-center">
              Verified by Bursar
            </div>
            <div className="border-t border-slate-800 font-bold text-slate-800 pt-1">Bursary Dept Signature</div>
          </div>
          <div>
            <div className="h-8 font-serif italic text-amber-700 font-bold flex items-center justify-center">
              [PAID & STAMPED]
            </div>
            <div className="border-t border-slate-800 font-bold text-slate-800 pt-1">Official School Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
