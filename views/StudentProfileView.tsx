
import React, { useState, useEffect } from 'react';
import { View } from '../types';
import api from '../api';

interface GroupInfo {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
}

interface Student {
  _id: string;
  fullName: string;
  phone: string;
  username: string;
  groupId: GroupInfo;
}

interface Submission {
  _id: string;
  fileUrl?: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

interface Homework {
  _id: string;
  description: string;
  dueDate?: string;
  submission: Submission | null;
}

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  navigate: (view: View) => void;
}

const StudentProfileView: React.FC<StudentProfileViewProps> = ({ studentId, onBack, navigate }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'graded'>('all');

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      const response = await api.get(`/students/${studentId}`);
      const data = response.data;
      
      if (data.success) {
        setStudent(data.data.student);
        setHomeworks(data.data.homeworks || []);
      } else {
        throw new Error(data.message || 'Failed to fetch student profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student profile');
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

  const getHomeworkStatus = (homework: Homework) => {
    if (homework.submission?.grade !== undefined) return 'graded';
    if (homework.submission) return 'submitted';
    return 'pending';
  };

  const filteredHomeworks = homeworks.filter(hw => {
    const status = getHomeworkStatus(hw);
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return status === 'pending' || status === 'submitted';
    if (activeTab === 'graded') return status === 'graded';
    return true;
  });

  const stats = {
    pending: homeworks.filter(hw => !hw.submission).length,
    submitted: homeworks.filter(hw => hw.submission && hw.submission.grade === undefined).length,
    graded: homeworks.filter(hw => hw.submission?.grade !== undefined).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error || 'Student not found'}</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pb-24">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-4 pt-12 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Student Profile</h2>
        <a 
          href={`tel:${student.phone}`}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
        </a>
      </header>

      {/* Profile Info */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mb-4">
          {student.fullName.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold capitalize">{student.fullName}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{student.phone}</p>
        
        {student.groupId && (
          <div className="mt-4 bg-card-light dark:bg-card-dark rounded-xl p-4 w-full border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold capitalize">{student.groupId.name}</span>
              <span className="text-xs text-slate-500">{student.groupId.startTime} - {student.groupId.endTime}</span>
            </div>
            <div className="flex gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const isActive = student.groupId.daysOfWeek?.some(d => getDayAbbr(d) === day);
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
        )}
      </div>

      {/* Stats */}
      <div className="flex px-4 gap-3 mb-6">
        {[
          { icon: 'hourglass_top', val: stats.pending, label: 'Pending', color: 'text-orange-500' },
          { icon: 'upload_file', val: stats.submitted, label: 'Submitted', color: 'text-blue-500' },
          { icon: 'grade', val: stats.graded, label: 'Graded', color: 'text-green-500' }
        ].map((stat, i) => (
          <div key={i} className="flex-1 flex flex-col items-center bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <span className={`material-symbols-outlined ${stat.color} text-[20px] mb-1`}>{stat.icon}</span>
            <p className="text-xl font-bold leading-none">{stat.val}</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'graded', label: 'Graded' }
          ].map((tab) => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.key 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' 
                  : 'text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Homework List */}
      <div className="px-4 mb-2 flex justify-between items-end">
        <h3 className="text-base font-bold">Homeworks ({filteredHomeworks.length})</h3>
      </div>

      <div className="px-4 space-y-3 flex-1 overflow-auto">
        {filteredHomeworks.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">assignment</span>
            <p>No homeworks found</p>
          </div>
        ) : (
          filteredHomeworks.map((homework) => {
            const status = getHomeworkStatus(homework);
            const statusConfig = {
              pending: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', label: 'Pending' },
              submitted: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', label: 'Submitted' },
              graded: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', label: 'Graded' },
            }[status];

            return (
              <div 
                key={homework._id}
                className="flex flex-col gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${statusConfig.bg} ${statusConfig.text} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">assignment</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{homework.description}</p>
                      {homework.dueDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          Due: {new Date(homework.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded ${statusConfig.bg} text-[10px] font-bold ${statusConfig.text} uppercase`}>
                    {statusConfig.label}
                  </span>
                  {homework.submission?.grade !== undefined && (
                    <span className="text-lg font-bold text-green-600">
                      {homework.submission.grade}/100
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentProfileView;
