import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';
import { useTranslation } from '../contexts/LanguageContext';

interface StudentRow {
  _id: string;
  fullName: string;
  parentId?: { fullName: string } | null;
  teacherId?: { fullName: string } | null;
}

const AdminParentsView: React.FC = () => {
  const t = useTranslation();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students');
      const all = res.data?.data ?? [];
      setStudents(all.filter((s: StudentRow) => s.parentId != null));
    } catch {
      toast.error(t('admin_students_load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getParentName = (s: StudentRow) =>
    s.parentId && typeof s.parentId === 'object' && 'fullName' in s.parentId
      ? (s.parentId as { fullName: string }).fullName
      : '';
  const getTeacherName = (s: StudentRow) =>
    s.teacherId && typeof s.teacherId === 'object' && 'fullName' in s.teacherId
      ? (s.teacherId as { fullName: string }).fullName
      : '';

  const filtered = search.trim()
    ? students.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          getParentName(s).toLowerCase().includes(search.toLowerCase()) ||
          getTeacherName(s).toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="min-h-screen bg-transparent pb-8">
      <header className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
          {t('admin_parents')}
        </h1>
        <button
          type="button"
          onClick={fetchData}
          className="w-10 h-10 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors"
          aria-label={t('admin_refresh')}
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
        </button>
      </header>

      <div className="mb-4 relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin_parents_search_placeholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark">
          <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-primary animate-spin" />
          <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('admin_loading')}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="py-20 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">school</span>
          <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('admin_students_empty')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-center">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('admin_students_not_found')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => {
            const parentName = getParentName(s) || null;
            const teacherName = getTeacherName(s) || null;
            return (
            <motion.article
              key={s._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-400/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">person</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t('nav_student')}
                    </p>
                    <p className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                      {s.fullName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 dark:bg-violet-400/15 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">family_restroom</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t('admin_parents_label')}
                    </p>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark truncate" title={parentName ?? undefined}>
                      {parentName ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 dark:bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">school</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t('admin_teacher_label')}
                    </p>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark truncate" title={teacherName ?? undefined}>
                      {teacherName ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminParentsView;
