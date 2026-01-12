import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  {
    label: 'Organizations',
    icon: 'business',
    path: '/superadmin/dashboard',
  },
  // {
  //   label: 'Admins',
  //   icon: 'supervisor_account',
  //   path: '/superadmin/admins',
  // },
  {
    label: 'Settings',
    icon: 'settings',
    path: '/superadmin/settings',
  },
];

const SuperadminBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>{item.icon}</span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default SuperadminBottomNav;
