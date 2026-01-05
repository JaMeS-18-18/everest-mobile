
import React, { useState } from 'react';

interface SubmitHomeworkViewProps {
  onBack: () => void;
}

const SubmitHomeworkView: React.FC<SubmitHomeworkViewProps> = ({ onBack }) => {
  const [essayText, setEssayText] = useState('');

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 pt-12 border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="flex-1 text-center text-lg font-bold pr-10">Submit Homework</h2>
      </header>

      <main className="flex-1 px-4 pt-4 pb-32">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm mb-6 border border-slate-100 dark:border-slate-800">
          <div className="flex gap-2 mb-3">
            <div className="flex h-7 items-center gap-1.5 rounded-full bg-primary/10 px-3 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[16px]">description</span>
              <p className="text-primary text-[10px] font-bold uppercase tracking-wider">Essay</p>
            </div>
            <div className="flex h-7 items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3">
              <span className="material-symbols-outlined text-orange-600 text-[16px]">schedule</span>
              <p className="text-orange-700 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wider">Due Tomorrow</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-3">History Essay: The Industrial Revolution</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Please write at least 500 words on the impact of steam power during the Industrial Revolution. Cite at least two sources.
          </p>
        </div>

        <div className="flex items-center justify-between mb-2 px-1">
          <p className="font-bold">Your Answer</p>
          <span className="text-xs text-slate-400 font-medium">{essayText.length / 5} / 500 words</span>
        </div>

        <div className="relative mb-6">
          <textarea 
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            className="w-full h-60 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            placeholder="Type your essay here... Start by introducing the main topic."
          />
          <div className="absolute bottom-3 left-3 flex gap-2">
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">image</span>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm font-bold mb-2 ml-1">Additional Files (Optional)</p>
          <button className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30 group hover:bg-slate-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tap to upload PDF or DOCX</p>
            <p className="text-xs text-slate-400 mt-1">Max file size: 10MB</p>
          </button>
        </div>

        <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
          <span className="material-symbols-outlined text-amber-600 shrink-0">warning</span>
          <div>
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Final Submission</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400/70 leading-normal">
              Once submitted, you cannot edit or delete your work. Please double-check your answer.
            </p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={onBack} className="w-full h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <span className="material-symbols-outlined">send</span>
          Submit Assignment
        </button>
      </div>
    </div>
  );
};

export default SubmitHomeworkView;
