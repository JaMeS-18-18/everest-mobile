
import React from 'react';
import { UserRole, View } from '../types';

interface BottomNavProps {
  role: UserRole;
  currentView: View;
  navigate: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ role, currentView, navigate }) => {
  const teacherTabs = [
    { label: 'Groups', icon: 'groups', view: 'GROUPS' as View },
    { label: 'Students', icon: 'school', view: 'STUDENTS' as View },
    { label: 'Tasks', icon: 'assignment', view: 'TASKS' as View },
    { label: 'Profile', icon: 'person', view: 'SETTINGS' as View },
  ];

  const studentTabs = [
    { label: 'Home', icon: 'home', view: 'DASHBOARD' as View },
    { label: 'Calendar', icon: 'calendar_month', view: 'DASHBOARD' as View },
    { label: 'Grades', icon: 'school', view: 'DASHBOARD' as View },
    { label: 'Profile', icon: 'person', view: 'SETTINGS' as View },
  ];

  const tabs = role === UserRole.TEACHER ? teacherTabs : studentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.view)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
