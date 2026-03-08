import React from 'react';
import { UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

interface BottomNavProps {
  role?: UserRole;
}

const BottomNav: React.FC<BottomNavProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  const teacherTabs = [
    { labelKey: 'nav_groups', icon: 'groups', path: '/groups' },
    { labelKey: 'nav_schedule', icon: 'calendar_month', path: '/teacher/schedule' },
    { labelKey: 'nav_students_teacher', icon: 'school', path: '/students' },
    { labelKey: 'nav_tasks', icon: 'assignment', path: '/tasks' },
    { labelKey: 'nav_profile', icon: 'person', path: '/settings' },
  ];
  const supportTeacherTabs = [
    { labelKey: 'nav_groups', icon: 'groups', path: '/support/groups' },
    { labelKey: 'nav_schedule', icon: 'calendar_month', path: '/support/schedule' },
    { labelKey: 'nav_appointments', icon: 'event_available', path: '/support/appointments' },
    { labelKey: 'nav_profile', icon: 'person', path: '/support/settings' },
  ];
  const studentTabs = [
    { labelKey: 'nav_home', icon: 'home', path: '/student/home' },
    { labelKey: 'nav_schedule', icon: 'calendar_month', path: '/student/schedule' },
    { labelKey: 'nav_ranking', icon: 'leaderboard', path: '/student/ranking' },
    { labelKey: 'nav_settings', icon: 'settings', path: '/settings' },
  ];
  const adminTabs = [
    { labelKey: 'nav_dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { labelKey: 'nav_students', icon: 'school', path: '/admin/students' },
    { labelKey: 'nav_profile', icon: 'person', path: '/admin/settings' },
  ];

  let tabs = studentTabs;
  if (role === UserRole.TEACHER) tabs = teacherTabs;
  if (role === UserRole.SUPPORT_TEACHER) tabs = supportTeacherTabs;
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
    // For support teacher's tabs
    if (role === UserRole.SUPPORT_TEACHER && tabPath === '/support/groups') {
      return location.pathname.startsWith('/support/groups');
    }
    if (role === UserRole.SUPPORT_TEACHER && tabPath === '/support/schedule') {
      return location.pathname === '/support/schedule';
    }
    if (role === UserRole.SUPPORT_TEACHER && tabPath === '/support/appointments') {
      return location.pathname === '/support/appointments';
    }
    // For student's ranking tab
    if (role === UserRole.STUDENT && tabPath === '/student/ranking') {
      return location.pathname === '/student/ranking';
    }
    // For student's schedule tab
    if (role === UserRole.STUDENT && tabPath === '/student/schedule') {
      return location.pathname === '/student/schedule';
    }
    // Admin: dashboard, teachers, teacher detail, settings
    if (role === UserRole.ADMIN && tabPath === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    if (role === UserRole.ADMIN && tabPath === '/admin/students') {
      return location.pathname === '/admin/students';
    }
    if (role === UserRole.ADMIN && tabPath === '/admin/settings') {
      return location.pathname === '/admin/settings';
    }
    return location.pathname === tabPath;
  }

  return (
    <nav className={`fixed bottom-0 left-0 right-0 w-full max-w-full sm:max-w-md sm:mx-auto bg-card-light dark:bg-card-dark border-t border-slate-200 dark:border-border-dark z-40 ${role === UserRole.ADMIN || role === UserRole.TEACHER ? 'lg:hidden' : ''}`}>
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium leading-none">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
