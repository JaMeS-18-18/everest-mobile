import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';

const ParentBottomNav: React.FC = () => {
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { labelKey: 'nav_home', icon: 'home', path: '/parent/home' },
    { labelKey: 'nav_settings', icon: 'settings', path: '/parent/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-full sm:max-w-md sm:mx-auto bg-card-light dark:bg-card-dark border-t border-slate-200 dark:border-border-dark z-40">
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
              <span className="text-[10px] font-medium leading-none">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ParentBottomNav;
