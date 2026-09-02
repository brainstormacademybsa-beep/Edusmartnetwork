import React from 'react';
import { AdmissionApplication, School } from '../../types';
import { PrintButton } from '../common/PrintButton';
import { Edit3, Users, HeartHandshake, ShieldCheck, Home } from 'lucide-react';

interface AdmissionSlipPrintProps {
  school: School;
  admission: AdmissionApplication;
  onBack?: () => void;
  onEdit?: () => void;
}

export const AdmissionSlipPrint: React.FC<AdmissionSlipPrintProps> = ({
  school,
  admission,
  onBack,
  onEdit,
}) => {
  return (
    <div className="space-y-4 max-w-3xl mx-auto my-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 text-white p-4 rounded-xl print:hidden shadow-md gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition"
            >
              ← Back
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-950" /> Edit & Re-Submit Form
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-300 hidden sm:inline">Official Application Slip PDF</span>
          <PrintButton label="Print / Export Admission Slip" />
        </div>
      </div>

      <div
        id="printable-admission-slip"
        className="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 print:shadow-none print:p-0 print:border-none font-sans space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <img src={school.logo} alt={school.name} className="w-16 h-16 rounded-lg object-cover border border-amber-500" />
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">{school.name}</h1>
              <p className="text-xs text-slate-600">{school.address}</p>
              <p className="text-xs text-slate-500">Contact: {school.phone} • {school.email}</p>
              <p className="text-xs italic font-serif text-amber-800 font-semibold mt-0.5">"{school.motto}"</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded">
              ADMISSION APPLICATION SLIP
            </span>
            <p className="font-mono text-xs font-bold text-amber-800 mt-2">Ref: {admission.id}</p>
            <p className="text-[10px] text-slate-500">Submitted: {new Date(admission.submittedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Living Arrangement Status Badge */}
        <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-amber-800" />
            <span className="font-bold text-amber-950 uppercase text-[10px]">Student Living Status:</span>
            <span className="px-2 py-0.5 bg-blue-900 text-amber-300 font-bold rounded text-[10px] uppercase">
              {admission.livingWith || 'Biological Parents'}
            </span>
          </div>
          {admission.primaryContactPerson && (
            <span className="text-slate-600 text-[11px]">
              Primary Contact: <strong className="text-slate-900">{admission.primaryContactPerson}</strong>
            </span>
          )}
        </div>

        {/* Section 1: Student Bio Data + Passport */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-32 shrink-0 text-center">
            <img
              src={admission.passportUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
              alt={admission.studentName}
              className="w-32 h-36 rounded-lg object-cover border-2 border-amber-500/80 shadow-md mx-auto"
            />
            <span className="text-[10px] text-slate-500 block mt-1 font-bold uppercase">APPLICANT PASSPORT</span>
          </div>

          <div className="grow grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold">Applicant Full Name</span>
              <span className="font-bold text-sm text-slate-900">{admission.studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold">Class Applying For</span>
              <span className="font-bold text-blue-900 text-sm">{admission.classApplying}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold">Date of Admission</span>
              <span className="font-bold text-slate-900">
                {admission.admissionDate || new Date(admission.submittedAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold">Date of Birth & Age</span>
              <span className="font-bold text-slate-800">
                {admission.dob} {admission.age ? `(${admission.age} yrs)` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold">Gender & Religion</span>
              <span className="font-bold text-slate-800">
                {admission.gender} {admission.religion ? `• ${admission.religion}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold">Nationality</span>
              <span className="font-bold text-slate-800">{admission.nationality || 'Nigerian'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold">State of Origin & LGA</span>
              <span className="font-bold text-slate-800">
                {admission.stateOfOrigin || 'N/A'}{admission.lga ? ` • ${admission.lga} LGA` : ''}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block uppercase text-[9px] font-bold">Student Residential Address</span>
              <span className="font-medium text-slate-800">{admission.residentAddress || admission.address || 'N/A'}</span>
            </div>
            {(admission.previousSchool || admission.lastClassAttended) && (
              <div className="sm:col-span-3 pt-1 border-t border-slate-200">
                <span className="text-slate-500 block uppercase text-[9px] font-bold">Previous Academic History</span>
                <span className="text-slate-800 text-[11px] font-medium">
                  {admission.previousSchool ? `School: ${admission.previousSchool}` : ''}
                  {admission.previousSchool && admission.lastClassAttended ? ' • ' : ''}
                  {admission.lastClassAttended ? `Last Class Attended: ${admission.lastClassAttended}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Differentiated Parents & Guidance Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Biological Parents Card */}
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold uppercase text-[10px] border-b border-blue-200 pb-1">
              <Users className="w-3.5 h-3.5" /> Biological Parents Details
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px] block font-semibold">Father's Name & Phone:</span>
                <span className="font-bold text-slate-900">
                  {admission.fatherName || 'Not Provided'} {admission.fatherPhone ? `(${admission.fatherPhone})` : ''}
                </span>
                {admission.fatherOccupation && (
                  <span className="text-slate-600 text-[10px] block">Occ: {admission.fatherOccupation}</span>
                )}
              </div>
              <div className="pt-1">
                <span className="text-slate-500 text-[10px] block font-semibold">Mother's Name & Phone:</span>
                <span className="font-bold text-slate-900">
                  {admission.motherName || 'Not Provided'} {admission.motherPhone ? `(${admission.motherPhone})` : ''}
                </span>
                {admission.motherOccupation && (
                  <span className="text-slate-600 text-[10px] block">Occ: {admission.motherOccupation}</span>
                )}
              </div>
            </div>
          </div>

          {/* Guardian / Guidance Card */}
          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold uppercase text-[10px] border-b border-emerald-200 pb-1">
              <HeartHandshake className="w-3.5 h-3.5" /> Guardian / Guidance Details
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px] block font-semibold">Guardian Name & Relationship:</span>
                <span className="font-bold text-slate-900">
                  {admission.guardianName || 'N/A'} {admission.guardianRelationship ? `[${admission.guardianRelationship}]` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block font-semibold">Guardian Phone & WhatsApp:</span>
                <span className="font-medium text-slate-800">
                  {admission.guardianPhone || admission.parentPhone || 'N/A'}
                  {admission.guardianWhatsapp ? ` • WhatsApp: ${admission.guardianWhatsapp}` : ''}
                </span>
              </div>
              {admission.guardianAddress && (
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">Guardian Address:</span>
                  <span className="font-medium text-slate-800">{admission.guardianAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Contact Dispatches */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 uppercase text-[10px] font-bold block">Terminal Result Notification Line:</span>
            <span className="font-bold font-mono text-slate-900">
              {admission.parentPhone || admission.fatherPhone || admission.motherPhone || admission.guardianPhone || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] font-bold block text-right">Official WhatsApp Line:</span>
            <span className="font-bold font-mono text-emerald-700">
              {admission.parentWhatsapp || admission.guardianWhatsapp || admission.parentPhone || 'N/A'}
            </span>
          </div>
        </div>

        {/* Status Box */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="text-amber-900 text-[10px] uppercase font-bold block">Application Approval Status</span>
            <span className={`text-sm font-black uppercase tracking-wider ${admission.status === 'APPROVED' ? 'text-emerald-700' : 'text-amber-800'}`}>
              {admission.status === 'APPROVED' ? `✓ ADMITTED (Assigned RegNo: ${admission.regNoAssigned})` : '⏳ UNDER REVIEW BY ADMISSIONS BOARD'}
            </span>
          </div>

          <div className="text-right font-mono text-[10px] text-amber-800">
            [VERIFICATION BARCODE]
          </div>
        </div>

        {/* Declaration & Signatures */}
        <div className="space-y-4 pt-4 border-t border-slate-300 text-xs">
          <p className="text-slate-600 text-[11px] italic">
            <strong>Parent/Guardian Declaration:</strong> I hereby certify that the student bio-data, parent, and guardian living information provided in this application form is true and accurate.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-6 text-center">
            <div>
              <div className="h-8 font-serif italic text-slate-400 flex items-center justify-center">
                Signed by Parent / Guardian
              </div>
              <div className="border-t border-slate-800 font-bold text-slate-800 pt-1">Parent/Guardian Signature</div>
            </div>
            <div>
              <div className="h-8 font-serif italic text-amber-800 font-bold flex items-center justify-center">
                Admissions Officer
              </div>
              <div className="border-t border-slate-800 font-bold text-slate-800 pt-1">School Registrar Stamp & Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
