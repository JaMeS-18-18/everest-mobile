import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';
import { useTranslation } from '../contexts/LanguageContext';

interface StudentItem {
  _id: string;
  fullName: string;
  username: string;
  phone?: string;
  groupId?: { _id: string; name: string } | null;
  teacherId?: { _id: string; fullName: string } | null;
}

const AdminStudentsView: React.FC = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data?.data ?? []);
    } catch (err) {
      toast.error(t('admin_students_load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(
    s =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || '').includes(search) ||
      (s.groupId as { name?: string })?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (s.teacherId as { fullName?: string })?.fullName?.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header: only count and org (title is in AppHeader; no duplicate "Students") */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            {students.length} {t('admin_students_count_word')}
          </span>
          {getOrgName() && (
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              • {getOrgName()}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchStudents()}
          className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors self-start sm:self-center"
          aria-label={t('admin_refresh')}
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-2xl">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
          <span className="material-symbols-outlined">search</span>
        </span>
        <input
          type="text"
          placeholder={t('admin_students_search_placeholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-text-primary-light dark:text-text-primary-dark placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
        />
      </div>

      {/* Students list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">{t('admin_loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-emerald-500">school</span>
            </div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
              {search ? t('admin_students_not_found') : t('admin_students_empty')}
            </p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {search ? t('admin_students_search_other') : t('admin_students_add_via_teachers')}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((student, idx) => {
              const group = student.groupId as { name?: string } | null | undefined;
              const teacher = student.teacherId as { fullName?: string } | null | undefined;
              const initials = student.fullName
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || '?';
              return (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  onClick={() => navigate(`/students/${student._id}`)}
                  className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-slate-200 dark:border-border-dark flex items-start gap-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                      {student.fullName}
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                      @{student.username}
                    </p>
                    {student.phone && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                        {student.phone}
                      </p>
                    )}
                    {group?.name && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary w-fit">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {group.name}
                      </p>
                    )}
                    {teacher?.fullName && (
                      <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                        {t('admin_teacher_label')} {teacher.fullName}
                      </p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-slate-400 flex-shrink-0">chevron_right</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsView;
