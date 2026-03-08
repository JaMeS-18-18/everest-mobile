import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const navItems = [
  { labelKey: 'nav_organizations', icon: 'apartment', path: '/superadmin/dashboard' },
  { labelKey: 'nav_admins', icon: 'badge', path: '/superadmin/admins' },
  { labelKey: 'nav_settings', icon: 'settings', path: '/superadmin/settings' },
];

interface SuperadminLayoutProps {
  onLogout?: () => void;
}

const SuperadminLayout: React.FC<SuperadminLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  return (
    <div className="min-h-screen flex bg-[#f0f9fc] dark:bg-background-dark">
      {/* Sidebar - fixed, fixed height, stays on scroll */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-shrink-0 bg-white dark:bg-card-dark border-r border-slate-200 dark:border-border-dark flex-col shadow-sm z-30">
        <div className="p-5 border-b border-slate-200 dark:border-border-dark">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Do HomeWork" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-primary">Do HomeWork</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('superadmin')}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1">
          {navItems.map((item) => {
            const isActive = item.path === '/superadmin/admins'
              ? location.pathname.startsWith('/superadmin/admins')
              : location.pathname === item.path;
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
      {/* Main content - light blue background, scrollable */}
      <main className="flex-1 min-w-0 overflow-auto lg:ml-60">
        <div className="w-full max-w-6xl mx-auto pt-6 pb-8 px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperadminLayout;
