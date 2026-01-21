import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '@/components/Loader';

interface GroupInfo {
  _id: string;
  name: string;
  room?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
}

interface TeacherInfo {
  _id: string;
  fullName: string;
  phone?: string;
}

interface Child {
  _id: string;
  fullName: string;
  phone: string;
  profileImage?: string;
  groupId: GroupInfo;
  teacherId?: TeacherInfo;
}

interface ChildStats {
  totalHomeworks: number;
  pendingCount: number;
  overdueCount: number;
  submittedCount: number;
  gradedCount: number;
  totalPoints: number;
  completionRate: number;
}

interface ChildWithStats extends Child {
  stats?: ChildStats;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

const getProfileImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const ParentHomeView: React.FC = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/parents/my-children', {
          signal: controller.signal
        });
        
        if (!ignore && response.data.success) {
          setChildren(response.data.data);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && !ignore) {
          setError(err.response?.data?.message || 'Failed to load children');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {user.profileImage ? (
              <img src={getProfileImageUrl(user.profileImage)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl">person</span>
            )}
          </div>
          <div>
            <p className="text-purple-100 text-sm">Welcome back,</p>
            <h1 className="text-xl font-bold capitalize">{user.fullName || 'Parent'}</h1>
          </div>
        </div>
        <p className="text-purple-100 text-sm">
          <span className="material-symbols-outlined text-sm align-middle mr-1">family_restroom</span>
          {children.length} {children.length === 1 ? 'child' : 'children'} registered
        </p>
      </div>

      {/* Content */}
      <div className="p-4 -mt-4">
        <h2 className="text-lg font-bold mb-4">My Children</h2>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 p-4 rounded-xl mb-4">
            {error}
          </div>
        )}

        {children.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
            <span className="material-symbols-outlined text-5xl mb-3">child_care</span>
            <p>No children assigned yet</p>
            <p className="text-sm mt-1">Please contact your teacher</p>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(child => (
              <div
                key={child._id}
                onClick={() => navigate(`/parent/child/${child._id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
                    {child.profileImage ? (
                      <img src={getProfileImageUrl(child.profileImage)} alt={child.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xl font-bold">
                        {child.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg capitalize truncate">{child.fullName}</h3>
                    <p className="text-sm text-slate-500 truncate">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">groups</span>
                      {child.groupId?.name || 'No group'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </div>

                {/* Quick Stats - from child.stats */}
                {child.stats && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{child.stats.totalPoints}</p>
                      <p className="text-xs text-green-600">Points</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{child.stats.completionRate}%</p>
                      <p className="text-xs text-blue-600">Completed</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{child.stats.gradedCount}</p>
                      <p className="text-xs text-purple-600">Graded</p>
                    </div>
                  </div>
                )}

                {/* Group Schedule */}
                {child.groupId?.days && child.groupId.days.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{child.groupId.startTime} - {child.groupId.endTime}</span>
                      <span className="text-slate-300">|</span>
                      <span>{child.groupId.days.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentHomeView;
