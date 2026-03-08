import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';
import { useTranslation } from '../contexts/LanguageContext';

interface GroupItem {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  studentCount: number;
}

const AdminTeacherDetailView: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const t = useTranslation();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [teacherName, setTeacherName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const [groupsRes, usersRes] = await Promise.all([
          api.get(`/admin/teachers/${teacherId}/groups`),
          api.get('/users?role=teacher')
        ]);
        const list = groupsRes.data?.data ?? [];
        setGroups(list);
        const teachers = usersRes.data?.data ?? [];
        const found = teachers.find((x: { _id: string }) => x._id === teacherId);
        setTeacherName(found?.fullName || t('teacher'));
      } catch (err) {
        toast.error(t('admin_teacher_data_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [teacherId]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-slate-50 dark:hover:opacity-90"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {teacherName}
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {t('admin_teacher_groups_rating')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('admin_loading')}</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-400">groups</span>
          <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">{t('admin_teacher_no_groups')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, idx) => (
            <motion.div
              key={group._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => navigate(`/admin/teacher/${teacherId}/group/${group._id}`)}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {group.name}
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {group.startTime} – {group.endTime}
                    {group.daysOfWeek?.length ? ` · ${group.daysOfWeek.join(', ')}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {group.studentCount} {t('admin_teacher_student_count')}
                </span>
                <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">
                  chevron_right
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
        {t('admin_teacher_click_ranking')}
      </p>
    </div>
  );
};

export default AdminTeacherDetailView;
