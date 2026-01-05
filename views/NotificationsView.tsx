
import React from 'react';
import { UserRole, View } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants';

interface NotificationsViewProps {
  role: UserRole;
  onBack: () => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ role, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-4 pt-12 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-800 dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold">Notifications</h1>
        <button className="text-primary text-sm font-semibold">Mark all read</button>
      </header>

      <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
        {['All', 'Unread', role === UserRole.TEACHER ? 'Submissions' : 'Homework', 'System'].map((filter, idx) => (
          <button 
            key={filter}
            className={`h-9 px-5 rounded-full text-sm font-medium transition-all ${
              idx === 0 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Today</h4>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {MOCK_NOTIFICATIONS.map(notif => (
            <div key={notif.id} className="relative flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
              {notif.unread && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                notif.type === 'submission' ? 'bg-blue-50 text-blue-600' :
                notif.type === 'student' ? 'bg-emerald-50 text-emerald-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                <span className="material-symbols-outlined text-[24px]">
                  {notif.type === 'submission' ? 'description' : 
                   notif.type === 'student' ? 'person_add' : 'warning'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="font-semibold text-sm truncate">{notif.title}</p>
                  <span className="text-[10px] text-slate-400 font-medium ml-2">{notif.time}</span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{notif.user}</span> {notif.description}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-300 text-[20px] self-center">chevron_right</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
