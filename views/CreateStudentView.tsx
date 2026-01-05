
import React from 'react';

interface CreateStudentViewProps {
  onBack: () => void;
}

const CreateStudentView: React.FC<CreateStudentViewProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 p-4 pt-12 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-800 dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">New Student</h2>
        <div className="w-10"></div>
      </header>

      <div className="flex flex-col items-center py-8">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm overflow-hidden">
            <span className="material-symbols-outlined text-slate-300 text-5xl">person</span>
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
            <span className="material-symbols-outlined text-sm">add_a_photo</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-primary">Upload Photo</p>
      </div>

      <div className="px-5 space-y-5 pb-32">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Name (F.I.O)</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
            <input type="text" placeholder="Enter student's full name" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 transition-all" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">call</span>
            <input type="tel" placeholder="+1 (555) 000-0000" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Username</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">alternate_email</span>
            <input type="text" placeholder="student_id" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Assign to Group</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">groups</span>
            <select className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 appearance-none">
              <option disabled selected>Select a group</option>
              <option>Class 10-A (Mathematics)</option>
              <option>Class 10-B (Science)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
            <input type="password" placeholder="••••••••" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-12" />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 ml-1">Must be at least 8 characters</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={onBack} className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-md active:scale-95 transition-all">
          Create Student
        </button>
      </div>
    </div>
  );
};

export default CreateStudentView;
