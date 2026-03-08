import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useTranslation } from '../contexts/LanguageContext';

const navItems = [
  { labelKey: 'nav_dashboard', icon: 'dashboard', path: '/admin/dashboard' },
  { labelKey: 'nav_students', icon: 'school', path: '/admin/students' },
  { labelKey: 'nav_teachers', icon: 'badge', path: '/admin/teachers' },
  { labelKey: 'admin_assistant_teachers', icon: 'support_agent', path: '/admin/assistant-teachers' },
  { labelKey: 'admin_parents', icon: 'family_restroom', path: '/admin/parents' },
  { labelKey: 'nav_groups', icon: 'groups', path: '/admin/groups' },
  { labelKey: 'nav_settings', icon: 'settings', path: '/admin/settings' },
];

interface AdminLayoutProps {
  onLogout?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgLogo, setOrgLogo] = useState<string>('');

  useEffect(() => {
    api.get('/admin/organization').then(res => {
      const d = res.data?.data;
      // Qo‘llab-quvvatlash: data: { name, plan, logo } yoki data: { organization: { name, plan, logo } }
      const name = d?.name ?? d?.organization?.name;
      const logo = d?.logo ?? d?.organization?.logo ?? '';
      if (name) setOrgName(name);
      setOrgLogo(logo || '');
    }).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-[#f0f9fc] dark:bg-background-dark">
      {/* Sidebar - desktop only, fixed height, stays on scroll */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-shrink-0 bg-white dark:bg-card-dark border-r border-slate-200 dark:border-border-dark flex-col shadow-sm z-30">
        <div className="p-5 border-b border-slate-200 dark:border-border-dark">
          <div className="flex items-center gap-3">
            <img
              src={orgLogo || '/logo.jpg'}
              alt={orgName || t('center_admin')}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-card-dark"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }}
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-primary truncate" title={orgName || ''}>
                {orgName || '—'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{t('center_admin')}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
              || (item.path === '/admin/students' && location.pathname.startsWith('/admin/students'))
              || (item.path === '/admin/teachers' && location.pathname.startsWith('/admin/teachers'))
              || (item.path === '/admin/assistant-teachers' && location.pathname.startsWith('/admin/assistant-teachers'))
              || (item.path === '/admin/parents' && location.pathname.startsWith('/admin/parents'))
              || (item.path === '/admin/groups' && location.pathname.startsWith('/admin/groups'));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${isActive ? 'text-white' : ''}`}>{item.icon}</span>
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
            <span className="material-symbols-outlined text-xl">send</span>
            <span className="font-medium text-sm">@dohomework_support</span>
          </a>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="font-medium text-sm">{t('logout')}</span>
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto pb-20 lg:pb-8 lg:ml-60">
        <div className="w-full max-w-6xl mx-auto px-2 pt-2 pb-4 lg:pt-6 lg:pb-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
