import React, { useEffect, useState } from 'react';

interface StudentProgressCircleProps {
  percent?: number; // 0-100
  label?: string;
  delta?: number; // e.g. +12
  status?: 'Worse' | 'Bad' | 'Good' | 'Better' | 'Perfect';
}

const statusColors = {
  Worse: '#ff6b6b',
  Bad: '#ffb74d',
  Good: '#1ec6ff', // blue highlight as in image
  Better: '#66bb6a',
  Perfect: '#ffd600',
};


export default function StudentProgressCircle({
  percent = 62,
  label = 'Good',
  delta = 12,
  status = 'Good',
}: StudentProgressCircleProps) {
  // Make everything smaller
  const radius = 55;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(100, percent));
  const offset = circumference - (progress / 100) * circumference;
  const color = statusColors[status] || '#1ec6ff';

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

  const bgColor = isDark ? 'radial-gradient(circle at 60% 30%, #232b3a 80%, #181f2a 100%)' : 'radial-gradient(circle at 60% 30%, #fafdff 80%, #f1f7fa 100%)';
  const dotColor1 = isDark ? '#2a3a4a' : '#e3f3ff';
  const dotColor2 = isDark ? '#2a3a4a' : '#e3f3ff';
  const dotColor3 = isDark ? '#223344' : '#b3e5fc';
  const circleBg = isDark ? '#232b3a' : '#eaf6ff';

  return (
    <div style={{ position: 'relative', width: 120, height: 120, margin: '1rem auto .8rem auto', background: bgColor, borderRadius: '50%', boxShadow: isDark ? '0 2px 8px 0 rgba(30,198,255,0.13)' : '0 2px 8px 0 rgba(30,198,255,0.07)' }}>
      <svg width={120} height={120}>
        <circle
          stroke={circleBg}
          fill="none"
          strokeWidth={stroke}
          cx={60}
          cy={60}
          r={normalizedRadius}
        />
        <circle
          stroke={color}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          cx={60}
          cy={60}
          r={normalizedRadius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,2,.6,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color, margin: '1px 0' }}>{label}</div>
        <div style={{ fontSize: 13, color, fontWeight: 800, margin: '1px 0' }}>{percent}%</div>
      </div>
      {/* Decorative dots */}
      <div style={{ position: 'absolute', top: 12, left: 85, width: 7, height: 7, background: dotColor1, borderRadius: '50%', boxShadow: isDark ? '0 0 4px #232b3a' : '0 0 4px #e3f3ff' }} />
      <div style={{ position: 'absolute', top: 95, left: 25, width: 5, height: 5, background: dotColor2, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: 35, left: 15, width: 4, height: 4, background: dotColor3, borderRadius: '50%' }} />
    </div>
  );
}
