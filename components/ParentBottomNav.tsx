import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  {
    label: 'Home',
    icon: 'home',
    path: '/parent/home',
  },
  {
    label: 'Settings',
    icon: 'settings',
    path: '/parent/settings',
  },
];

const ParentBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || 
            (item.path === '/parent/home' && location.pathname.startsWith('/parent/child'));
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

export default ParentBottomNav;
