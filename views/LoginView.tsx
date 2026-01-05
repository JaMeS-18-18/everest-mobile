
import React, { useState } from 'react';
import { UserRole } from '../types';
import api from '../api';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user data to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Use role from response
      const userRole = data.user?.role === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT;
      onLogin(userRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="w-full h-48 sm:h-64 bg-primary/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light dark:to-background-dark"></div>
        <img 
          alt="Login banner" 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          src="https://picsum.photos/seed/school/800/400" 
        />
      </div>
      
      <div className="flex-1 -mt-10 px-4 z-10">
        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">Classroom Connect</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-center mb-6">Log in to manage your homework.</p>
          
          <div className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setSelectedRole(UserRole.STUDENT)}
              className={`flex-1 h-full rounded-md text-sm font-medium transition-all ${
                selectedRole === UserRole.STUDENT 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                : 'text-slate-500'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setSelectedRole(UserRole.TEACHER)}
              className={`flex-1 h-full rounded-md text-sm font-medium transition-all ${
                selectedRole === UserRole.TEACHER 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                : 'text-slate-500'
              }`}
            >
              Teacher
            </button>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium ml-1">Username</label>
            <input 
              className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              placeholder="Enter your username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium ml-1">Password</label>
              <a href="#" className="text-primary text-sm font-medium">Forgot Password?</a>
            </div>
            <div className="relative">
              <input 
                className="w-full h-12 px-4 pr-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <span className="material-symbols-outlined text-[20px]">login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pb-8">
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Don't have an account? <a href="#" className="text-primary font-medium hover:underline">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
