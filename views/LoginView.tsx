import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserRole } from '../types';
import api from '../api';
import Logo from '../logo.png'
// import archaIcon from '../archaIcon.png'
interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [blockedUntil, setBlockedUntilState] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Helper to set blockedUntil and persist in localStorage
  const setBlockedUntil = (value: number | null) => {
    setBlockedUntilState(value);
    if (value) {
      localStorage.setItem('loginBlockedUntil', value.toString());
    } else {
      localStorage.removeItem('loginBlockedUntil');
    }
  };

  // On mount, restore blockedUntil from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('loginBlockedUntil');
    if (stored) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val > Date.now()) {
        setBlockedUntilState(val);
      } else {
        localStorage.removeItem('loginBlockedUntil');
      }
    }
  }, []);

  React.useEffect(() => {
    if (blockedUntil) {
      const updateSeconds = () => {
        const left = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left <= 0) {
          setBlockedUntil(null);
          setFailCount(0);
          setError(null);
        }
      };
      updateSeconds();
      const timer = setInterval(updateSeconds, 1000);
      return () => clearInterval(timer);
    } else {
      setSecondsLeft(0);
    }
  }, [blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockedUntil && Date.now() < blockedUntil) {
      setError('Too many failed attempts. Please try again in 1 minute.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const data = response.data;

      if (!data.success) {
        if (data.message === 'Too many failed attempts. Please try again in 1 minute.') {
          setBlockedUntil(Date.now() + 60 * 1000);
          setError(data.message);
        } else if (data.message === 'Invalid username or password') {
          setFailCount((prev) => {
            const next = prev + 1;
            if (next >= 5) {
              setBlockedUntil(Date.now() + 60 * 1000);
              setError('Too many failed attempts. Please try again in 1 minute.');
              return 0;
            }
            setError('Invalid username or password');
            return next;
          });
        } else {
          setError(data.message || 'Login failed');
        }
        setIsLoading(false);
        return;
      }

      // Save token and user data to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Use role from response (support admin, teacher, student, parent)
      let userRole: UserRole = UserRole.STUDENT;
      if (data.user?.role === 'admin' || data.user?.role === 'Admin') userRole = UserRole.ADMIN;
      else if (data.user?.role === 'teacher' || data.user?.role === 'Teacher') userRole = UserRole.TEACHER;
      else if (data.user?.role === 'superadmin' || data.user?.role === 'SUPERADMIN' || data.user?.role === 'Superadmin') userRole = UserRole.SUPERADMIN;
      else if (data.user?.role === 'parent' || data.user?.role === 'Parent') userRole = UserRole.PARENT;
      onLogin(userRole);
      setFailCount(0);
      setBlockedUntil(null);
    } catch (err: any) {
      if (err?.response?.data?.message === 'Too many failed attempts. Please try again in 1 minute.') {
        setBlockedUntil(Date.now() + 60 * 1000);
        setError('Too many failed attempts. Please try again in 1 minute.');
      } else if (err?.response?.data?.message === 'Invalid username or password') {
        setFailCount((prev) => {
          const next = prev + 1;
          if (next >= 5) {
            setBlockedUntil(Date.now() + 60 * 1000);
            setError('Too many failed attempts. Please try again in 1 minute.');
            return 0;
          }
          setError('Invalid username or password');
          return next;
        });
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background-light dark:bg-background-dark overflow-y-hidden transition-colors duration-300">
      <div className="flex flex-col items-center w-full px-4">
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0.25 }}
            className="rounded-3xl shadow-lg bg-card-light dark:bg-card-dark p-6 mb-6 flex items-center justify-center transition-colors duration-300"
            style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.04)' }}
          >
            <img src={Logo} alt="Everest Logo" className="w-28 h-28 object-contain" />
          </motion.div>
           {/* <motion.img
              src={archaIcon}
              alt="archa"
              width={30}
              height={30}
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 8, -8, 6, -6, 0] }}
              transition={{
                duration: 0.6,      // qimirlash vaqti (qisqa)
                repeat: Infinity,
                repeatDelay: 2,     // har 2 sekundda bir
                ease: "easeInOut",
              }}
              style={{
                objectFit: "contain",
                marginLeft: "3px",
                filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.18))",
                transformOrigin: "center bottom", // qo‘ng‘iroq effekti uchun MUHIM
              }}
            /> */}
          <div className='flex items-center justify-center gap-2'>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-3xl md:text-2xl font-extrabold text-center mb-2 text-text-primary-light dark:text-text-primary-dark tracking-tight transition-colors duration-300"
            >
              Pluto Homework
            </motion.h1>
           

          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-base md:text-sm text-center mb-8 text-text-secondary-light dark:text-text-secondary-dark transition-colors duration-300"
          >
            Manage your classes
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="w-full space-y-6"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 text-sm mb-2">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-base md:text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ca0c3] dark:text-[#b0bed0]">
                  <span className="material-symbols-outlined text-[22px] md:text-[18px]">person</span>
                </span>
                <input
                  className="w-full h-14 md:h-12 pl-12 pr-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-lg md:text-base font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-[#8ca0c3] dark:placeholder-[#b0bed0]"
                  placeholder="Enter username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-base md:text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ca0c3] dark:text-[#b0bed0]">
                  <span className="material-symbols-outlined text-[22px] md:text-[18px]">lock</span>
                </span>
                <input
                  className="w-full h-14 md:h-12 pl-12 pr-12 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-lg md:text-base font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-[#8ca0c3] dark:placeholder-[#b0bed0]"
                  placeholder="Enter password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8ca0c3] dark:text-[#b0bed0]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[22px] md:text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || (blockedUntil && Date.now() < blockedUntil)}
              className="w-full h-14 md:h-12 bg-primary hover:bg-primary-dark text-white text-lg md:text-base font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 4px 32px 0 rgba(45,140,240,0.10)' }}
            >
              {isLoading ? (
                <>
                  <motion.span
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4" opacity="0.2" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </motion.span>
                  <span className="ml-2">Logging in...</span>
                </>
              ) : blockedUntil && secondsLeft > 0 ? (
                <>
                  <span>Try again in {secondsLeft}s</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <span className="material-symbols-outlined text-[22px] md:text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </motion.form>
          <div className="w-full flex justify-center mt-4">
            <span className="text-xs text-slate-400">contact: <a href="https://t.me/Pluto_18" target="_blank" rel="noopener noreferrer" className="underline">@Pluto_18</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
