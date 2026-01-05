
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

interface GradingViewProps {
  onBack: () => void;
}

const GradingView: React.FC<GradingViewProps> = ({ onBack }) => {
  const [feedback, setFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState(85);

  const generateAIFeedback = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a helpful teacher. Analyze this homework submission about the Industrial Revolution and provide 2-3 sentences of constructive feedback for student Sarah Jenkins. 
        Submission: "The Industrial Revolution marked a major turning point in history; almost every aspect of daily life was influenced in some way. Prior to this period, most manufacturing was done in homes using hand tools or basic machines."`,
        config: {
          systemInstruction: "You are a professional teacher providing student feedback.",
          temperature: 0.7,
        }
      });
      setFeedback(response.text || "Good effort. You clearly understand the transition from home-based manufacturing to industrialized mass production. Consider expanding on the social impact.");
    } catch (error) {
      console.error("AI Error:", error);
      setFeedback("Excellent work on identifying the key shifts in manufacturing during the Industrial Revolution. Great job!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 p-4 pt-12 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Grading</h2>
        <button className="flex items-center text-primary font-bold">
          Next <span className="material-symbols-outlined text-sm ml-1">arrow_forward_ios</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="flex gap-4 items-center mb-6">
          <img src="https://picsum.photos/seed/sarah/100/100" className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" alt="Sarah" />
          <div className="min-w-0">
            <p className="text-xl font-bold truncate">Sarah Jenkins</p>
            <p className="text-primary text-sm font-medium">History Essay: The Industrial Revolution</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
              <p className="text-slate-500 text-xs">Submitted Oct 12, 10:30 AM</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Essay Submission</h3>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Text</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic">
            "The Industrial Revolution marked a major turning point in history; almost every aspect of daily life was influenced in some way. In particular, average income and population began to exhibit unprecedented sustained growth..."
          </p>
          <button className="mt-3 text-primary text-sm font-semibold flex items-center gap-1">
            Read full essay <span className="material-symbols-outlined text-sm">open_in_full</span>
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-8">
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Supplemental Audio</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined">audio_file</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-sm">Oral_Presentation_Final.mp3</p>
              <p className="text-xs text-slate-500">04:32 • 12MB</p>
            </div>
            <button className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/3"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Evaluation
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Score (0-100)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={score} 
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg h-12 font-bold text-lg" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/100</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Status</label>
              <select className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                <option>Graded</option>
                <option>Pending</option>
                <option>Needs Revision</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Teacher Feedback</label>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-3 h-32 text-sm"
              placeholder="Enter your feedback here..."
            />
            <div className="flex justify-end">
              <button 
                onClick={generateAIFeedback}
                disabled={isGenerating}
                className="text-primary text-xs font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">{isGenerating ? 'refresh' : 'auto_awesome'}</span>
                {isGenerating ? 'Thinking...' : 'Generate with AI'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={onBack} className="w-full bg-primary text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined">save</span>
          Save Grade
        </button>
      </div>
    </div>
  );
};

export default GradingView;
