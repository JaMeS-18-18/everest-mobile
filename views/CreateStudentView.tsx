
import React, { useState, useEffect } from 'react';
import api from '../api';

interface CreateStudentViewProps {
  onBack: () => void;
}

const CreateStudentView: React.FC<CreateStudentViewProps> = ({ onBack }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api.get('/groups').then(res => {
      if (res.data.success) setGroups(res.data.data);
    });
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!fullName.trim() || !phone.trim() || !username.trim() || !password.trim()) {
      setError('Fill all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/students', {
        fullName,
        phone,
        username,
        password
      });
      if (res.data.success) {
        // Assign to group if selected
        if (groupId) {
          await api.post(`/groups/${groupId}/students/${res.data.data._id}`);
        }
        onBack();
      } else {
        setError(res.data.message || 'Failed to create student');
      }
    } catch (err) {
      setError('Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 p-4 pt-12 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-800 dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">New Student</h2>
        <div className="w-10"></div>
      </header>

     

      <div className="px-5 space-y-5 pb-32 pt-8">
        {error && <div className="text-red-500 text-center mb-2">{error}</div>}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Name (F.I.O)</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter student's full name" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 transition-all" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">call</span>
            <input type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    onChange={e => {
                    // Only allow digits
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                    }}
                    placeholder="998901234567"
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                    autoComplete="off"/>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Login</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">alternate_email</span>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Login" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4" />
          </div>
        </div>

        

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-12"
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              tabIndex={-1}
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Assign to Group</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">groups</span>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 appearance-none">
              <option value="">Select a group</option>
              {groups.map((group: any) => (
                <option key={group._id} value={group._id}>{group.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50">
          {isSubmitting ? 'Creating...' : 'Create Student'}
        </button>
      </div>
    </div>
  );
};

export default CreateStudentView;
