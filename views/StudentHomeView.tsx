import React, { useState, useEffect } from 'react';
import { View } from '../types';
import api from '../api';
import { motion } from 'framer-motion';
// import archaIcon from '../archaIcon.png'

interface ImageFile {
  filename: string;
  url: string;
  mimetype: string;
  size: number;
}

interface Assignment {
  _id: string;
  name: string;
  images: ImageFile[];
}

interface GroupInfo {
  _id: string;
  name: string;
}

interface TeacherInfo {
  _id: string;
  fullName: string;
}

interface Submission {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  teacherComment?: string;
}

interface Homework {
  _id: string;
  description: string;
  deadline: string;
  category: string;
  link?: string;
  teacherId: TeacherInfo;
  groupId: GroupInfo | null;
  assignmentType: 'group' | 'individual';
  assignments: Assignment[];
  status: 'new' | 'in_progress' | 'completed';
  submitted: boolean;
  submission: Submission | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

import { useNavigate } from 'react-router-dom';
import Loader from '@/components/Loader';

const StudentHomeView: React.FC = () => {
  const navigate = useNavigate();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [groupName, setGroupName] = useState<string>('');

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

        // Get group name from user data
        if (res.data.user.studentInfo.groupId?.name) {
          setGroupName(res.data.user.studentInfo.groupId.name);
        }
      }
    });
  }, []);

  useEffect(() => {
    fetchMyHomeworks();
  }, []);

  const fetchMyHomeworks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/homework/');
      const data = response.data;

      if (data.success) {
        setHomeworks(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch homeworks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch homeworks');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PHOTO':
        return 'photo_library';
      case 'VIDEO':
        return 'videocam';
      case 'AUDIO':
        return 'mic';
      case 'DOCUMENT':
        return 'description';
      default:
        return 'assignment';
    }
  };

  // Helper function to get homework status
  const getHomeworkStatus = (hw: Homework) => {
    if (!hw.submitted) {
      if (isOverdue(hw.deadline)) return 'overdue';
      return 'pending';
    }
    if ([
      'Worse',
      'Bad',
      'Good',
      'Better',
      'Perfect'
    ].includes(hw.submission?.status)) return 'graded';
    return 'submitted';
  };

  const filteredHomeworks = homeworks.filter(hw => {
    const status = getHomeworkStatus(hw);
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return status === 'pending';
    if (activeFilter === 'submitted') return status === 'submitted';
    if (activeFilter === 'graded') return status === 'graded';
    if (activeFilter === 'overdue') return !hw.submitted && isOverdue(hw.deadline);
    return true;
  });

  const pendingCount = homeworks.filter(hw => getHomeworkStatus(hw) === 'pending').length;
  const overdueCount = homeworks.filter(hw => getHomeworkStatus(hw) === 'overdue').length;
  const submittedCount = homeworks.filter(hw => getHomeworkStatus(hw) === 'submitted').length;
  const gradedCount = homeworks.filter(hw => getHomeworkStatus(hw) === 'graded').length;

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error}</p>
        <button
          onClick={fetchMyHomeworks}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
              <div className='flex'>
                <span className="text-lg font-bold">{user.fullName || 'Student'}</span>
                {/* <motion.img
                  src={archaIcon}
                  alt="archa"
                  width={20}
                  height={20}
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 8, -8, 6, -6, 0] }}
                  transition={{
                    duration: 0.6,      // qimirlash vaqti (qisqa)
                    repeat: Infinity,
                    repeatDelay: 2,     // har 2 sekundda bir
                    ease: "easeInOut",
                  }}
                  style={{
                    objectFit: "contain",
                    marginLeft: "3px",
                    filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.18))",
                    transformOrigin: "center bottom", // qo‘ng‘iroq effekti uchun MUHIM
                  }}
                /> */}
              </div>
              {groupName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-xs">groups</span>
                  <span className="text-xs font-medium text-primary">{groupName}</span>
                </div>
              )}
            </div>
          </div>
          <button
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-slate-500">notifications</span>
          </button>
        </div>

        <h1 className="text-[28px] font-bold tracking-tight mb-4">My Homeworks</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-800">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-orange-500 text-lg">pending_actions</span>
              <span className="text-xs text-orange-600 font-medium">Pending</span>
            </div>
            <span className="text-xl font-bold text-orange-600">{pendingCount}</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-blue-500 text-lg">schedule_send</span>
              <span className="text-xs text-blue-600 font-medium">Submitted</span>
            </div>
            <span className="text-xl font-bold text-blue-600">{submittedCount}</span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-green-500 text-lg">task_alt</span>
              <span className="text-xs text-green-600 font-medium">Graded</span>
            </div>
            <span className="text-xl font-bold text-green-600">{gradedCount}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'submitted', label: 'Submitted' },
            { key: 'graded', label: 'Graded' },
            { key: 'overdue', label: 'Overdue' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`h-9 px-5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeFilter === filter.key
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Homework List */}
      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        {filteredHomeworks.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment</span>
            <p className="text-slate-500">No homework found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHomeworks.map((homework) => {
              const overdue = !homework.submitted && isOverdue(homework.deadline);
              const totalImages = homework.assignments.reduce((acc, a) => acc + a.images.length, 0);
              const hwStatus = getHomeworkStatus(homework);
              const isGraded = hwStatus === 'graded';
              const statusVal = homework.submission?.status;

              // Calculate points based on status
              const getPointsForStatus = (status: string) => {
                const pointsMap: { [key: string]: number } = {
                  'Worse': 1,
                  'Bad': 2,
                  'Good': 3,
                  'Better': 4,
                  'Perfect': 5
                };
                return pointsMap[status] || 0;
              };

              const points = isGraded ? getPointsForStatus(statusVal || '') : 0;

              return (
                <div
                  key={homework._id}
                  onClick={() => navigate(`/student/homework/${homework._id}`)}
                  className={`bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border cursor-pointer active:scale-[0.99] transition-all ${isGraded
                    ? 'border-slate-200 dark:border-slate-700'
                    : hwStatus === 'submitted'
                      ? 'border-blue-200 dark:border-blue-800'
                      : overdue
                        ? 'border-red-200 dark:border-red-800'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isGraded
                      ? statusVal === 'Worse'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                        : statusVal === 'Bad'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                          : statusVal === 'Good'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            : statusVal === 'Better'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                              : statusVal === 'Perfect'
                                ? 'bg-yellow-100 dark:bg-yellow-300/30 text-yellow-700'
                                : 'bg-slate-100 text-slate-600'
                      : hwStatus === 'submitted'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        : overdue
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                          : 'bg-primary/10 text-primary'
                      }`}>
                      <span className="material-symbols-outlined">
                        {isGraded ? (
                          statusVal === 'Worse' ? 'sentiment_very_dissatisfied' :
                            statusVal === 'Bad' ? 'sentiment_dissatisfied' :
                              statusVal === 'Good' ? 'sentiment_satisfied' :
                                statusVal === 'Better' ? 'sentiment_very_satisfied' :
                                  statusVal === 'Perfect' ? 'star' :
                                    getCategoryIcon(homework.category)
                        ) : hwStatus === 'submitted' ? 'schedule_send' : getCategoryIcon(homework.category)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isGraded
                          ? statusVal === 'Worse'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                            : statusVal === 'Bad'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                              : statusVal === 'Good'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                : statusVal === 'Better'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                  : statusVal === 'Perfect'
                                    ? 'bg-yellow-100 dark:bg-yellow-300/30 text-yellow-700'
                                    : 'bg-slate-100 text-slate-600'
                          : hwStatus === 'submitted'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            : overdue
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                          }`}>
                          {isGraded ? (statusVal || 'Graded') : hwStatus === 'submitted' ? 'Submitted' : overdue ? 'Overdue' : 'Pending'}
                        </span>
                        {isGraded && points > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">star</span>
                            <span>+{points}</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          {homework.category}
                        </span>
                      </div>
                      <p className="font-semibold truncate mb-1">{homework.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          <span className={overdue && !homework.submitted ? 'text-red-500 font-medium' : ''}>
                            {formatDateTime(homework.deadline)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          <span>{homework.teacherId?.fullName || 'Teacher'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                  </div>

                  {/* Assignments Preview */}
                  {homework.assignments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap gap-2">
                        {homework.assignments.map((assignment) => (
                          <span
                            key={assignment._id}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400"
                          >
                            {assignment.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {homework.submitted && homework.submittedAt && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      Submitted on {formatDateTime(homework.submittedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHomeView;
