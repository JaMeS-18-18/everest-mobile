import React, { useState, useEffect } from 'react';
import api from '../api';
import Loader from '@/components/Loader';
import StudentProgressCircle from '@/components/StudentProgressCircle';
import { useTranslation } from '../contexts/LanguageContext';

interface RankingStudent {
  _id: string;
  fullName: string;
  profileImage?: string;
  points: number;
  rank: number;
  isCurrentUser?: boolean;
}

interface RankingData {
  currentStudent: {
    rank: number;
    points: number;
    percentage: number;
    totalStudents: number;
    groupName: string;
  };
  topStudents: RankingStudent[];
  monthlyReward?: {
    name: string;
    description: string;
    image: string;
    deadline?: string;
  } | null;
}

const StudentRankingView: React.FC = () => {
  const t = useTranslation();
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

  // Get the period date range label
  const getPeriodLabel = () => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (timePeriod === 'monthly') {
      // Show current month and year (e.g., "February 2025")
      return `${months[now.getMonth()]} ${now.getFullYear()}`;
    } else if (timePeriod === 'weekly') {
      // Get Monday of current week
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const formatDate = (d: Date) => `${months[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
      return `${formatDate(monday)} - ${formatDate(sunday)}`;
    } else {
      // Yearly - show the year
      return `${now.getFullYear()}`;
    }
  };
  
  const getProfileImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchRankingData();
  }, [timePeriod]);

  const fetchRankingData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/students/ranking?period=${timePeriod}`);
      const data = response.data;

      if (data.success) {
        if (data.noGroup) {
          setError(data.message || t('ranking_no_group'));
        } else if (data.noRanking) {
          setError(data.message || t('ranking_frozen'));
        } else {
          setRankingData(data.data);
          setError(null);
        }
      } else {
        throw new Error(data.message || t('ranking_error_fetch'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ranking_error_fetch'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const getEmojiForRank = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🎯';
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return t('ranking_ended');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-orange-500 mb-2">groups</span>
        <p className="text-orange-500 text-center font-semibold mb-2">{error}</p>
        <p className="text-slate-500 text-sm text-center mb-4">{t('ranking_contact_teacher')}</p>
        <button
          onClick={fetchRankingData}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          {t('ranking_retry')}
        </button>
      </div>
    );
  }

  if (!rankingData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">leaderboard</span>
        <p className="text-slate-500">{t('ranking_no_data')}</p>
      </div>
    );
  }

  const { currentStudent, topStudents } = rankingData;
  const topPercentage = Math.round((currentStudent.rank / currentStudent.totalStudents) * 100);

  // Calculate status from percentage
  const getStatusFromPercent = (percent: number): 'ranking_status_worse' | 'ranking_status_bad' | 'ranking_status_good' | 'ranking_status_better' | 'ranking_status_perfect' => {
    if (percent >= 90) return 'ranking_status_perfect';
    if (percent >= 70) return 'ranking_status_better';
    if (percent >= 50) return 'ranking_status_good';
    if (percent >= 30) return 'ranking_status_bad';
    return 'ranking_status_worse';
  };

  const currentStatusKey = getStatusFromPercent(currentStudent.percentage);
  const currentStatusLabel = t(currentStatusKey);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      {/* <div className="p-4 pt-12 bg-white dark:bg-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {user?.profileImage ? (
              <img
                src={getProfileImageUrl(user.profileImage)}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">{currentStudent.groupName}</div>
            <div className="text-base font-bold">{user.fullName}</div>
          </div>
        </div>
      </div> */}

      {/* Standing Section */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="bg-white dark:bg-card-dark p-6">
          {/* Time Period Filter */}
          <div className="flex gap-2 justify-center mb-6">
            {[
              { key: 'weekly', labelKey: 'ranking_weekly' },
              { key: 'monthly', labelKey: 'ranking_monthly' },
              { key: 'yearly', labelKey: 'ranking_yearly' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setTimePeriod(period.key as 'weekly' | 'monthly' | 'yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  timePeriod === period.key
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-200 dark:bg-card-dark/80 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t(period.labelKey)}
              </button>
            ))}
          </div>

          {/* Period Date Label */}
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-card-dark/80 rounded-full text-sm text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-base">calendar_month</span>
              {getPeriodLabel()}
            </span>
          </div>

          <div className="text-center mb-2">
            <h1 className="text-4xl font-black mb-1">
              {currentStudent.rank}
              <span className="text-2xl align-super">{getRankSuffix(currentStudent.rank)}</span> {t('ranking_place')}
            </h1>
            <p className="text-slate-500 font-medium">{t('ranking_top_percent').replace('{percent}', String(topPercentage))}</p>
          </div>

          {/* Progress Circle */}
          <div className="flex justify-center my-8">
            <StudentProgressCircle 
              percent={currentStudent.percentage}
              label={currentStatusLabel}
              delta={0}
              status={currentStatusLabel}
            />
          </div>

          {/* Monthly Reward Banner for Rank 1 */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-card-dark/80 rounded-full">
              <span className="text-2xl">{getEmojiForRank(currentStudent.rank)}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {currentStudent.points} {t('ranking_points')}
              </span>
            </div>
          </div>
        </div>

        {/* Top Students Section */}
        <div className="p-4 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('ranking_top_students')}</h2>
            <div className="text-sm font-semibold text-slate-500">{currentStudent.groupName}</div>
          </div>

          <div className="space-y-2">
            {topStudents.map((student) => (
              <div
                key={student._id}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  student.rank === 1
                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-2 border-yellow-300 dark:border-yellow-600'
                    : student.rank === 2
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-600'
                    : student.rank === 3
                    ? 'bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 border-2 border-orange-300 dark:border-orange-600'
                    : student.isCurrentUser
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark'
                }`}
              >
                <div className={`text-2xl font-bold w-8 ${
                  student.rank === 1 ? 'text-yellow-500' :
                  student.rank === 2 ? 'text-slate-400' :
                  student.rank === 3 ? 'text-orange-600' :
                  'text-slate-400'
                }`}>
                  {student.rank}
                </div>

                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-card-dark/80 flex items-center justify-center overflow-hidden">
                  {student.profileImage ? (
                    <img
                      src={getProfileImageUrl(student.profileImage)}
                      alt={student.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-semibold">
                    {student.fullName}
                    {student.isCurrentUser && (
                      <span className="text-xs text-primary ml-1">{t('ranking_you')}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">{student.points} {t('ranking_points')}</div>
                </div>

                <div className="text-2xl">
                  {getEmojiForRank(student.rank)}
                </div>

                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Gift Button - Only show if monthly reward exists and period is monthly */}
      {timePeriod === 'monthly' && rankingData.monthlyReward && rankingData.monthlyReward.name && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-end px-6 max-w-md mx-auto pointer-events-none">
          <button
            onClick={() => setIsRewardModalOpen(true)}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center group pointer-events-auto"
          >
            {/* Animated pulse ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 opacity-75 animate-ping" style={{ animationDuration: '2s' }}></div>
            
            {/* Button content */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[32px] drop-shadow-lg">card_giftcard</span>
            </div>
            
            {/* Sparkle effect */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-yellow-500 text-xs">✨</span>
            </div>
          </button>
        </div>
      )}

      {/* Reward Modal */}
      {isRewardModalOpen && rankingData.monthlyReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsRewardModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-card-dark rounded-2xl p-6 animate-slide-up">
            <button 
              onClick={() => setIsRewardModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[32px]">emoji_events</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{t('ranking_monthly_reward')}</h2>
              <p className="text-sm text-slate-500">{t('ranking_win_prize')}</p>
              
              {rankingData.monthlyReward.deadline && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[18px]">schedule</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {getTimeRemaining(rankingData.monthlyReward.deadline)} {t('ranking_remaining')}
                  </span>
                </div>
              )}
            </div>

            {rankingData.monthlyReward.image && (
              <div className="mb-4">
                <img 
                  src={rankingData.monthlyReward.image} 
                  alt={rankingData.monthlyReward.name}
                  onClick={() => setIsImageModalOpen(true)}
                  className="w-full h-40 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <p className="text-xs text-center text-slate-500 mt-2">{t('ranking_click_full')}</p>
              </div>
            )}

            <h3 className="text-xl font-bold mb-2">{rankingData.monthlyReward.name}</h3>
            {rankingData.monthlyReward.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {rankingData.monthlyReward.description}
              </p>
            )}

            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200 text-center">
                🏆 {t('ranking_finish_top')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Full Screen Modal */}
      {isImageModalOpen && rankingData.monthlyReward?.image && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90" onClick={() => setIsImageModalOpen(false)}>
          <button 
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <img 
            src={rankingData.monthlyReward.image} 
            alt={rankingData.monthlyReward.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default StudentRankingView;
