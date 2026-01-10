import React from 'react';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

interface LoaderProps {
  text?: string;
  version?: string;
}

import { useEffect, useState } from 'react';

const Loader: React.FC<LoaderProps> = ({ text = "Loading...", version = APP_VERSION }) => {
  // Dark mode detection (tailwind or class-based)
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const bg = isDark ? '#181f2a' : '#f7f9fb';
  const ringBg = isDark ? '#232b3a' : '#e3eaf5';
  const ringFg = '#2196f3';
  const capBg = isDark ? '#232b3a' : '#fff';
  const capFg = '#2196f3';
  const textColor = isDark ? '#b3c6e0' : '#64748b';
  const barBg = isDark ? '#232b3a' : '#e3eaf5';
  const barFg = '#2196f3';
  const versionColor = isDark ? '#374151' : '#cbd5e1';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative" style={{ background: bg }}>
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Spinner with cap icon */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {/* Animated ring */}
          <svg className="absolute animate-spin-slow" width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke={ringBg} strokeWidth="10" fill="none" />
            <circle cx="80" cy="80" r="70" stroke={ringFg} strokeWidth="10" fill="none" strokeDasharray="440" strokeDashoffset="330" strokeLinecap="round" />
          </svg>
          {/* Cap icon */}
          <div className="flex items-center justify-center rounded-full shadow-lg" style={{ width: 110, height: 110, background: capBg }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="32" fill={capBg} />
              <path d="M32 18L50 26L32 34L14 26L32 18Z" fill={capFg} />
              <path d="M32 34V46" stroke={capFg} strokeWidth="3" strokeLinecap="round" />
              <rect x="22" y="36" width="20" height="8" rx="2" fill={capFg} />
            </svg>
          </div>
        </div>
        {/* Loader text */}
        <div className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>{text}</div>
        {/* Progress bar */}
        <div className="w-72 h-2 rounded-full overflow-hidden" style={{ background: barBg }}>
          <div className="h-full rounded-full animate-loader-bar" style={{ width: '40%', background: barFg }}></div>
        </div>
      </div>
      {/* Version */}
      <div className="absolute bottom-8 left-0 right-0 text-center tracking-widest text-sm font-semibold" style={{ color: versionColor }}>
        {version}
      </div>
      {/* Animations */}
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2.5s linear infinite;
        }
        @keyframes loader-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 40%; }
        }
        .animate-loader-bar {
          animation: loader-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Loader;
