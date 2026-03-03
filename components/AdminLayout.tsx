import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
  { label: 'Students', icon: 'school', path: '/admin/students' },
  { label: 'Settings', icon: 'settings', path: '/admin/settings' },
];

interface AdminLayoutProps {
  onLogout?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-[#f0f9fc] dark:bg-slate-900">
      {/* Sidebar - desktop only, fixed height, stays on scroll */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col shadow-sm z-30">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-lg font-bold text-primary">Do HomeWork</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Markaz admin</p>
        </div>
        <nav className="p-3 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
              || (item.path === '/admin/students' && location.pathname.startsWith('/admin/students'));
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
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
          <a
            href="tel:+998505991150"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">call</span>
            <span className="font-medium text-sm">+998 50 599 11 50</span>
          </a>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="font-medium text-sm">Chiqish</span>
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto pb-20 lg:pb-8 lg:ml-60">
        <div className="w-full max-w-6xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
