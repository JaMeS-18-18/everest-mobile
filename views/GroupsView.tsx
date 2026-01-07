import React, { useState, useEffect } from 'react';
import { View } from '../types';
import api from '../api';

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

interface GroupsViewProps {
  navigate: (view: View, groupId?: string) => void;
}

const GroupsView: React.FC<GroupsViewProps> = ({ navigate }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');
  const getProfileImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    // Always fetch latest user info from /auth/me
    api.get('/auth/me').then(res => {
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    });
  }, []);
 

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
      </div>
    );
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

    const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img
                    src={getProfileImageUrl(user.profileImage) || 'https://picsum.photos/seed/profile/200/200'}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary text-2xl">person</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium">{getGreeting()},</span>
              <span className="text-lg font-bold">{user.fullName || 'Teacher'}</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('SETTINGS')}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-slate-500">settings</span>
          </button>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight mb-4">My Groups</h1>
      </div>

      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pt-0">
        <div className="flex items-center bg-white dark:bg-slate-800 h-12 rounded-xl shadow-sm px-4 border border-transparent focus-within:border-primary/50 transition-all">
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

      <div className="px-4 space-y-4 pb-24">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">folder_off</span>
            <p>No groups found</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div 
              key={group._id} 
              onClick={() => navigate('GROUP_DETAIL', group._id)}
              className="group relative flex items-stretch justify-between gap-4 rounded-2xl bg-card-light dark:bg-card-dark p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer"
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
                        <span key={day} className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
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

      <div className="fixed bottom-24 right-0 left-0 z-30 flex justify-end max-w-md mx-auto px-6 pointer-events-none">
        <button 
          onClick={() => navigate('CREATE_GROUP')}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-all pointer-events-auto"
          style={{ boxShadow: '0 4px 32px 0 rgba(45,140,240,0.10)' }}
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </div>
    </div>
  );
};

export default GroupsView;
