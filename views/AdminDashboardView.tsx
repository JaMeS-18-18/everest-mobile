import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';

interface Stats {
  teacherCount: number;
  studentCount: number;
  supportTeacherCount: number;
  parentCount: number;
  groupCount: number;
}

interface Teacher {
  _id: string;
  fullName: string;
  username: string;
  phone?: string;
  subject?: string;
  groupCount: number;
  studentCount: number;
}

const AdminDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    teacherCount: 0,
    studentCount: 0,
    supportTeacherCount: 0,
    parentCount: 0,
    groupCount: 0
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [organization, setOrganization] = useState<{ name: string; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', username: '', password: '', phone: '', subject: '' });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const allPlans = [
    { id: 'basic', name: 'Basic', price: 19, studentsMax: 100, teachersMax: 5, supportTeachersMax: 5 },
    { id: 'premium', name: 'Premium', price: 39, studentsMax: 300, teachersMax: 10, supportTeachersMax: 10 },
    { id: 'platinum', name: 'Platinum', price: 59, studentsMax: 1000, teachersMax: 20, supportTeachersMax: 20 },
  ];

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      const data = res.data?.data;
      if (data?.stats) setStats(data.stats);
      if (Array.isArray(data?.teachers)) setTeachers(data.teachers);
      if (data?.organization) setOrganization(data.organization);
    } catch (err) {
      toast.error('Statistika yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filtered = teachers.filter(
    t =>
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      t.username?.toLowerCase().includes(search.toLowerCase())
  );

  const getOrgName = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.organization?.name || null;
      }
    } catch {}
    return null;
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.username.trim() || !createForm.password.trim()) {
      toast.error('Ism, login va parol kiritilishi shart');
      return;
    }
    if (createForm.password.length < 8) {
      toast.error('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', { ...createForm, role: 'teacher' });
      toast.success('O\'qituvchi qo\'shildi');
      setShowCreateTeacher(false);
      setCreateForm({ fullName: '', username: '', password: '', phone: '', subject: '' });
      setShowCreatePassword(false);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'O\'qituvchi qo\'shib bo\'lmadi');
    } finally {
      setCreating(false);
    }
  };

  const statCards = [
    { label: "O'qituvchilar", value: stats.teacherCount, icon: 'school', color: 'bg-primary/10 text-primary' },
    { label: "O'quvchilar", value: stats.studentCount, icon: 'person', color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Yordamchi o\'qituvchilar', value: stats.supportTeacherCount, icon: 'support_agent', color: 'bg-amber-500/10 text-amber-600' },
    { label: "Ota-onalar", value: stats.parentCount, icon: 'family_restroom', color: 'bg-violet-500/10 text-violet-600' },
    { label: 'Guruhlar', value: stats.groupCount, icon: 'groups', color: 'bg-cyan-500/10 text-cyan-600' }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Markaz statistikasi
            </span>
            {(organization?.name || getOrgName()) && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {organization?.name || getOrgName()}
              </span>
            )}
            {organization?.plan && (
              <button
                type="button"
                onClick={() => setShowPlansModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg">workspace_premium</span>
                <span className="capitalize">
                  {organization.plan === 'basic' ? 'Basic' : organization.plan === 'premium' ? 'Premium' : 'Platinum'}
                </span>
                <span className="material-symbols-outlined text-base opacity-90">expand_more</span>
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchDashboard()}
          className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors self-start sm:self-center"
          aria-label="Yangilash"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-5 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
              <span className="material-symbols-outlined text-xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {loading ? '—' : card.value}
            </p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Teachers section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            O'qituvchilar
          </h2>
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
              <span className="material-symbols-outlined text-lg">search</span>
            </span>
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-text-primary-light dark:text-text-primary-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <button
            onClick={() => setShowCreateTeacher(true)}
            className="h-10 px-4 rounded-lg bg-primary text-white font-medium text-sm flex items-center gap-2 hover:bg-primary-dark transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            O'qituvchi qo'shish
          </button>
        </div>

        <div className="p-4 lg:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">Yuklanmoqda...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
              {search ? 'O\'qituvchilar topilmadi' : 'O\'qituvchilar yo\'q'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((teacher, idx) => {
                const initials = teacher.fullName
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || '?';
                return (
                  <motion.div
                    key={teacher._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(`/admin/teacher/${teacher._id}`)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                          {teacher.fullName}
                        </span>
                        {teacher.subject && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            {teacher.subject}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                        @{teacher.username}
                        {teacher.phone ? ` · ${teacher.phone}` : ''}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                        {teacher.groupCount} guruh, {teacher.studentCount} o'quvchi
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">
                      chevron_right
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tariflar modal — barcha tariflar */}
      <AnimatePresence>
        {showPlansModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowPlansModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">workspace_premium</span>
                  Tariflar
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPlansModal(false)}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {allPlans.map((plan) => {
                  const isCurrent = organization?.plan?.toLowerCase() === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        isCurrent
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-lg capitalize ${isCurrent ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                          {plan.name}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-lg bg-primary text-white text-xs font-medium">
                            Joriy tarif
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                        ${plan.price}
                        <span className="text-sm font-normal text-text-secondary-light dark:text-text-secondary-dark">/oy</span>
                      </p>
                      <ul className="text-sm text-text-secondary-light dark:text-text-secondary-dark space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">person</span>
                          {plan.studentsMax} o'quvchigacha
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">school</span>
                          {plan.teachersMax} o'qituvchigacha
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">support_agent</span>
                          {plan.supportTeachersMax} yordamchi o'qituvchi
                        </li>
                      </ul>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 pt-0 text-center">
                <a
                  href="https://t.me/dohomework_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  Tarifni o'zgartirish uchun Telegram: @dohomework_support
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Teacher Modal — Dashboard'dan qo'shish */}
      <AnimatePresence>
        {showCreateTeacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCreateTeacher(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleCreateTeacher}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacher(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">close</span>
                </button>
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Yangi o'qituvchi</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">F.I.O *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">badge</span>
                    </span>
                    <input
                      type="text"
                      placeholder="To'liq ism"
                      value={createForm.fullName}
                      onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Telefon</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">call</span>
                    </span>
                    <input
                      type="text"
                      placeholder="90 123 45 67"
                      value={createForm.phone}
                      onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Login *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">alternate_email</span>
                    </span>
                    <input
                      type="text"
                      placeholder="username"
                      value={createForm.username}
                      onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Parol *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">lock</span>
                    </span>
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={createForm.password}
                      onChange={e => setCreateForm({ ...createForm, password: e.target.value.replace(/\s/g, '') })}
                      className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-xl">{showCreatePassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Kamida 8 ta belgi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Fan / yo'nalish</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">school</span>
                    </span>
                    <input
                      type="text"
                      placeholder="Masalan: English"
                      value={createForm.subject}
                      onChange={e => setCreateForm({ ...createForm, subject: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined">person_add</span>
                      O'qituvchi qo'shish
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardView;
