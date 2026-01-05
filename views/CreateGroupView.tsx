
import React from 'react';

interface CreateGroupViewProps {
  onBack: () => void;
}

const CreateGroupView: React.FC<CreateGroupViewProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-4 pt-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-800 dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">Create Group</h2>
        <div className="w-10"></div>
      </header>

      <div className="p-5">
        <h3 className="text-lg font-bold mb-4">Group Details</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Group Name</label>
            <input 
              type="text" 
              placeholder="e.g., Math 101 - Fall Semester" 
              className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 shadow-sm"
            />
          </div>

          <h3 className="text-lg font-bold mt-8 mb-4">Schedule</h3>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Start Time</label>
              <div className="relative">
                <input type="time" defaultValue="09:00" className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4" />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">schedule</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 ml-1">End Time</label>
              <div className="relative">
                <input type="time" defaultValue="10:30" className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4" />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">schedule</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-700 mb-3 ml-1">Repeat on</p>
            <div className="flex justify-between">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <button 
                  key={i} 
                  className={`w-11 h-11 rounded-full text-sm font-bold shadow-sm transition-all ${
                    [0, 2, 4].includes(i) ? 'bg-primary text-white shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-8 bg-white/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-40">
        <button onClick={onBack} className="w-full h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <span>Create Group</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default CreateGroupView;
