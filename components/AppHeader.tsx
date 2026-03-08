import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../contexts/LanguageContext';
import { UserRole } from '../types';

interface AppHeaderProps {
  role?: UserRole | null;
  onOpenTeacherMenu?: () => void;
  teacherMobileMenuOpen?: boolean;
}

function getPageTitleKey(pathname: string): string {
  if (pathname.startsWith('/admin/dashboard') || pathname === '/admin') return 'nav_dashboard';
  if (pathname.startsWith('/admin/students')) return 'nav_students';
  if (pathname.startsWith('/admin/assistant-teachers')) return 'admin_assistant_teachers';
  if (pathname.startsWith('/admin/parents')) return 'admin_parents';
  if (pathname.startsWith('/admin/groups')) return 'nav_groups';
  if (pathname.startsWith('/admin/teachers')) return 'nav_teachers';
  if (pathname.match(/^\/admin\/teacher\/[^/]+\/group\/[^/]+\/student\//)) return 'nav_students_teacher';
  if (pathname.match(/^\/admin\/teacher\/[^/]+\/group\//)) return 'nav_groups';
  if (pathname.startsWith('/admin/teacher/')) return 'nav_teacher_detail';
  if (pathname.startsWith('/admin/settings')) return 'nav_settings';
  if (pathname.startsWith('/superadmin/dashboard') || pathname === '/superadmin') return 'nav_dashboard';
  if (pathname.startsWith('/superadmin/organizations')) return 'nav_organizations';
  if (pathname.startsWith('/superadmin/admins')) return 'nav_admins';
  if (pathname.startsWith('/superadmin/settings')) return 'nav_settings';
  if (pathname === '/groups' || pathname.startsWith('/groups/')) return 'nav_groups';
  if (pathname === '/students' || pathname.startsWith('/students/')) return 'nav_students_teacher';
  if (pathname === '/tasks' || pathname.startsWith('/tasks/')) return 'nav_tasks';
  if (pathname.startsWith('/teacher/schedule')) return 'nav_schedule';
  if (pathname === '/settings') return 'nav_profile';
  if (pathname.startsWith('/notifications')) return 'nav_notifications';
  if (pathname.startsWith('/grading')) return 'nav_grading';
  if (pathname.startsWith('/student/')) return 'nav_student';
  if (pathname.startsWith('/parent/')) return 'nav_parent';
  if (pathname.startsWith('/support/')) return 'nav_support';
  return 'nav_dashboard';
}

const AppHeader: React.FC<AppHeaderProps> = ({ role, onOpenTeacherMenu, teacherMobileMenuOpen }) => {
  const location = useLocation();
  const t = useTranslation();
  const hasSidebar = location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')
    || /^\/(groups|students|tasks|teacher|settings|notifications|grading)/.test(location.pathname);
  const isTeacherPath = /^\/(groups|students|tasks|teacher|settings|notifications|grading)/.test(location.pathname);
  const showTeacherHamburger = role === UserRole.TEACHER && isTeacherPath && !!onOpenTeacherMenu;
  const isStudent = role === UserRole.STUDENT;
  const titleKey = getPageTitleKey(location.pathname);
  const pageTitle = t(titleKey);

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    }
  }, []);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const showFullscreenButton = hasSidebar && !isStudent;

  return (
    <header className={`flex items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm shrink-0 z-40 md:fixed md:top-0 md:right-0 ${hasSidebar ? 'md:left-60' : 'md:left-0'}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showTeacherHamburger && (
          <button
            type="button"
            onClick={onOpenTeacherMenu}
            className="md:hidden flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Menyu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        )}
        <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">
          {pageTitle}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {showFullscreenButton && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden md:flex w-10 h-10 rounded-xl items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <span className="material-symbols-outlined text-2xl">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        )}
        {!isStudent && <LanguageSwitcher />}
      </div>
    </header>
  );
};

export default AppHeader;
