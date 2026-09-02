import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Check,
  Award,
  Layers,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';
import { DEFAULT_SCHOOL_CLASSES } from '../../constants/classes';
import { storageService } from '../../services/storageService';

interface EditTeacherClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: User | null;
  onSaved: (updatedTeacher: User) => void;
}

export const EditTeacherClassesModal: React.FC<EditTeacherClassesModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSaved,
}) => {
  if (!isOpen || !teacher) return null;

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (teacher) {
      if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
        setSelectedClasses([...teacher.assignedClasses]);
      } else if (teacher.className) {
        setSelectedClasses([teacher.className]);
      } else {
        setSelectedClasses(['JSS 1A']);
      }
      setSaveSuccess(false);
    }
  }, [teacher, isOpen]);

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handleSelectAll = () => {
    const all = DEFAULT_SCHOOL_CLASSES.flatMap((g) => g.classes);
    setSelectedClasses(all);
  };

  const handleClearAll = () => {
    setSelectedClasses([]);
  };

  const handleSelectCategory = (categoryName: string) => {
    const group = DEFAULT_SCHOOL_CLASSES.find((g) => g.category === categoryName);
    if (!group) return;
    const groupClasses = group.classes;
    const allSelected = groupClasses.every((c) => selectedClasses.includes(c));

    if (allSelected) {
      setSelectedClasses((prev) => prev.filter((c) => !groupClasses.includes(c)));
    } else {
      setSelectedClasses((prev) => Array.from(new Set([...prev, ...groupClasses])));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClasses.length === 0) {
      alert('Please assign at least one class to this teacher.');
      return;
    }

    const updatedTeacher: User = {
      ...teacher,
      assignedClasses: selectedClasses,
      className: selectedClasses[0] || teacher.className,
    };

    storageService.updateUser(updatedTeacher);
    setSaveSuccess(true);
    setTimeout(() => {
      onSaved(updatedTeacher);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-auto text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-blue-950 rounded-xl shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-tight">Assign Classes to Teacher</h2>
                <span className="px-2 py-0.5 bg-blue-900 text-amber-300 rounded text-[9px] font-bold uppercase">
                  Multi-Class Allocation
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {teacher.name} ({teacher.email || teacher.regNo})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto grow space-y-5">
          {/* Quick Stats & Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Classes:
              </span>
              <span className="px-2.5 py-1 bg-blue-900 text-amber-300 font-mono font-black text-xs rounded-lg shadow-xs">
                {selectedClasses.length} Selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-[10px] font-bold uppercase bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 text-[10px] font-bold uppercase bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-slate-300 transition"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Categorized Class List */}
          <div className="space-y-4">
            {DEFAULT_SCHOOL_CLASSES.map((group) => {
              const allGroupSelected = group.classes.every((c) => selectedClasses.includes(c));
              const someGroupSelected = group.classes.some((c) => selectedClasses.includes(c));

              return (
                <div
                  key={group.category}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-900" />
                      <span className="font-black text-slate-900 uppercase text-xs tracking-wider">
                        {group.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectCategory(group.category)}
                      className="text-[10px] font-bold uppercase text-blue-900 hover:text-blue-700 transition"
                    >
                      {allGroupSelected ? 'Deselect Group' : 'Select All in Group'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {group.classes.map((cls) => {
                      const isChecked = selectedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleClass(cls)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between gap-1.5 ${
                            isChecked
                              ? 'bg-blue-900 text-amber-300 border-blue-950 shadow-md ring-2 ring-blue-900/10'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="truncate">{cls}</span>
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 shrink-0 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 shrink-0 text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saveSuccess ? 'Saved!' : 'Save Assigned Classes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
