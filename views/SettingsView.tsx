
import React from 'react';
import { UserRole } from '../types';

interface SettingsViewProps {
  role: UserRole;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onLogout: () => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ role, isDarkMode, setIsDarkMode, onLogout, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-4 pt-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-primary">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">Settings</h2>
        <div className="w-10"></div>
      </header>

      <div className="p-4 flex flex-col items-center py-8">
        <div className="relative mb-4 group cursor-pointer">
          <img 
            src={role === UserRole.TEACHER ? "https://picsum.photos/seed/elena/200/200" : "https://picsum.photos/seed/ivan/200/200"} 
            className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-sm object-cover" 
            alt="Profile" 
          />
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </div>
        </div>
        <h3 className="text-xl font-bold">{role === UserRole.TEACHER ? 'Elena Ivanovna P.' : 'Ivanov Ivan Ivanovich'}</h3>
        <p className="text-sm text-slate-500">{role === UserRole.TEACHER ? 'Mathematics Teacher' : 'Grade 10 • Student'}</p>
        <button className="mt-4 px-6 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm">Edit Profile</button>
      </div>

      <div className="px-4 space-y-6 pb-12">
        <section>
          <h4 className="px-2 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Account</h4>
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Email</p>
              </div>
              <span className="text-sm text-slate-500">elena@school.edu</span>
            </div>
            <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Change Password</p>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
          </div>
        </section>

        <section>
          <h4 className="px-2 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Preferences</h4>
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </div>
              <div className="flex-1 font-medium">Push Notifications</div>
              <div 
                onClick={() => {}} 
                className="w-12 h-6 bg-primary rounded-full relative cursor-pointer"
              >
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">dark_mode</span>
              </div>
              <div className="flex-1 font-medium">Dark Mode</div>
              <div 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isDarkMode ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h4 className="px-2 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Support</h4>
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">help</span>
              </div>
              <div className="flex-1 font-medium">Help Center</div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">privacy_tip</span>
              </div>
              <div className="flex-1 font-medium">Privacy Policy</div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
          </div>
        </section>

        <button 
          onClick={onLogout}
          className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-red-500 font-bold rounded-xl active:bg-red-50 transition-colors"
        >
          Log Out
        </button>

        <div className="text-center text-[10px] text-slate-400 pb-8">
          Version 2.4.1 (Build 204)
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
