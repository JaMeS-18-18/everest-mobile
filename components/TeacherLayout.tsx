import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api';

const navItems = [
  { labelKey: 'nav_groups', icon: 'groups', path: '/groups' },
  { labelKey: 'nav_schedule', icon: 'calendar_month', path: '/teacher/schedule' },
  { labelKey: 'nav_students_teacher', icon: 'school', path: '/students' },
  { labelKey: 'nav_tasks', icon: 'assignment', path: '/tasks' },
  { labelKey: 'nav_profile', icon: 'person', path: '/settings' },
];

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');
const getProfileImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

interface TeacherLayoutProps {
  onLogout?: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ onLogout, mobileMenuOpen = false, setMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  const [orgName, setOrgName] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');

  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data?.success && res.data?.user) {
        const u = res.data.user;
        setTeacherName(u.fullName || u.username || '');
        if (u.organization?.name) setOrgName(u.organization.name);
        if (u.profileImage) setProfileImage(u.profileImage);
      }
    }).catch(() => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        setTeacherName(u.fullName || u.username || '');
        if (u.profileImage) setProfileImage(u.profileImage);
      } catch {}
    });
  }, []);

  const isActive = (path: string) => {
    if (path === '/groups') return location.pathname === '/groups' || location.pathname.startsWith('/groups/');
    if (path === '/students') return location.pathname === '/students' || /^\/students\/[\w-]+$/.test(location.pathname);
    if (path === '/tasks') return location.pathname === '/tasks' || /^\/tasks\/[\w-]+$/.test(location.pathname);
    if (path === '/teacher/schedule') return location.pathname === '/teacher/schedule';
    return location.pathname === path;
  };

  const goTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen?.(false);
  };

  return (
    <div className="min-h-screen flex bg-[#f0f9fc] dark:bg-background-dark">
      {/* Backdrop when sidebar open on mobile */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen?.(false)}
        onKeyDown={(e) => e.key === 'Escape' && setMobileMenuOpen?.(false)}
      />
      {/* Sidebar - har doim mavjud: md+ da doim ko‘rinadi, mobil da overlay */}
      <aside
        className={`fixed left-0 top-0 h-screen w-60 flex flex-col bg-white dark:bg-card-dark border-r border-slate-200 dark:border-border-dark shadow-sm z-50 transition-transform duration-200 ease-out
          md:translate-x-0 md:z-30
          max-md:z-50 ${mobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      >
        <div className="p-5 border-b border-slate-200 dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0 overflow-hidden">
              <span className="absolute inset-0 flex items-center justify-center">{(teacherName || 'T').charAt(0).toUpperCase()}</span>
              {profileImage && (
                <img src={getProfileImageUrl(profileImage)} alt="" className="relative z-10 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-primary truncate" title={orgName || 'Do HomeWork'}>
                {orgName || 'Do HomeWork'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={teacherName}>
                {teacherName || t('teacher')}
              </p>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${active ? 'text-white' : ''}`}>{item.icon}</span>
                <span className="font-medium text-sm">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-border-dark space-y-1">
          <a
            href="https://t.me/dohomework_support"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
             
            <span className="font-medium text-sm">@dohomework_support</span>
          </a>
          {onLogout && (
            <button
              onClick={() => { setMobileMenuOpen?.(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="font-medium text-sm">{t('logout')}</span>
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto pb-6 md:pb-8 md:ml-60 lg:pb-8">
        <div className="w-full max-w-6xl mx-auto px-2 pt-2 pb-4 lg:pt-6 lg:pb-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;
