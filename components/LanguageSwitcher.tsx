import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { LangCode } from '../contexts/LanguageContext';

const options: { code: LangCode; label: string }[] = [
  { code: 'eng', label: 'Eng' },
  { code: 'ru', label: 'Ru' },
  { code: 'uz', label: 'Uz' },
];

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100 dark:bg-card-dark/80 border border-slate-200 dark:border-border-dark">
      {options.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            lang === code
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
