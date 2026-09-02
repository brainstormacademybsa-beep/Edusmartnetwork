import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  label?: string;
  className?: string;
  onPrint?: () => void;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  label = 'Print Document / Export PDF',
  className = '',
  onPrint,
}) => {
  const handlePrint = () => {
    if (onPrint) onPrint();
    window.print();
  };

  return (
    <button
      type="button"
      id="btn-print-action"
      onClick={handlePrint}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold rounded-lg shadow-sm hover:shadow transition-all print:hidden ${className}`}
    >
      <Printer className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};
