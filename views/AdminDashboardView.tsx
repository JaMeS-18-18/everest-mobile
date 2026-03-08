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

interface TaskStats {
  total: number;
  new: number;
  pending: number;
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
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    new: 0,
    pending: 0,
    reviewed: 0,
    overdue: 0
  });
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
      if (data?.taskStats) setTaskStats(data.taskStats);
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

  const taskChartItems = [
    { labelKey: 'admin_tasks_total', value: taskStats.total, barBg: 'bg-slate-500', icon: 'assignment' },
    { labelKey: 'admin_tasks_new', value: taskStats.new, barBg: 'bg-blue-500', icon: 'add_circle_outline' },
    { labelKey: 'admin_tasks_pending', value: taskStats.pending, barBg: 'bg-amber-500', icon: 'schedule' },
    { labelKey: 'admin_tasks_reviewed', value: taskStats.reviewed, barBg: 'bg-emerald-500', icon: 'check_circle' },
    { labelKey: 'admin_tasks_overdue', value: taskStats.overdue, barBg: 'bg-red-500', icon: 'warning' }
  ];
  const taskChartMax = Math.max(
    taskStats.total,
    taskStats.new,
    taskStats.pending,
    taskStats.reviewed,
    taskStats.overdue,
    1
  );

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

      {/* Vazifalar bo'yicha statistika — chart */}
      <div className="mb-8 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
        <div className="px-4 py-4 lg:px-6 lg:py-5 border-b border-slate-100 dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            {t('admin_tasks_stats_title')}
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
            {t('admin_tasks_chart_subtitle')}
          </p>
        </div>
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('admin_loading')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {taskChartItems.map((item, i) => {
                const pct = taskChartMax > 0 ? (item.value / taskChartMax) * 100 : 0;
                return (
                  <motion.div
                    key={item.labelKey}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2 min-w-[140px] sm:min-w-[160px]">
                      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl" title={t(item.labelKey)}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                        {t(item.labelKey)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="flex-1 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(pct, item.value > 0 ? 2 : 0)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          className={`h-full rounded-lg ${item.barBg} min-w-0`}
                        />
                      </div>
                      <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark tabular-nums w-10 text-right">
                        {item.value}
                      </span>
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
