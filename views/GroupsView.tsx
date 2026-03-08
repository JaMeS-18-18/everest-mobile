
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '@/components/Loader';
import { motion } from 'framer-motion';
// import archaIcon from '../archaIcon.png'

interface Student {
  _id: string;
  fullName: string;
  phone: string;
  username: string;
}

interface Group {
  _id: string;
  name: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  students: Student[];
  createdAt: string;
  updatedAt: string;
}

const CREATE_GROUP_DAYS = [
  { key: 'Monday', label: 'Du' },
  { key: 'Tuesday', label: 'Se' },
  { key: 'Wednesday', label: 'Ch' },
  { key: 'Thursday', label: 'Pa' },
  { key: 'Friday', label: 'Ju' },
  { key: 'Saturday', label: 'Sh' },
  { key: 'Sunday', label: 'Ya' },
];

const GroupsView: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Group modal
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    startTime: '09:00',
    endTime: '10:30',
    daysOfWeek: [] as string[],
  });
  const [createGroupError, setCreateGroupError] = useState('');
  const [isCreateGroupSubmitting, setIsCreateGroupSubmitting] = useState(false);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');
  const getProfileImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      const data = response.data;

      if (data.success) {
        setGroups(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch groups');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  };

  const getDayAbbr = (day: string) => {
    const abbrs: Record<string, string> = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun',
    };
    return abbrs[day] || day.slice(0, 3);
  };

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleGroupDay = (day: string) => {
    setGroupForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleCreateGroup = async () => {
    setCreateGroupError('');
    if (!groupForm.name.trim()) {
      setCreateGroupError('Guruh nomi kiritilishi shart');
      return;
    }
    if (!groupForm.startTime || !groupForm.endTime) {
      setCreateGroupError('Boshlash va tugash vaqtini kiriting');
      return;
    }
    if (groupForm.daysOfWeek.length === 0) {
      setCreateGroupError('Kamida bitta kunni tanlang');
      return;
    }
    setIsCreateGroupSubmitting(true);
    try {
      const res = await api.post('/groups', {
        name: groupForm.name,
        startTime: groupForm.startTime,
        endTime: groupForm.endTime,
        daysOfWeek: groupForm.daysOfWeek,
      });
      if (res.data.success) {
        setIsCreateGroupOpen(false);
        setGroupForm({ name: '', startTime: '09:00', endTime: '10:30', daysOfWeek: [] });
        fetchGroups();
      } else {
        setCreateGroupError(res.data.message || 'Guruh yaratib bo\'lmadi');
      }
    } catch (err: any) {
      setCreateGroupError(err?.response?.data?.message || 'Guruh yaratib bo\'lmadi');
    } finally {
      setIsCreateGroupSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error}</p>
        <button
          onClick={fetchGroups}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-2 pt-4 pb-2 sm:px-4">
        <div className="flex items-center bg-white dark:bg-card-dark h-12 rounded-xl shadow-sm px-4 border border-transparent focus-within:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-text-secondary-light">search</span>
          <input
            type="text"
            placeholder="Search by group name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-base"
          />
        </div>
      </div>

      <div className="px-2 space-y-4 pb-24 sm:px-4">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">folder_off</span>
            <p>No groups found</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group._id}
              onClick={() => navigate(`/groups/${group._id}`)}
              className="group relative flex items-stretch justify-between gap-4 rounded-2xl bg-card-light dark:bg-card-dark p-4 shadow-sm border border-slate-100 dark:border-border-dark hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors capitalize">{group.name}</h3>
                  <p className="text-text-secondary-light text-sm">{group.students.length} Students</p>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-text-secondary-light text-sm mb-2">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>{group.startTime} - {group.endTime}</span>
                  </div>
                  <div className="flex gap-1">
                    {allDays.map(day => {
                      const isActive = group.daysOfWeek.some(d => getDayAbbr(d) === day);
                      return (
                        <span key={day} className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-card-dark text-slate-400'
                          }`}>
                          {day.slice(0, 2)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="flex -space-x-2">
                  {group.students.slice(0, 3).map((student, idx) => (
                    <div
                      key={student._id}
                      className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-white dark:ring-slate-900 overflow-hidden"
                    >
                      {student.profileImage ? (
                        <img
                          src={getProfileImageUrl(student.profileImage) || 'https://picsum.photos/seed/student/200/200'}
                          alt={student.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        student.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                  {group.students.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900">
                      +{group.students.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB — o'ng pastda, o'quvchi qo'shish bilan bir xil joylashuv */}
      <div className="fixed z-30 bottom-20 right-4 sm:right-6 lg:bottom-8 lg:right-8">
        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-all hover:bg-primary-dark"
          style={{ boxShadow: '0 4px 20px rgba(5, 171, 196, 0.35)' }}
          aria-label="Guruh qo'shish"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 p-0 lg:p-4">
          <div className="bg-white dark:bg-card-dark rounded-t-3xl lg:rounded-2xl w-full max-w-md lg:max-w-xl flex flex-col shadow-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-border-dark shrink-0">
              <h3 className="text-lg font-bold">Yangi guruh</h3>
              <button
                onClick={() => { setIsCreateGroupOpen(false); setCreateGroupError(''); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-card-dark/90 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {createGroupError && (
                <div className="text-red-500 text-sm text-center">{createGroupError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-0.5">Guruh nomi *</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={groupForm.name}
                  onChange={e => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masalan: Pre-IELTS"
                  maxLength={50}
                  className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl px-3 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jadval</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-0.5">Boshlash</label>
                    <input
                      type="time"
                      value={groupForm.startTime}
                      onChange={e => setGroupForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl px-3 text-base"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-0.5">Tugash</label>
                    <input
                      type="time"
                      value={groupForm.endTime}
                      onChange={e => setGroupForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl px-3 text-base"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Qaysi kunlarda *</p>
                <div className="flex flex-wrap gap-2">
                  {CREATE_GROUP_DAYS.map(day => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleGroupDay(day.key)}
                      className={`w-10 h-10 rounded-full text-sm font-bold border border-slate-200 dark:border-border-dark transition-all ${
                        groupForm.daysOfWeek.includes(day.key)
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 dark:bg-card-dark text-slate-400'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateGroup}
                disabled={isCreateGroupSubmitting}
                className="w-full h-11 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
              >
                {isCreateGroupSubmitting ? 'Yuklanmoqda...' : 'Guruh yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsView;
