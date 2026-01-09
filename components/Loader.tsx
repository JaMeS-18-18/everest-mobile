import React from 'react';

interface LoaderProps {
  text?: string;
  version?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Loading...", version = 'EVEREST APP V1.0.2' }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f7f9fb] relative">
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Spinner with cap icon */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {/* Animated ring */}
          <svg className="absolute animate-spin-slow" width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke="#e3eaf5" strokeWidth="10" fill="none" />
            <circle cx="80" cy="80" r="70" stroke="#2196f3" strokeWidth="10" fill="none" strokeDasharray="440" strokeDashoffset="330" strokeLinecap="round" />
          </svg>
          {/* Cap icon */}
          <div className="flex items-center justify-center bg-white rounded-full shadow-lg" style={{ width: 110, height: 110 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="32" fill="white" />
              <path d="M32 18L50 26L32 34L14 26L32 18Z" fill="#2196f3" />
              <path d="M32 34V46" stroke="#2196f3" strokeWidth="3" strokeLinecap="round" />
              <rect x="22" y="36" width="20" height="8" rx="2" fill="#2196f3" />
            </svg>
          </div>
        </div>
        {/* Loader text */}
        <div className="text-xl font-semibold text-slate-500 mb-2 text-center">{text}</div>
        {/* Progress bar */}
        <div className="w-72 h-2 bg-[#e3eaf5] rounded-full overflow-hidden">
          <div className="h-full bg-[#2196f3] rounded-full animate-loader-bar" style={{ width: '40%' }}></div>
        </div>
      </div>
      {/* Version */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-slate-300 tracking-widest text-sm font-semibold">
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
