import React, { useEffect, useState } from 'react';
import api from '../api';
import Loader from '@/components/Loader';

interface Group {
  id: string;
  name: string;
  studentsCount?: number;
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
}

interface SupportTeacherInfo {
  teacherId: string;
  teacherName: string;
  assignedGroups: string | string[];
  groups: Group[];
}

const SupportTeacherGroupsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [isAllGroups, setIsAllGroups] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data.success && meRes.data.user.supportTeacherInfo) {
          const info: SupportTeacherInfo = meRes.data.user.supportTeacherInfo;
          setTeacherName(info.teacherName);
          setIsAllGroups(info.assignedGroups === 'all');
          setGroups(info.groups);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">My Groups</h1>
        <p className="text-blue-100 text-sm mt-1">
          {isAllGroups ? 'All groups' : `${groups.length} groups`} • {teacherName}
        </p>
      </header>

      {/* Groups List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">folder_off</span>
            <p className="text-lg font-medium">No groups found</p>
            <p className="text-sm">No groups have been assigned to you yet</p>
          </div>
        ) : (
          groups.map((group, index) => (
            <div
              key={group.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{group.name}</h3>
                  {group.daysOfWeek && group.daysOfWeek.length > 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {group.daysOfWeek.join(', ')}
                    </p>
                  )}
                  {group.startTime && group.endTime && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {group.startTime} - {group.endTime}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {group.studentsCount !== undefined && (
                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {group.studentsCount} students
                      </span>
                    </div>
                  )}
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Card */}
      <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600">info</span>
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Support Teacher</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You can view {isAllGroups ? 'all groups' : `${groups.length} groups`} as {teacherName}'s assistant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTeacherGroupsView;
