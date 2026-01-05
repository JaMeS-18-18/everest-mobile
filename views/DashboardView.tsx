
import React from 'react';
import { UserRole, View } from '../types';
import { MOCK_HOMEWORK } from '../constants';

interface DashboardViewProps {
  role: UserRole;
  navigate: (view: View) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ role, navigate }) => {
  if (role === UserRole.TEACHER) {
    return (
      <div className="p-4 pt-12">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary fill text-[20px]">school</span>
            </div>
            <h2 className="text-lg font-bold">Teacher Dashboard</h2>
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-500">account_circle</span>
          </button>
        </header>

        <main className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-full max-w-[320px] aspect-video rounded-2xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary/30 text-[96px]">auto_stories</span>
          </div>
          
          <h3 className="text-2xl font-bold mb-3">Welcome, Teacher!</h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm leading-relaxed mb-8 max-w-[280px]">
            Select <span className="font-bold text-primary">Groups</span> to manage classes or <span className="font-bold text-primary">Students</span> to track individual progress.
          </p>
          
          <button 
            onClick={() => navigate('CREATE_GROUP')}
            className="flex items-center justify-center h-12 px-8 rounded-xl bg-primary/10 text-primary font-bold gap-2 hover:bg-primary/20 transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Create New Class</span>
          </button>
        </main>

        <div className="fixed bottom-24 right-4 z-30">
          <button className="flex items-center justify-center h-14 px-6 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 gap-2 active:scale-95 transition-all">
            <span className="material-symbols-outlined">add</span>
            <span className="font-bold">New Assignment</span>
          </button>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="p-4 pt-12">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover" 
              src="https://picsum.photos/seed/alex/100/100" 
              alt="Profile"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">Good Morning,</span>
            <span className="text-sm font-bold">Alex Johnson</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('NOTIFICATIONS')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[32px] font-bold tracking-tight">My Homework</h1>
        <div className="flex h-8 items-center gap-2 px-3 rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px]">groups</span>
          <span className="text-xs font-semibold">Class 5-A</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center bg-white dark:bg-slate-800 h-12 rounded-xl shadow-sm px-4">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Search subject or assignment..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {['All', 'New', 'Pending', 'Completed'].map((filter, idx) => (
          <button 
            key={filter}
            className={`h-9 px-5 rounded-full text-sm font-bold transition-all ${
              idx === 0 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {MOCK_HOMEWORK.map((hw) => (
          <div 
            key={hw.id} 
            onClick={() => navigate('SUBMIT_HOMEWORK')}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                hw.subject === 'Math' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30' :
                hw.subject === 'Biology' ? 'bg-green-50 text-green-700 dark:bg-green-900/30' :
                'bg-blue-50 text-blue-700 dark:bg-blue-900/30'
              }`}>
                {hw.subject}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                hw.status === 'New' ? 'bg-primary text-white' :
                hw.status === 'Pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700'
              }`}>
                {hw.status}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-4 line-clamp-1">{hw.title}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-text-secondary-light dark:text-text-secondary-dark">
                <span className="material-symbols-outlined text-[18px]">event</span>
                <span className="text-sm font-medium">{hw.dueDate}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
