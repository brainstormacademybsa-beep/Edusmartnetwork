import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Upload,
  CheckCircle2,
  Sparkles,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  Users,
  HeartHandshake,
  Phone,
  Search,
  Edit3,
  Check,
  AlertCircle,
  Home,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { AdmissionApplication, School } from '../../types';
import { DEFAULT_SCHOOL_CLASSES } from '../../constants/classes';
import { NIGERIAN_STATES_AND_LGAS, calculateAgeFromDob } from '../../constants/locations';
import { AdmissionSlipPrint } from './AdmissionSlipPrint';

interface OnlineAdmissionFormProps {
  school: School;
  onSubmitted?: () => void;
  initialApplicationToEdit?: AdmissionApplication | null;
}

export const OnlineAdmissionForm: React.FC<OnlineAdmissionFormProps> = ({
  school,
  onSubmitted,
  initialApplicationToEdit,
}) => {
  // Mode: creating new vs editing existing
  const [editingAppId, setEditingAppId] = useState<string | null>(initialApplicationToEdit?.id || null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [showLookup, setShowLookup] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);

  // Student Bio-Data
  const [studentName, setStudentName] = useState('');
  const [dob, setDob] = useState('2015-06-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [classApplying, setClassApplying] = useState('JSS 1');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [previousSchool, setPreviousSchool] = useState('');
  const [lastClassAttended, setLastClassAttended] = useState('');
  const [nationality, setNationality] = useState('Nigerian');
  const [religion, setReligion] = useState('Christianity');
  const [stateOfOrigin, setStateOfOrigin] = useState('Lagos');
  const [lga, setLga] = useState('Ikeja');
  const [residentAddress, setResidentAddress] = useState('');
  const [passportUrl, setPassportUrl] = useState('');
  const [autoStudentId, setAutoStudentId] = useState('');

  // Living Arrangement Differentiation
  const [livingWith, setLivingWith] = useState<string>('Biological Parents');
  const [primaryContactPerson, setPrimaryContactPerson] = useState<'Both Parents' | 'Father' | 'Mother' | 'Guardian'>('Both Parents');

  // Biological Parents Details
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');

  // Guardian / Guidance Details
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Uncle');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianWhatsapp, setGuardianWhatsapp] = useState('');
  const [guardianOccupation, setGuardianOccupation] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('');

  // Primary Notification Contact
  const [parentPhone, setParentPhone] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');

  const [submittedApp, setSubmittedApp] = useState<AdmissionApplication | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Auto calculate age dynamically
  const age = calculateAgeFromDob(dob);

  // Available LGAs for chosen state
  const availableLgas = NIGERIAN_STATES_AND_LGAS.find((s) => s.state === stateOfOrigin)?.lgas || [];

  // Generate dynamic Student ID / Application ID
  const generateNewStudentId = () => {
    const initials = school.subdomain ? school.subdomain.toUpperCase().slice(0, 3) : 'SCH';
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const newId = `${initials}/2026/${randomSeq}`;
    setAutoStudentId(newId);
  };

  // Populate form from existing application
  const loadApplicationIntoForm = (app: AdmissionApplication) => {
    setEditingAppId(app.id);
    setStudentName(app.studentName || '');
    setDob(app.dob || '2015-06-15');
    setGender(app.gender || 'Male');
    setClassApplying(app.classApplying || 'JSS 1');
    setAdmissionDate(app.admissionDate || new Date().toISOString().split('T')[0]);
    setPreviousSchool(app.previousSchool || '');
    setLastClassAttended(app.lastClassAttended || '');
    setNationality(app.nationality || 'Nigerian');
    setReligion(app.religion || 'Christianity');
    setStateOfOrigin(app.stateOfOrigin || 'Lagos');
    setLga(app.lga || 'Ikeja');
    setResidentAddress(app.residentAddress || app.address || '');
    setPassportUrl(app.passportUrl || '');
    setLivingWith(app.livingWith || 'Biological Parents');
    setPrimaryContactPerson((app.primaryContactPerson as any) || 'Both Parents');
    setFatherName(app.fatherName || '');
    setFatherPhone(app.fatherPhone || '');
    setFatherOccupation(app.fatherOccupation || '');
    setMotherName(app.motherName || '');
    setMotherPhone(app.motherPhone || '');
    setMotherOccupation(app.motherOccupation || '');
    setGuardianName(app.guardianName || '');
    setGuardianRelationship(app.guardianRelationship || 'Uncle');
    setGuardianPhone(app.guardianPhone || '');
    setGuardianWhatsapp(app.guardianWhatsapp || '');
    setGuardianOccupation(app.guardianOccupation || '');
    setGuardianAddress(app.guardianAddress || '');
    setParentPhone(app.parentPhone || '');
    setParentWhatsapp(app.parentWhatsapp || '');
    setAutoStudentId(app.regNoAssigned || app.id);
    setSubmittedApp(null);
    setSuccessNotice(`Loaded application ${app.id} for editing. You can modify any details and re-submit anytime.`);
  };

  useEffect(() => {
    if (initialApplicationToEdit) {
      loadApplicationIntoForm(initialApplicationToEdit);
    } else {
      generateNewStudentId();
    }
  }, [school, initialApplicationToEdit]);

  // When state changes, reset LGA to first available
  const handleStateChange = (newState: string) => {
    setStateOfOrigin(newState);
    const stateObj = NIGERIAN_STATES_AND_LGAS.find((s) => s.state === newState);
    if (stateObj && stateObj.lgas.length > 0) {
      setLga(stateObj.lgas[0]);
    } else {
      setLga('');
    }
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPassportUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lookup existing application by ID or student name
  const handleLookupApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    const allApps = storageService.getAdmissions(school.id);
    const found = allApps.find(
      (a) =>
        a.id.toLowerCase() === lookupQuery.trim().toLowerCase() ||
        a.studentName.toLowerCase().includes(lookupQuery.trim().toLowerCase()) ||
        a.parentPhone?.includes(lookupQuery.trim())
    );

    if (found) {
      loadApplicationIntoForm(found);
      setShowLookup(false);
      setLookupFeedback(null);
    } else {
      setLookupFeedback(`No application found matching "${lookupQuery}". Please check the reference ID or name.`);
    }
  };

  // Form submission handler (Blank fields do NOT stop submission)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine primary guardian/parent display name & phone
    const derivedParentName =
      livingWith === 'Biological Parents'
        ? fatherName || motherName || 'Biological Parents'
        : livingWith === 'Father Only'
        ? fatherName || 'Father'
        : livingWith === 'Mother Only'
        ? motherName || 'Mother'
        : guardianName
        ? `${guardianName} (${guardianRelationship || 'Guardian'})`
        : fatherName || motherName || 'Parent / Guardian';

    const derivedPrimaryPhone =
      parentPhone.trim() ||
      (livingWith.includes('Guardian') ? guardianPhone : fatherPhone || motherPhone) ||
      '';

    const derivedPrimaryWhatsapp =
      parentWhatsapp.trim() ||
      (livingWith.includes('Guardian') ? guardianWhatsapp || guardianPhone : fatherPhone || motherPhone) ||
      derivedPrimaryPhone;

    // Graceful fallback for blank student name
    const finalStudentName = studentName.trim() || `Applicant (${autoStudentId})`;

    if (editingAppId) {
      // Update existing application
      const updatedApp: AdmissionApplication = {
        id: editingAppId,
        schoolId: school.id,
        schoolName: school.name,
        studentName: finalStudentName,
        dob,
        age: age || undefined,
        gender,
        admissionDate: admissionDate || new Date().toISOString().split('T')[0],
        previousSchool: previousSchool.trim(),
        lastClassAttended: lastClassAttended.trim(),
        nationality: nationality.trim() || 'Nigerian',
        religion: religion.trim() || 'Christianity',
        stateOfOrigin,
        lga,
        classApplying,
        parentName: derivedParentName,
        parentPhone: derivedPrimaryPhone,
        parentWhatsapp: derivedPrimaryWhatsapp,
        address: residentAddress.trim() || guardianAddress.trim(),
        residentAddress: residentAddress.trim(),
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
        passportUrl: passportUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      };

      storageService.updateAdmission(updatedApp);
      setSubmittedApp(updatedApp);
      setSuccessNotice(`Application ${editingAppId} has been successfully updated and re-submitted!`);
    } else {
      // Create new application
      const newApp = storageService.submitAdmission({
        schoolId: school.id,
        schoolName: school.name,
        studentName: finalStudentName,
        dob,
        age: age || undefined,
        gender,
        admissionDate: admissionDate || new Date().toISOString().split('T')[0],
        previousSchool: previousSchool.trim(),
        lastClassAttended: lastClassAttended.trim(),
        nationality: nationality.trim() || 'Nigerian',
        religion: religion.trim() || 'Christianity',
        stateOfOrigin,
        lga,
        classApplying,
        parentName: derivedParentName,
        parentPhone: derivedPrimaryPhone,
        parentWhatsapp: derivedPrimaryWhatsapp,
        address: residentAddress.trim() || guardianAddress.trim(),
        residentAddress: residentAddress.trim(),
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
        passportUrl: passportUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      });

      setSubmittedApp(newApp);
      setEditingAppId(newApp.id);
      setSuccessNotice(`Application submitted successfully! Your Reference ID is ${newApp.id}.`);
    }

    if (onSubmitted) onSubmitted();
  };

  // If viewing the generated admission slip
  if (submittedApp) {
    return (
      <div className="space-y-6">
        <div className="bg-emerald-900/90 border border-emerald-400/50 p-5 rounded-xl text-center text-white shadow-lg space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto" />
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">
              {editingAppId ? 'Application Updated & Re-Submitted!' : 'Admission Application Submitted Successfully!'}
            </h3>
            <p className="text-xs text-emerald-100 mt-1 max-w-xl mx-auto">
              Your application reference is <strong className="font-mono text-amber-300 bg-emerald-950 px-2 py-0.5 rounded">{submittedApp.id}</strong>.
              You can print your slip or edit any section at any time.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                loadApplicationIntoForm(submittedApp);
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow flex items-center gap-2 transition"
            >
              <Edit3 className="w-4 h-4" /> Edit & Update Application Details
            </button>
            <button
              onClick={() => {
                setEditingAppId(null);
                setStudentName('');
                setFatherName('');
                setMotherName('');
                setGuardianName('');
                setSubmittedApp(null);
                generateNewStudentId();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              + Submit Another Application
            </button>
          </div>
        </div>

        <AdmissionSlipPrint
          school={school}
          admission={submittedApp}
          onBack={() => setSubmittedApp(null)}
          onEdit={() => loadApplicationIntoForm(submittedApp)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-md text-slate-800 space-y-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-900 text-amber-400 rounded-xl shadow-md ring-4 ring-blue-50">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tight">
              {editingAppId ? 'Edit & Update Admission Application' : 'Student Registration & Admission'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Official portal for <strong className="text-blue-900 font-black uppercase text-[11px]">{school.name}</strong>
            </p>
          </div>
        </div>

        {/* Action / ID Box */}
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-right w-full sm:w-auto">
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-900 block">
              {editingAppId ? 'Editing Application Ref' : 'Auto Generated Student ID'}
            </span>
            <div className="flex items-center gap-2 mt-0.5 justify-end">
              <span className="font-mono font-black text-blue-950 text-sm">
                {editingAppId || autoStudentId}
              </span>
              {!editingAppId && (
                <button
                  type="button"
                  onClick={generateNewStudentId}
                  title="Generate new ID number"
                  className="p-1 hover:bg-blue-100 rounded text-blue-900 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLookup(!showLookup)}
            className="text-[10px] text-blue-900 hover:text-blue-700 font-bold flex items-center gap-1 underline underline-offset-2"
          >
            <Search className="w-3 h-3" />
            {showLookup ? 'Hide Application Lookup' : 'Edit an Existing Application?'}
          </button>
        </div>
      </div>

      {/* Existing Application Lookup Drawer */}
      {showLookup && (
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-600" /> Find & Edit Existing Application
            </span>
            <span className="text-[10px] text-amber-800">Enter Reference ID, student name, or phone</span>
          </div>
          <form onSubmit={handleLookupApplication} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. adm-1740000000 or Student Name"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="grow bg-white border border-amber-300 rounded px-3 py-2 text-slate-800 text-xs font-medium focus:outline-none focus:border-amber-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs uppercase"
            >
              Load Form
            </button>
          </form>
          {lookupFeedback && <p className="text-[11px] font-semibold text-rose-700">{lookupFeedback}</p>}
        </div>
      )}

      {/* Notice Banner: Blank fields will not stop submission */}
      <div className="bg-blue-50 border border-blue-200/80 p-3.5 rounded-xl flex items-start gap-3 text-xs text-blue-950">
        <AlertCircle className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block text-blue-900">Flexible Registration & Anytime Updates:</strong>
          <span className="text-slate-600 text-[11px]">
            Blank or incomplete fields will <strong>not</strong> stop you from submitting this form. You or the school administrators can return, edit, and re-submit the profile at any time.
          </span>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-bold flex items-center justify-between">
          <span>✓ {successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 text-xs">
        {/* =========================================================================
            SECTION A: STUDENT BIO-DATA
        ========================================================================= */}
        <div className="space-y-5 bg-slate-50/60 p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-blue-950 font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" /> Section 1: Student Personal Bio-Data
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Child Identification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Student Full Legal Name
              </label>
              <input
                type="text"
                placeholder="Surname Firstname Middlename"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Class of Admission
              </label>
              <select
                value={classApplying}
                onChange={(e) => setClassApplying(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-bold"
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
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Date of Admission
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
              />
            </div>
          </div>

          {/* Gender & DOB & Auto Age & Religion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-bold"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Auto Calculated Age
              </label>
              <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm font-black flex items-center justify-between">
                <span>{age > 0 ? `${age} Yrs` : 'Age (Auto)'}</span>
                <span className="px-2 py-0.5 bg-blue-900 text-amber-300 text-[8px] font-bold rounded uppercase tracking-wider">
                  Calculated
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Religion
              </label>
              <select
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
              >
                <option value="Christianity">Christianity</option>
                <option value="Islam">Islam</option>
                <option value="Traditional">Traditional</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Nationality, State of Origin & Local Government Area (LGA) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Nationality
              </label>
              <input
                type="text"
                placeholder="e.g. Nigerian"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                State of Origin
              </label>
              <select
                value={stateOfOrigin}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
              >
                {NIGERIAN_STATES_AND_LGAS.map((item) => (
                  <option key={item.state} value={item.state}>
                    {item.state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Local Government Area (LGA)
              </label>
              <select
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
              >
                {availableLgas.map((lgaName) => (
                  <option key={lgaName} value={lgaName}>
                    {lgaName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Previous Academic Background */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block">
              📚 Previous Academic History
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Previous School Attended
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corona Primary School, Gbagada, Lagos"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Last Class Attended / Passed
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary 5, Basic 6, or JSS 1"
                  value={lastClassAttended}
                  onChange={(e) => setLastClassAttended(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Student Residential Address */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
              Student Residential Address
            </label>
            <input
              type="text"
              placeholder="e.g. 15 Adeleke Street, Off Commercial Avenue, Ikeja, Lagos"
              value={residentAddress}
              onChange={(e) => setResidentAddress(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-900 shadow-xs font-medium"
            />
          </div>

          {/* Photo / Passport Upload */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="block text-blue-900 font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-900" /> Student Passport Photo
              </label>
              <p className="text-[10px] text-slate-500">
                Optional upload for school ID card, result slips, and student portal avatar.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {passportUrl ? (
                <div className="relative">
                  <img
                    src={passportUrl}
                    alt="Student Photo Preview"
                    className="w-14 h-16 rounded-lg border-2 border-white shadow-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPassportUrl('')}
                    className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-14 h-16 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <label className="cursor-pointer bg-blue-900 hover:bg-blue-800 px-3.5 py-2 rounded-lg text-[10px] text-amber-300 font-black uppercase tracking-widest flex items-center gap-2 shadow-xs transition">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{passportUrl ? 'Change' : 'Upload Passport'}</span>
                <input type="file" accept="image/*" onChange={handlePassportUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION B: LIVING ARRANGEMENT & CAREGIVER DIFFERENTIATION
        ========================================================================= */}
        <div className="space-y-5 bg-amber-50/40 p-5 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
            <div>
              <h3 className="text-amber-950 font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-700" /> Section 2: Living Arrangement & Guardian Status
              </h3>
              <p className="text-[10px] text-amber-800 mt-0.5">
                Helps the school know if the child resides with biological parents or under guidance/guardianship.
              </p>
            </div>
          </div>

          {/* Living With Selector */}
          <div>
            <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-2">
              Who does the student currently live with?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'Biological Parents', label: 'Biological Parents (Both)', icon: Users },
                { id: 'Father Only', label: 'Father Only', icon: Users },
                { id: 'Mother Only', label: 'Mother Only', icon: Users },
                { id: 'Guardian / Relative', label: 'Guardian / Relative / Foster', icon: HeartHandshake },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = livingWith === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLivingWith(opt.id)}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                    <span className="font-bold text-[11px] leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION C: BIOLOGICAL PARENTS INFORMATION
        ========================================================================= */}
        <div className="space-y-5 bg-blue-50/40 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2.5">
            <div>
              <h3 className="text-blue-950 font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-800" /> Section 3: Biological Parents Information (Father & Mother)
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Biological family details. Fill any available information (optional fields can be completed anytime).
              </p>
            </div>
          </div>

          {/* Father Details */}
          <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">
              👨 Father's Details
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Father's Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Chinedu Obi"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Father's Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+234 803 000 0000"
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Father's Occupation / Work
                </label>
                <input
                  type="text"
                  placeholder="e.g. Civil Engineer / Merchant"
                  value={fatherOccupation}
                  onChange={(e) => setFatherOccupation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>
          </div>

          {/* Mother Details */}
          <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">
              👩 Mother's Details
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Mother's Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Ngozi Obi"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Mother's Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+234 802 000 0000"
                  value={motherPhone}
                  onChange={(e) => setMotherPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold uppercase tracking-wider text-[9px] mb-1">
                  Mother's Occupation / Work
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical Practitioner / Trader"
                  value={motherOccupation}
                  onChange={(e) => setMotherOccupation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION D: GUARDIAN / GUIDANCE INFORMATION
        ========================================================================= */}
        <div className="space-y-5 bg-emerald-50/40 p-5 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
            <div>
              <h3 className="text-emerald-950 font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-800" /> Section 4: Guardian / Guidance Information
              </h3>
              <p className="text-[10px] text-emerald-800 mt-0.5">
                Complete this section if the child lives with a guardian, foster parent, uncle, aunt, or other relative.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Guardian Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Emeka Adeyemi"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Relationship to Student
              </label>
              <select
                value={guardianRelationship}
                onChange={(e) => setGuardianRelationship(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-emerald-700"
              >
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Grandfather">Grandfather</option>
                <option value="Grandmother">Grandmother</option>
                <option value="Elder Sibling">Elder Sibling</option>
                <option value="Foster Parent">Foster Parent</option>
                <option value="Cousin">Cousin</option>
                <option value="Family Friend">Family Friend</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Other Relative">Other Relative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Guardian Phone Number (Calls/SMS)
              </label>
              <input
                type="tel"
                placeholder="+234 803 000 0000"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Guardian WhatsApp Line
              </label>
              <input
                type="tel"
                placeholder="+234 803 000 0000"
                value={guardianWhatsapp}
                onChange={(e) => setGuardianWhatsapp(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Guardian Occupation
              </label>
              <input
                type="text"
                placeholder="e.g. Attorney / Merchant"
                value={guardianOccupation}
                onChange={(e) => setGuardianOccupation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
              Guardian Residential Address
            </label>
            <input
              type="text"
              placeholder="e.g. 24 Palm Grove Avenue, Victoria Island, Lagos"
              value={guardianAddress}
              onChange={(e) => setGuardianAddress(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-700"
            />
          </div>
        </div>

        {/* =========================================================================
            SECTION E: PRIMARY CONTACT PERSON FOR NOTIFICATIONS
        ========================================================================= */}
        <div className="space-y-4 bg-slate-100 p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-slate-900 font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-900" /> Section 5: Primary Contact for School Alerts & Report Cards
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Safe Under-18 Dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Preferred Primary Contact Person
              </label>
              <select
                value={primaryContactPerson}
                onChange={(e) => setPrimaryContactPerson(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900"
              >
                <option value="Both Parents">Both Parents</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Primary SMS / Voice Line
              </label>
              <input
                type="tel"
                placeholder="+234 803 000 0000"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Primary WhatsApp for Report Cards
              </label>
              <input
                type="tel"
                placeholder="+234 803 000 0000"
                value={parentWhatsapp}
                onChange={(e) => setParentWhatsapp(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>
        </div>

        {/* Submit & Edit Action Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
          <p className="text-[11px] text-slate-500 italic">
            * You can submit immediately. All information remains fully editable at any time.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {editingAppId && (
              <button
                type="button"
                onClick={() => {
                  setEditingAppId(null);
                  setStudentName('');
                  setFatherName('');
                  setMotherName('');
                  setGuardianName('');
                  generateNewStudentId();
                }}
                className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold uppercase rounded-xl text-xs transition"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              id="btn-submit-online-admission"
              className="grow sm:grow-0 px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black uppercase tracking-widest rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 ring-4 ring-blue-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{editingAppId ? 'Update & Re-Submit Application' : 'Submit Admission Application'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
