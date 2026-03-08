import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '@/components/Loader';
const DEFAULT_LOGO = '/logo-bg.png';
import { useTranslation } from '@/contexts/LanguageContext';

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
  grade?: number;
  teacherComment?: string;
  submittedAt: string;
}

interface Homework {
  _id: string;
  description: string;
  deadline: string;
  category: string;
  teacherId: TeacherInfo;
  groupId: GroupInfo;
  submitted: boolean;
  submission: Submission | null;
  createdAt: string;
}

interface RankingStudent {
  _id: string;
  fullName: string;
  profileImage?: string;
}

interface RankingItem {
  student: RankingStudent;
  totalPoints: number;
  gradedCount: number;
  rank?: number;
}

interface Stats {
  totalHomeworks: number;
  pendingCount: number;    // Not submitted yet (not overdue)
  overdueCount: number;    // Not submitted and past deadline
  submittedCount: number;  // Submitted but not graded
  gradedCount: number;     // Graded (Worse/Bad/Good/Better/Perfect)
  totalPoints: number;
  completionRate: number;
}

interface StudentInfo {
  _id: string;
  fullName: string;
  profileImage?: string;
  group: GroupInfo;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

const getProfileImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const ParentChildDetailView: React.FC = () => {
  const t = useTranslation();
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'homeworks' | 'ranking'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [ranking, setRanking] = useState<{
    rankings: RankingItem[];
    childRank: number;
    childData: RankingItem | null;
    totalStudents: number;
  } | null>(null);
  const [homeworkFilter, setHomeworkFilter] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'overdue'>('all');
  const [rankingPeriod, setRankingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [rankingLoading, setRankingLoading] = useState(false);
  const [headerLogoUrl, setHeaderLogoUrl] = useState<string>(DEFAULT_LOGO);

  // Get the period date range label
  const getPeriodLabel = () => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (rankingPeriod === 'monthly') {
      return `${months[now.getMonth()]} ${now.getFullYear()}`;
    } else if (rankingPeriod === 'weekly') {
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const formatDate = (d: Date) => `${months[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
      return `${formatDate(monday)} - ${formatDate(sunday)}`;
    } else {
      return `${now.getFullYear()}`;
    }
  };

  useEffect(() => {
    if (!studentId) return;
    
    const controller = new AbortController();
    let ignore = false;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/parents/child/${studentId}/all`, {
          signal: controller.signal
        });
        
        if (!ignore && response.data.success) {
          const { student, stats, homeworks, ranking, organization } = response.data.data;
          setStudent(student);
          setStats(stats);
          setHomeworks(homeworks);
          setRanking(ranking);
          const logo = organization?.logo;
          setHeaderLogoUrl(logo ? (logo.startsWith('http') ? logo : `${API_BASE_URL}${logo}`) : DEFAULT_LOGO);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && !ignore) {
          console.error('Failed to fetch data:', err);
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
  }, [studentId]);

  // Fetch ranking when period changes
  useEffect(() => {
    if (!studentId) return;
    
    const fetchRanking = async () => {
      setRankingLoading(true);
      try {
        const response = await api.get(`/parents/child/${studentId}/ranking?period=${rankingPeriod}`);
        if (response.data.success) {
          setRanking(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch ranking:', err);
      } finally {
        setRankingLoading(false);
      }
    };
    
    fetchRanking();
  }, [studentId, rankingPeriod]);

  const gradeStatuses = ['Worse', 'Bad', 'Good', 'Better', 'Perfect'];
  
  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();
  
  // Same logic as StudentHomeView
  const getHomeworkStatus = (hw: Homework) => {
    if (!hw.submitted) {
      if (isDeadlinePassed(hw.deadline)) return 'overdue';
      return 'pending';
    }
    if (gradeStatuses.includes(hw.submission?.status || '')) return 'graded';
    return 'submitted';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return 'bg-green-100 text-green-600 dark:bg-green-900/30';
      case 'submitted': return 'bg-primary/20 text-primary dark:bg-primary/30';
      case 'pending': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30';
      case 'overdue': return 'bg-red-100 text-red-600 dark:bg-red-900/30';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700';
    }
  };

  const getStatusText = (homework: Homework) => {
    const status = getHomeworkStatus(homework);
    if (status === 'graded') return homework.submission?.status || t('parent_graded');
    if (status === 'pending') return t('student_pending');
    if (status === 'submitted') return t('student_submitted');
    if (status === 'overdue') return t('student_overdue');
    return status;
  };

  const filteredHomeworks = homeworks.filter(hw => {
    const status = getHomeworkStatus(hw);
    if (homeworkFilter === 'all') return true;
    if (homeworkFilter === 'pending') return status === 'pending';
    if (homeworkFilter === 'submitted') return status === 'submitted';
    if (homeworkFilter === 'graded') return status === 'graded';
    if (homeworkFilter === 'overdue') return status === 'overdue';
    return true;
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-4 pt-12 pb-6 rounded-b-3xl relative overflow-hidden">
        {/* Background Logo: markaz yoki Do HomeWork */}
        {headerLogoUrl && (
          <img 
            src={headerLogoUrl} 
            alt="" 
            className="absolute -top-2 -right-2 w-28 h-28 sm:w-36 sm:h-36 object-contain opacity-50 pointer-events-none"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <button onClick={() => navigate('/parent/home')} className="flex items-center gap-1 mb-4 text-white/90 relative z-10">
          <span className="material-symbols-outlined">arrow_back</span>
          {t('parent_detail_back')}
        </button>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {student?.profileImage ? (
              <img src={getProfileImageUrl(student.profileImage)} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {student?.fullName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold capitalize">{student?.fullName}</h1>
            <p className="text-white/90 text-sm">
              <span className="material-symbols-outlined text-sm align-middle mr-1">groups</span>
              {student?.group?.name || t('students_modal_no_group')}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="flex gap-4 mt-4 overflow-x-auto pb-2 relative z-10">
            <div className="bg-white/20 rounded-xl px-4 py-2 min-w-fit">
              <p className="text-2xl font-bold">{stats.totalPoints}</p>
              <p className="text-xs text-white/90">{t('parent_detail_total_points')}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 min-w-fit">
              <p className="text-2xl font-bold">#{ranking?.childRank || '-'}</p>
              <p className="text-xs text-white/90">{t('parent_detail_rank')}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 min-w-fit">
              <p className="text-2xl font-bold">{stats.completionRate}%</p>
              <p className="text-xs text-white/90">{t('parent_detail_completion')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {(['overview', 'homeworks', 'ranking'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-card-dark text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab === 'overview' ? t('parent_detail_overview') : tab === 'homeworks' ? t('parent_detail_homeworks') : t('parent_detail_ranking')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-card-dark rounded-2xl p-4 border border-slate-100 dark:border-border-dark">
              <h3 className="font-bold mb-4">{t('parent_detail_progress_overview')}</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">{t('parent_detail_homework_completion')}</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid - Same as Student View */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600">schedule</span>
                    <div>
                      <p className="text-lg font-bold text-orange-600">{stats.pendingCount}</p>
                      <p className="text-xs text-orange-600">{t('student_pending')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">upload</span>
                    <div>
                      <p className="text-lg font-bold text-primary">{stats.submittedCount}</p>
                      <p className="text-xs text-primary">{t('student_submitted')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    <div>
                      <p className="text-lg font-bold text-green-600">{stats.gradedCount}</p>
                      <p className="text-xs text-green-600">{t('parent_graded')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600">warning</span>
                    <div>
                      <p className="text-lg font-bold text-red-600">{stats.overdueCount}</p>
                      <p className="text-xs text-red-600">{t('student_overdue')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-white dark:bg-card-dark rounded-2xl p-4 border border-slate-100 dark:border-border-dark">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{t('parent_detail_total_homeworks')}</p>
                  <p className="text-2xl font-bold">{stats.totalHomeworks}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{t('parent_completed')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.submittedCount + stats.gradedCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Homeworks Tab */}
        {activeTab === 'homeworks' && (
          <div className="space-y-4">
            {/* Filter - Same as StudentHomeView */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { key: 'all', labelKey: 'parent_detail_all' },
                { key: 'pending', labelKey: 'student_pending' },
                { key: 'submitted', labelKey: 'student_submitted' },
                { key: 'graded', labelKey: 'parent_graded' },
                { key: 'overdue', labelKey: 'student_overdue' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setHomeworkFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    homeworkFilter === f.key
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-card-dark'
                  }`}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>

            {filteredHomeworks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">assignment</span>
                <p>{t('parent_detail_no_homeworks')}</p>
              </div>
            ) : (
              filteredHomeworks.map(hw => {
                const hwStatus = getHomeworkStatus(hw);
                return (
                  <div 
                    key={hw._id}
                    className="bg-white dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-border-dark"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium flex-1">{hw.description}</h4>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getStatusColor(hwStatus)}`}>
                        {getStatusText(hw)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {new Date(hw.deadline).toLocaleDateString()}
                      </span>
                      {hwStatus === 'graded' && hw.submission?.status && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <span className="material-symbols-outlined text-sm">star</span>
                          {hw.submission.status}
                        </span>
                      )}
                    </div>

                    {hw.submission?.teacherComment && (
                      <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                        <span className="text-slate-500">{t('parent_detail_teacher_comment')} </span>
                        {hw.submission.teacherComment}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="space-y-4">
            {/* Time Period Filter */}
            <div className="flex gap-2 justify-center">
              {[
                { key: 'weekly', labelKey: 'ranking_weekly' },
                { key: 'monthly', labelKey: 'ranking_monthly' },
                { key: 'yearly', labelKey: 'ranking_yearly' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setRankingPeriod(period.key as 'weekly' | 'monthly' | 'yearly')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    rankingPeriod === period.key
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t(period.labelKey)}
                </button>
              ))}
            </div>

            {/* Period Date Label */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-base">calendar_month</span>
                {getPeriodLabel()}
              </span>
            </div>

            {/* Loading State */}
            {rankingLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : ranking ? (
              <>
                {/* Child's Position */}
                {ranking.childData && (
                  <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                        #{ranking.childRank}
                      </div>
                      <div>
                    <p className="text-white/90 text-sm">{t('parent_detail_current_position')}</p>
                    <p className="text-xl font-bold">{ranking.childData.totalPoints} {t('parent_detail_points')}</p>
                    <p className="text-white/90 text-sm">{t('parent_detail_out_of_students').replace('{n}', String(ranking.totalStudents))}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top 5 */}
            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-border-dark overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-border-dark">
                <h3 className="font-bold">{t('parent_detail_top_5')}</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {ranking.rankings.slice(0, 5).map((item, index) => {
                  const isChild = item.student._id === studentId;
                  return (
                    <div 
                      key={item.student._id}
                      className={`p-4 flex items-center gap-3 ${isChild ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-slate-300 text-slate-700' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center overflow-hidden">
                        {item.student.profileImage ? (
                          <img src={getProfileImageUrl(item.student.profileImage)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold">{item.student.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate capitalize ${isChild ? 'text-primary' : ''}`}>
                          {item.student.fullName}
                          {isChild && <span className="text-xs ml-1">{t('parent_detail_your_child')}</span>}
                        </p>
                        <p className="text-xs text-slate-500">{item.gradedCount} {t('parent_detail_graded')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{item.totalPoints}</p>
                        <p className="text-xs text-slate-500">{t('parent_detail_points')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Message if child is not in top 5 */}
              {ranking.childRank > 5 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-100 dark:border-orange-800">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-orange-500">info</span>
                    <div>
                      <p className="text-orange-700 dark:text-orange-400 font-medium">
                        {t('parent_detail_ranked').replace('{n}', String(ranking.childRank))}
                      </p>
                      <p className="text-orange-600 dark:text-orange-500 text-sm mt-1">
                        {t('parent_detail_not_top_5')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentChildDetailView;
