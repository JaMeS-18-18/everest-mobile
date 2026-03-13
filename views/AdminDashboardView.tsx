import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';
import { useTranslation } from '../contexts/LanguageContext';

interface Stats {
  teacherCount: number;
  studentCount: number;
  supportTeacherCount: number;
  parentCount: number;
  groupCount: number;
}

interface TeacherStat {
  teacherId: string;
  fullName: string;
  total: number;
  reviewed: number;
  overdue: number;
}

const AdminDashboardView: React.FC = () => {
  const t = useTranslation();
  const [stats, setStats] = useState<Stats>({
    teacherCount: 0,
    studentCount: 0,
    supportTeacherCount: 0,
    parentCount: 0,
    groupCount: 0
  });
  const [teacherStats, setTeacherStats] = useState<TeacherStat[]>([]);
  const [organization, setOrganization] = useState<{ name: string; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
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
      if (data?.teacherStats) setTeacherStats(data.teacherStats);
      if (data?.organization) setOrganization(data.organization);
    } catch (err) {
      toast.error(t('admin_stats_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const statCards = [
    { labelKey: 'nav_teachers', value: stats.teacherCount, icon: 'school', color: 'bg-primary/10 text-primary' },
    { labelKey: 'nav_students', value: stats.studentCount, icon: 'person', color: 'bg-emerald-500/10 text-emerald-600' },
    { labelKey: 'admin_assistant_teachers', value: stats.supportTeacherCount, icon: 'support_agent', color: 'bg-amber-500/10 text-amber-600' },
    { labelKey: 'admin_parents', value: stats.parentCount, icon: 'family_restroom', color: 'bg-violet-500/10 text-violet-600' },
    { labelKey: 'nav_groups', value: stats.groupCount, icon: 'groups', color: 'bg-cyan-500/10 text-cyan-600' }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Tarif va yangilash — pastdagi Dashboard sarlavhasi olib tashlandi */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {organization?.plan && (
          <button
            type="button"
            onClick={() => setShowPlansModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">workspace_premium</span>
            <span className="capitalize">
              {organization.plan === 'basic' ? 'Basic' : organization.plan === 'premium' ? 'Premium' : 'Platinum'}
            </span>
            <span className="material-symbols-outlined text-base opacity-90">expand_more</span>
          </button>
        )}
          <button
          onClick={() => fetchDashboard()}
          className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
          aria-label={t('admin_refresh')}
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.labelKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-card-dark rounded-xl p-4 lg:p-5 border border-slate-200 dark:border-border-dark shadow-sm"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
              <span className="material-symbols-outlined text-xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {loading ? '—' : card.value}
            </p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t(card.labelKey)}</p>
          </motion.div>
        ))}
      </div>

      {/* O'qituvchilar statistikasi — tekshirilgan va muddati o'tgan foizda */}
      <div className="mb-8 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
        <div className="px-4 py-4 lg:px-6 lg:py-5 border-b border-slate-100 dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            {t('admin_teacher_stats_title')}
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
            {t('admin_teacher_stats_subtitle')}
          </p>
        </div>
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('admin_loading')}</p>
            </div>
          ) : teacherStats.length === 0 ? (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
              {t('admin_teacher_stats_empty')}
            </p>
          ) : (
            <div className="space-y-6">
              {teacherStats.map((ts, i) => {
                const total = ts.total || 0;
                const reviewedPct = total > 0 ? Math.round((ts.reviewed / total) * 100) : 0;
                const overduePct = total > 0 ? Math.round((ts.overdue / total) * 100) : 0;
                return (
                  <motion.div
                    key={String(ts.teacherId)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className="border border-slate-100 dark:border-border-dark rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">person</span>
                      <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                        {ts.fullName || '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                            {t('admin_tasks_reviewed')}
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {reviewedPct}%
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(reviewedPct, 100)}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="h-full rounded-full bg-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                            {t('admin_tasks_overdue')}
                          </span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                            {overduePct}%
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(overduePct, 100)}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="h-full rounded-full bg-red-500"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tariflar modal — kengroq, yangi dizayn */}
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
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-2xl lg:max-w-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 lg:p-6 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">workspace_premium</span>
                  {t('admin_plan_plans')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPlansModal(false)}
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-5 lg:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                  {allPlans.map((plan) => {
                    const isCurrent = organization?.plan?.toLowerCase() === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl border-2 p-5 transition-all ${
                          isCurrent
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10'
                            : 'border-slate-200 dark:border-border-dark bg-slate-50/50 dark:bg-card-dark/50 hover:border-slate-300 dark:hover:border-border-dark'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-bold text-lg capitalize ${isCurrent ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold">
                              {t('admin_plan_current')}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl lg:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                          ${plan.price}
                          <span className="text-sm font-normal text-text-secondary-light dark:text-text-secondary-dark">{t('admin_plan_per_month')}</span>
                        </p>
                        <ul className="text-sm text-text-secondary-light dark:text-text-secondary-dark space-y-2">
                          <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">person</span>
                            {plan.studentsMax} {t('admin_plan_students')}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">school</span>
                            {plan.teachersMax} {t('admin_plan_teachers')}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">support_agent</span>
                            {plan.supportTeachersMax} {t('admin_plan_assistant')}
                          </li>
                        </ul>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-border-dark text-center">
                  <a
                    href="https://t.me/dohomework_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary font-medium bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined">send</span>
                    {t('admin_plan_change')}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboardView;
