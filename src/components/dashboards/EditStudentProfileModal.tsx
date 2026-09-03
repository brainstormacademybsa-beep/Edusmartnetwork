import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Users,
  HeartHandshake,
  ShieldCheck,
  Upload,
  Calendar,
  Home,
  FileText,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { User as UserType, School } from '../../types';
import { DEFAULT_SCHOOL_CLASSES } from '../../constants/classes';
import { NIGERIAN_STATES_AND_LGAS, calculateAgeFromDob } from '../../constants/locations';
import { storageService } from '../../services/storageService';

interface EditStudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserType | null;
  school: School;
  onSaved: (updatedStudent: UserType) => void;
}

export const EditStudentProfileModal: React.FC<EditStudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  school,
  onSaved,
}) => {
  const [name, setName] = useState(student?.name || '');
  const [className, setClassName] = useState(student?.className || 'JSS 1A');
  const [gender, setGender] = useState(student?.gender || 'Male');
  const [dob, setDob] = useState(student?.dob || '2015-05-12');
  const [admissionDate, setAdmissionDate] = useState(student?.admissionDate || new Date().toISOString().split('T')[0]);
  const [previousSchool, setPreviousSchool] = useState(student?.previousSchool || '');
  const [lastClassAttended, setLastClassAttended] = useState(student?.lastClassAttended || '');
  const [nationality, setNationality] = useState(student?.nationality || 'Nigerian');
  const [religion, setReligion] = useState(student?.religion || 'Christianity');
  const [stateOfOrigin, setStateOfOrigin] = useState(student?.stateOfOrigin || 'Lagos');
  const [lga, setLga] = useState(student?.lga || 'Ikeja');
  const [residentAddress, setResidentAddress] = useState(student?.residentAddress || '');
  const [avatarUrl, setAvatarUrl] = useState(student?.avatarUrl || '');

  // Living Arrangement
  const [livingWith, setLivingWith] = useState<string>(student?.livingWith || 'Biological Parents');
  const [primaryContactPerson, setPrimaryContactPerson] = useState(student?.primaryContactPerson || 'Both Parents');

  // Biological Parents
  const [fatherName, setFatherName] = useState(student?.fatherName || '');
  const [fatherPhone, setFatherPhone] = useState(student?.fatherPhone || '');
  const [fatherOccupation, setFatherOccupation] = useState(student?.fatherOccupation || '');
  const [motherName, setMotherName] = useState(student?.motherName || '');
  const [motherPhone, setMotherPhone] = useState(student?.motherPhone || '');
  const [motherOccupation, setMotherOccupation] = useState(student?.motherOccupation || '');

  // Guardian / Guidance
  const [guardianName, setGuardianName] = useState(student?.guardianName || '');
  const [guardianRelationship, setGuardianRelationship] = useState(student?.guardianRelationship || 'Uncle');
  const [guardianPhone, setGuardianPhone] = useState(student?.guardianPhone || '');
  const [guardianWhatsapp, setGuardianWhatsapp] = useState(student?.guardianWhatsapp || '');
  const [guardianOccupation, setGuardianOccupation] = useState(student?.guardianOccupation || '');
  const [guardianAddress, setGuardianAddress] = useState(student?.guardianAddress || '');

  // Primary Notification lines
  const [parentPhone, setParentPhone] = useState(student?.parentPhone || '');
  const [parentWhatsapp, setParentWhatsapp] = useState(student?.parentWhatsapp || '');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setClassName(student.className || 'JSS 1A');
      setGender(student.gender || 'Male');
      setDob(student.dob || '2015-05-12');
      setAdmissionDate(student.admissionDate || new Date().toISOString().split('T')[0]);
      setPreviousSchool(student.previousSchool || '');
      setLastClassAttended(student.lastClassAttended || '');
      setNationality(student.nationality || 'Nigerian');
      setReligion(student.religion || 'Christianity');
      setStateOfOrigin(student.stateOfOrigin || 'Lagos');
      setLga(student.lga || 'Ikeja');
      setResidentAddress(student.residentAddress || '');
      setAvatarUrl(student.avatarUrl || '');
      setLivingWith(student.livingWith || 'Biological Parents');
      setPrimaryContactPerson(student.primaryContactPerson || 'Both Parents');
      setFatherName(student.fatherName || '');
      setFatherPhone(student.fatherPhone || '');
      setFatherOccupation(student.fatherOccupation || '');
      setMotherName(student.motherName || '');
      setMotherPhone(student.motherPhone || '');
      setMotherOccupation(student.motherOccupation || '');
      setGuardianName(student.guardianName || '');
      setGuardianRelationship(student.guardianRelationship || 'Uncle');
      setGuardianPhone(student.guardianPhone || '');
      setGuardianWhatsapp(student.guardianWhatsapp || '');
      setGuardianOccupation(student.guardianOccupation || '');
      setGuardianAddress(student.guardianAddress || '');
      setParentPhone(student.parentPhone || '');
      setParentWhatsapp(student.parentWhatsapp || '');
    }
  }, [student, isOpen]);

  const age = calculateAgeFromDob(dob);
  const availableLgas = NIGERIAN_STATES_AND_LGAS.find((s) => s.state === stateOfOrigin)?.lgas || [];

  const handleStateChange = (newState: string) => {
    setStateOfOrigin(newState);
    const found = NIGERIAN_STATES_AND_LGAS.find((s) => s.state === newState);
    if (found && found.lgas.length > 0) {
      setLga(found.lgas[0]);
    } else {
      setLga('');
    }
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAvatarUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const updatedUser: UserType = {
      ...student,
      name: name.trim() || student.name,
      className,
      gender,
      dob,
      age: age || undefined,
      admissionDate: admissionDate || new Date().toISOString().split('T')[0],
      previousSchool: previousSchool.trim(),
      lastClassAttended: lastClassAttended.trim(),
      nationality: nationality.trim() || 'Nigerian',
      religion: religion.trim() || 'Christianity',
      stateOfOrigin,
      lga,
      residentAddress: residentAddress.trim(),
      avatarUrl: avatarUrl || student.avatarUrl,
      studentPin: student.regNo,
      password: student.regNo,
      livingWith,
      primaryContactPerson,
      fatherName: fatherName.trim(),
      fatherPhone: fatherPhone.trim(),
      fatherOccupation: fatherOccupation.trim(),
      motherName: motherName.trim(),
      motherPhone: motherPhone.trim(),
      motherOccupation: motherOccupation.trim(),
      guardianName: guardianName.trim(),
      guardianRelationship: guardianRelationship.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianWhatsapp: guardianWhatsapp.trim(),
      guardianOccupation: guardianOccupation.trim(),
      guardianAddress: guardianAddress.trim(),
      parentPhone: parentPhone.trim() || fatherPhone.trim() || motherPhone.trim() || guardianPhone.trim(),
      parentWhatsapp: parentWhatsapp.trim() || guardianWhatsapp.trim() || parentPhone.trim(),
    };

    storageService.updateUser(updatedUser);
    onSaved(updatedUser);
    setToastMsg('Student profile updated successfully!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-blue-900 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl || student.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
              alt={student.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">{student.name}</h3>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded uppercase font-mono">
                  {student.regNo}
                </span>
              </div>
              <p className="text-xs text-blue-200">Edit Student Bio-Data, Living Arrangement & Guardian Details</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg text-blue-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 sm:p-6 space-y-6 text-xs grow">
          {toastMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Bio Data */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-blue-900 font-black uppercase tracking-widest text-[11px] flex items-center gap-2 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-amber-500" /> 1. Student Bio-Data & Classroom
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Full Student Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-sm font-semibold focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Assigned Class
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900"
                >
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
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Date of Admission
                </label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Calculated Age
                </label>
                <div className="w-full bg-slate-200 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold flex items-center justify-between">
                  <span>{age > 0 ? `${age} Years` : 'Auto'}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-900 text-amber-300 rounded uppercase font-black">
                    Auto
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Religion
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                >
                  <option value="Christianity">Christianity</option>
                  <option value="Islam">Islam</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g. Nigerian"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  State of Origin
                </label>
                <select
                  value={stateOfOrigin}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                >
                  {NIGERIAN_STATES_AND_LGAS.map((item) => (
                    <option key={item.state} value={item.state}>
                      {item.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Local Govt Area (LGA)
                </label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                >
                  {availableLgas.map((lgaItem) => (
                    <option key={lgaItem} value={lgaItem}>
                      {lgaItem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Previous Academic Background */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block">
                📚 Previous Academic History
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                    Previous School Attended
                  </label>
                  <input
                    type="text"
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    placeholder="e.g. Corona Primary School, Gbagada, Lagos"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                    Last Class Attended / Passed
                  </label>
                  <input
                    type="text"
                    value={lastClassAttended}
                    onChange={(e) => setLastClassAttended(e.target.value)}
                    placeholder="e.g. Primary 5, Basic 6, or JSS 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={residentAddress}
                onChange={(e) => setResidentAddress(e.target.value)}
                placeholder="Street address, landmark, town"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Passport Photo Change */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                  alt="Student Passport"
                  className="w-10 h-12 rounded object-cover border border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[10px] block">Student Photo</span>
                  <span className="text-[9px] text-slate-500">Official passport portrait</span>
                </div>
              </div>
              <label className="cursor-pointer px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-amber-300 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload New Photo</span>
                <input type="file" accept="image/*" onChange={handlePassportUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Section 2: Living Arrangement Differentiation */}
          <div className="space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
            <h4 className="text-amber-950 font-black uppercase tracking-widest text-[11px] flex items-center gap-2 border-b border-amber-200 pb-2">
              <Home className="w-4 h-4 text-amber-700" /> 2. Living Arrangement & Caregiver Status
            </h4>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Who does the child live with?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Biological Parents', 'Father Only', 'Mother Only', 'Guardian / Relative'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLivingWith(opt)}
                    className={`p-2.5 rounded-lg border text-center font-bold text-[11px] transition ${
                      livingWith === opt
                        ? 'bg-blue-900 text-amber-300 border-blue-950 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Biological Parents Details */}
          <div className="space-y-4 bg-blue-50/40 p-4 rounded-xl border border-blue-200">
            <h4 className="text-blue-950 font-black uppercase tracking-widest text-[11px] flex items-center gap-2 border-b border-blue-200 pb-2">
              <Users className="w-4 h-4 text-blue-800" /> 3. Biological Parents Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div className="sm:col-span-3 font-bold text-blue-900 uppercase text-[10px]">👨 Father Details</div>
              <div>
                <label className="block text-slate-600 text-[9px] font-semibold mb-1">Father's Name</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Mr. Father Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[9px] font-semibold mb-1">Father's Phone</label>
                <input
                  type="tel"
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[9px] font-semibold mb-1">Father's Occupation</label>
                <input
                  type="text"
                  value={fatherOccupation}
                  onChange={(e) => setFatherOccupation(e.target.value)}
                  placeholder="Occupation"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div className="sm:col-span-3 font-bold text-blue-900 uppercase text-[10px]">👩 Mother Details</div>
              <div>
                <label className="block text-slate-600 text-[9px] font-semibold mb-1">Mother's Name</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Mrs. Mother Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[9px] font-semibold mb-1">Mother's Phone</label>
                <input
                  type="tel"
                  value={motherPhone}
                  onChange={(e) => setMotherPhone(e.target.value)}
                  placeholder="+234 802 000 0000"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[9px] font-semibold mb-1">Mother's Occupation</label>
                <input
                  type="text"
                  value={motherOccupation}
                  onChange={(e) => setMotherOccupation(e.target.value)}
                  placeholder="Occupation"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Guardian / Guidance Information */}
          <div className="space-y-4 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
            <h4 className="text-emerald-950 font-black uppercase tracking-widest text-[11px] flex items-center gap-2 border-b border-emerald-200 pb-2">
              <HeartHandshake className="w-4 h-4 text-emerald-800" /> 4. Guardian / Guidance Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold text-[9px] mb-1">Guardian Full Name</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Dr. Emeka Guardian"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold text-[9px] mb-1">Relationship to Student</label>
                <select
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold"
                >
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Grandfather">Grandfather</option>
                  <option value="Grandmother">Grandmother</option>
                  <option value="Elder Sibling">Elder Sibling</option>
                  <option value="Foster Parent">Foster Parent</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Other Relative">Other Relative</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold text-[9px] mb-1">Guardian Phone (Calls/SMS)</label>
                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold text-[9px] mb-1">Guardian WhatsApp</label>
                <input
                  type="tel"
                  value={guardianWhatsapp}
                  onChange={(e) => setGuardianWhatsapp(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold text-[9px] mb-1">Guardian Occupation</label>
                <input
                  type="text"
                  value={guardianOccupation}
                  onChange={(e) => setGuardianOccupation(e.target.value)}
                  placeholder="Occupation"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold text-[9px] mb-1">Guardian Address</label>
              <input
                type="text"
                value={guardianAddress}
                onChange={(e) => setGuardianAddress(e.target.value)}
                placeholder="Guardian Residential Address"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Section 5: Portal Access & Notification Credentials */}
          <div className="space-y-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
            <h4 className="text-slate-900 font-black uppercase tracking-widest text-[11px] flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-900" /> 5. Portal Credentials & Notification Dispatch
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Primary SMS Line
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Primary WhatsApp Line
                </label>
                <input
                  type="tel"
                  value={parentWhatsapp}
                  onChange={(e) => setParentWhatsapp(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-950 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-blue-900 uppercase text-[10px] tracking-wider">
                  Student Portal Access & Password:
                </span>
                <span>
                  Students maintain their assigned Registration Number (<strong className="font-mono text-blue-950">{student.regNo}</strong>) as their password for student portal access. No separate password or PIN configuration is required.
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 italic">
              * Incomplete fields are allowed and can be re-edited anytime.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold uppercase rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black uppercase tracking-wider rounded-lg text-xs shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Student Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
