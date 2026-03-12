import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserRole } from '../types';
import api, { FROZEN_MODAL_KEY } from '../api';
import { useTranslation } from '../contexts/LanguageContext';
import Logo from '../logo.jpg'
// import archaIcon from '../archaIcon.png'
interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

type FrozenStatus = 'finished' | 'left';

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const t = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [blockedUntil, setBlockedUntilState] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [frozenStatus, setFrozenStatus] = useState<FrozenStatus | null>(null);
  const [frozenTeacherTelegram, setFrozenTeacherTelegram] = useState<string | null>(null);

  // Load saved credentials on mount
  React.useEffect(() => {
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      try {
        const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
        setUsername(savedUsername || '');
        setPassword(savedPassword || '');
        setRememberMe(true);
      } catch {}
    }
  }, []);

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

  // Frozen modal: chiqarilgan/bitirgan o'quvchi kirganda yoki profilidan haydalganda
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FROZEN_MODAL_KEY);
      if (raw) {
        const { status, teacherTelegram } = JSON.parse(raw);
        if (status === 'finished' || status === 'left') setFrozenStatus(status);
        else setFrozenStatus('left');
        setFrozenTeacherTelegram(teacherTelegram || null);
        setShowFrozenModal(true);
        localStorage.removeItem(FROZEN_MODAL_KEY);
      }
    } catch (_) {}
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

      // Save or remove credentials based on rememberMe
      if (rememberMe) {
        localStorage.setItem('savedCredentials', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('savedCredentials');
      }

      // Use role from response (support admin, teacher, student, parent, supportTeacher)
      let userRole: UserRole = UserRole.STUDENT;
      if (data.user?.role === 'admin' || data.user?.role === 'Admin') userRole = UserRole.ADMIN;
      else if (data.user?.role === 'teacher' || data.user?.role === 'Teacher') userRole = UserRole.TEACHER;
      else if (data.user?.role === 'superadmin' || data.user?.role === 'SUPERADMIN' || data.user?.role === 'Superadmin') userRole = UserRole.SUPERADMIN;
      else if (data.user?.role === 'parent' || data.user?.role === 'Parent') userRole = UserRole.PARENT;
      else if (data.user?.role === 'supportTeacher') userRole = UserRole.SUPPORT_TEACHER;
      onLogin(userRole);
      setFailCount(0);
      setBlockedUntil(null);
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 403 && data?.code === 'STUDENT_FROZEN') {
        setError(null);
        setFrozenStatus(data.status === 'finished' || data.status === 'left' ? data.status : 'left');
        setFrozenTeacherTelegram(data.teacherTelegram || null);
        setShowFrozenModal(true);
      } else if (err?.response?.data?.message === 'Too many failed attempts. Please try again in 1 minute.') {
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

  // Do HomeWork dizayni (logo.jpg ranglari)
  const renderDoHomeworkLogin = () => (
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
            <img src={Logo} alt="Do HomeWork Logo" className="w-28 h-28 object-contain" />
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
              Do HomeWork
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/80 dark:text-primary/70">
                  <span className="material-symbols-outlined text-[22px] md:text-[18px]">person</span>
                </span>
                <input
                  className="w-full h-14 md:h-12 pl-12 pr-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-lg md:text-base font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/80 dark:text-primary/70">
                  <span className="material-symbols-outlined text-[22px] md:text-[18px]">lock</span>
                </span>
                <input
                  className="w-full h-14 md:h-12 pl-12 pr-12 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-lg md:text-base font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
                  placeholder="Enter password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/80 dark:text-primary/70"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[22px] md:text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  rememberMe 
                    ? 'bg-primary border-primary' 
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {rememberMe && (
                  <span className="material-symbols-outlined text-white text-[14px]">check</span>
                )}
              </button>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Remember me</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || (blockedUntil && Date.now() < blockedUntil)}
              className="w-full h-14 md:h-12 bg-primary hover:bg-primary-dark text-white text-lg md:text-base font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 4px 32px 0 rgba(5,171,196,0.25)' }}
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
            <span className="text-xs text-slate-400">contact: <a href="https://t.me/dohomework_support" target="_blank" rel="noopener noreferrer" className="underline">@dohomework_support</a></span>
          </div>
        </div>
      </div>
    </div>
  );

  const frozenModal = showFrozenModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-amber-600 dark:text-amber-400">info</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('login_frozen_title')}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
          {frozenStatus === 'finished' ? t('login_frozen_message_finished') : t('login_frozen_message_left')}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">{t('login_frozen_contact')}</p>
        <a
          href={frozenTeacherTelegram || 'https://t.me/dohomework_support'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#0088cc] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          {t('login_frozen_telegram_btn')}
        </a>
        <button
          type="button"
          onClick={() => setShowFrozenModal(false)}
          className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {t('login_frozen_close')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {frozenModal}
      {renderDoHomeworkLogin()}
    </>
  );
};

export default LoginView;
