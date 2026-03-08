import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';
import { useTranslation } from '../contexts/LanguageContext';

interface Item {
  _id: string;
  fullName: string;
  username: string;
  phone?: string;
  createdByTeacherId?: { fullName: string };
}

const AdminAssistantTeachersView: React.FC = () => {
  const t = useTranslation();
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/support-teachers');
      setList(res.data?.data ?? []);
    } catch {
      toast.error(t('admin_students_load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex items-center justify-between gap-4 mb-6">
        <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          {list.length} {t('admin_assistant_teachers')}
        </span>
        <button
          onClick={() => fetchList()}
          className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
          aria-label={t('admin_refresh')}
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">{t('admin_loading')}</p>
        </div>
      ) : list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">support_agent</span>
          </div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">{t('admin_no_teachers')}</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {list.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-slate-200 dark:border-border-dark flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">{item.fullName}</h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">@{item.username}</p>
                {item.phone && (
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{item.phone}</p>
                )}
                {item.createdByTeacherId?.fullName && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    {t('admin_teacher_label')} {item.createdByTeacherId.fullName}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAssistantTeachersView;
