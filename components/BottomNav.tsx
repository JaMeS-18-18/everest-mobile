
import React from 'react';
import { UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  role?: UserRole;
}

const BottomNav: React.FC<BottomNavProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define tabs with route paths
  const teacherTabs = [
    { label: 'Groups', icon: 'groups', path: '/groups' },
    { label: 'Schedule', icon: 'calendar_month', path: '/teacher/schedule' },
    { label: 'Students', icon: 'school', path: '/students' },
    { label: 'Tasks', icon: 'assignment', path: '/tasks' },
    { label: 'Profile', icon: 'person', path: '/settings' },
  ];
  const studentTabs = [
    { label: 'Home', icon: 'home', path: '/student/home' },
    { label: 'Schedule', icon: 'calendar_month', path: '/student/schedule' },
    { label: 'Ranking', icon: 'leaderboard', path: '/student/ranking' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];
  const adminTabs = [
    { label: 'Home', icon: 'groups', path: '/admin/teachers' },
    { label: 'Profile', icon: 'person', path: '/settings' },
  ];

  let tabs = studentTabs;
  if (role === UserRole.TEACHER) tabs = teacherTabs;
  if (role === UserRole.ADMIN) tabs = adminTabs;

  // Helper to check if tab should be highlighted
  const isTabActive = (tabPath: string) => {
    // For teacher's Students tab, active for both /students and /students/:studentId
    if (role === UserRole.TEACHER && tabPath === '/students') {
      return location.pathname === '/students' || /^\/students\/[\w-]+$/.test(location.pathname);
    }
    // For teacher's Groups tab, active for both /groups and /groups/:groupId
    if (role === UserRole.TEACHER && tabPath === '/groups') {
      return location.pathname === '/groups' || /^\/groups\/[\w-]+$/.test(location.pathname);
    }
    // For teacher's Tasks tab, active for both /tasks and /tasks/:taskId
    if (role === UserRole.TEACHER && tabPath === '/tasks') {
      return location.pathname === '/tasks' || /^\/tasks\/[\w-]+$/.test(location.pathname);
    }
    // For teacher's Schedule tab
    if (role === UserRole.TEACHER && tabPath === '/teacher/schedule') {
      return location.pathname === '/teacher/schedule';
    }
    // For student's ranking tab
    if (role === UserRole.STUDENT && tabPath === '/student/ranking') {
      return location.pathname === '/student/ranking';
    }
    // For student's schedule tab
    if (role === UserRole.STUDENT && tabPath === '/student/schedule') {
      return location.pathname === '/student/schedule';
    }
    return location.pathname === tabPath;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.path);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
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
