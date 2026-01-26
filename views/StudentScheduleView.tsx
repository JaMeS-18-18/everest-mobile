import React, { useState, useEffect } from 'react';
import api from '../api';
import Loader from '@/components/Loader';

interface GroupSchedule {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
}

interface Teacher {
  _id: string;
  fullName: string;
  profileImage?: string;
}

interface PracticeLesson {
  _id: string;
  groupId: string;
  groupName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

const StudentScheduleView: React.FC = () => {
  const [groups, setGroups] = useState<GroupSchedule[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [practiceLessons, setPracticeLessons] = useState<PracticeLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Convert Sunday=0 to our format (Mon=0)
  });

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

  const getProfileImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/me');
      const data = response.data;

      if (data.success && data.user.studentInfo) {
        const teacherId = data.user.studentInfo.teacherId;

        if (!teacherId) {
          setError('No teacher assigned');
          return;
        }

        const [teacherResponse, groupsResponse, practiceResponse] = await Promise.all([
          api.get(`/users/${teacherId}`),
          api.get('/groups'),
          api.get('/practice-lessons/student')
        ]);
        
        if (teacherResponse.data.success) {
          setTeacher(teacherResponse.data.data);
        }
        if (groupsResponse.data.success) {
          setGroups(groupsResponse.data.data);
        }
        if (practiceResponse.data.success) {
          setPracticeLessons(practiceResponse.data.data);
        }
      } else {
        setError('You are not assigned to any teacher yet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Get current day index (Mon=0)
  const getCurrentDayIndex = () => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  };

  const isToday = (dayIndex: number) => dayIndex === getCurrentDayIndex();

  // Convert time string to minutes
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get group color based on index
  const getGroupColor = (index: number) => {
    // Faqat ko'k rang
    return { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' };
  };

  // Get classes for selected day
  const getClassesForDay = (dayIndex: number) => {
    const dayName = fullDayNames[dayIndex];
    return groups
      .filter(group => group.daysOfWeek.includes(dayName))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  // Check if a class is currently active
  const isClassActive = (group: GroupSchedule, dayIndex: number) => {
    if (!isToday(dayIndex)) return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(group.startTime);
    const endMinutes = timeToMinutes(group.endTime);
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  // Check if a class is upcoming (within next 30 mins)
  const isClassUpcoming = (group: GroupSchedule, dayIndex: number) => {
    if (!isToday(dayIndex)) return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(group.startTime);
    
    return startMinutes > currentMinutes && startMinutes - currentMinutes <= 30;
  };

   const getDateForDay = (dayIndex: number) => {
    const today = new Date();
    const currentDayIndex = getCurrentDayIndex();
    const diff = dayIndex - currentDayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate;
  };


  // Check if class has ended
  const isClassEnded = (group: GroupSchedule, dayIndex: number) => {
    if (!isToday(dayIndex)) return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = timeToMinutes(group.endTime);
    
    return currentMinutes >= endMinutes;
  };

  // Get practice lessons for selected day
  const getPracticeLessonsForDay = (dayIndex: number) => {
    const targetDate = getDateForDay(dayIndex);
    const dateStr = targetDate.toISOString().split('T')[0];
    return practiceLessons
      .filter(p => p.date === dateStr)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  // Check practice lesson status
  const isPracticeActive = (practice: PracticeLesson, dayIndex: number) => {
    if (!isToday(dayIndex)) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= timeToMinutes(practice.startTime) && currentMinutes < timeToMinutes(practice.endTime);
  };

  const isPracticeUpcoming = (practice: PracticeLesson, dayIndex: number) => {
    if (!isToday(dayIndex)) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(practice.startTime);
    return startMinutes > currentMinutes && startMinutes - currentMinutes <= 30;
  };

  const isPracticeEnded = (practice: PracticeLesson, dayIndex: number) => {
    if (!isToday(dayIndex)) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= timeToMinutes(practice.endTime);
  };

  const classesForSelectedDay = getClassesForDay(selectedDayIndex);
  const practicesForSelectedDay = getPracticeLessonsForDay(selectedDayIndex);

  // Get date for display
 
  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-5xl text-orange-500 mb-3">calendar_month</span>
        <p className="text-orange-500 text-center font-semibold mb-2">{error}</p>
        <p className="text-slate-500 text-sm text-center mb-4">Please contact your teacher</p>
        <button
          onClick={fetchSchedule}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {teacher?.profileImage ? (
              <img
                src={getProfileImageUrl(teacher.profileImage)}
                alt={teacher.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-white text-2xl">person</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">My Schedule</h1>
            <p className="text-blue-100 text-sm">
              <span className="opacity-70">Teacher:</span> {teacher?.fullName || 'Not assigned'}
            </p>
          </div>
        </div>

        {/* Week Day Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {weekDays.map((day, index) => {
            const date = getDateForDay(index);
            const regularClasses = getClassesForDay(index).length;
            const practices = getPracticeLessonsForDay(index).length;
            const hasClasses = regularClasses > 0 || practices > 0;
            const selected = selectedDayIndex === index;
            const today = isToday(index);

            return (
              <button
                key={day}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex flex-col items-center min-w-[52px] py-2 px-3 rounded-xl transition-all ${
                  selected
                    ? 'bg-white text-blue-600 shadow-lg'
                    : today
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/80'
                }`}
              >
                <span className="text-xs font-medium">{day}</span>
                <span className={`text-lg font-bold ${selected ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </span>
                {hasClasses && (
                  <div className="flex gap-0.5 mt-1">
                    {regularClasses > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-blue-500' : 'bg-white'}`} />
                    )}
                    {practices > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-orange-500' : 'bg-orange-300'}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Info */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {fullDayNames[selectedDayIndex]}
              {isToday(selectedDayIndex) && (
                <span className="ml-2 text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </h2>
            <p className="text-slate-500 text-sm">
              {getDateForDay(selectedDayIndex).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {classesForSelectedDay.length} {classesForSelectedDay.length === 1 ? 'class' : 'classes'}
              </span>
            </div>
            {practicesForSelectedDay.length > 0 && (
              <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {practicesForSelectedDay.length} practice
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="px-4 space-y-3">
        {classesForSelectedDay.length === 0 && practicesForSelectedDay.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">
              beach_access
            </span>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No Classes
            </h3>
            <p className="text-slate-500 text-sm">
              Enjoy your free day! 🎉
            </p>
          </div>
        ) : (
          <>
          {classesForSelectedDay.map((group) => {
            const groupIndex = groups.findIndex(g => g._id === group._id);
            const colors = getGroupColor(groupIndex);
            const duration = timeToMinutes(group.endTime) - timeToMinutes(group.startTime);
            const hours = Math.floor(duration / 60);
            const mins = duration % 60;
            const durationText = hours > 0 
              ? mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
              : `${mins}m`;

            const active = isClassActive(group, selectedDayIndex);
            const upcoming = isClassUpcoming(group, selectedDayIndex);
            const ended = isClassEnded(group, selectedDayIndex);

            return (
              <div
                key={group._id}
                className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 ${
                  active ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                }`}
              >
                <div className="flex">
                  {/* Left Color Bar */}
                  <div className={`w-1.5 ${colors.bg}`} />
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                            {group.name}
                          </h3>
                          {active && (
                            <span className="flex items-center gap-1 text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Now
                            </span>
                          )}
                          {upcoming && (
                            <span className="text-xs font-medium bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">
                              Soon
                            </span>
                          )}
                          {ended && (
                            <span className="text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full">
                              Done
                            </span>
                          )}
                        </div>
                        
                        {/* Time Display */}
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 ${colors.light} ${colors.text} px-3 py-1.5 rounded-lg`}>
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span className="font-semibold text-sm">
                              {group.startTime.slice(0, 5)}
                            </span>
                          </div>
                          <span className="text-slate-400">→</span>
                          <div className={`flex items-center gap-1.5 ${colors.light} ${colors.text} px-3 py-1.5 rounded-lg`}>
                            <span className="font-semibold text-sm">
                              {group.endTime.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Duration Badge */}
                      <div className="flex flex-col items-end">
                        <div className={`${colors.bg} text-white px-3 py-1 rounded-full`}>
                          <span className="text-xs font-bold">{durationText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar for active class */}
                    {active && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>In progress</span>
                          <span>
                            {(() => {
                              const now = new Date();
                              const currentMinutes = now.getHours() * 60 + now.getMinutes();
                              const endMinutes = timeToMinutes(group.endTime);
                              const remaining = endMinutes - currentMinutes;
                              return `${remaining} min left`;
                            })()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: `${(() => {
                                const now = new Date();
                                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                                const startMinutes = timeToMinutes(group.startTime);
                                const endMinutes = timeToMinutes(group.endTime);
                                const total = endMinutes - startMinutes;
                                const elapsed = currentMinutes - startMinutes;
                                return Math.min(100, Math.max(0, (elapsed / total) * 100));
                              })()}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Practice Lessons */}
          {practicesForSelectedDay.map((practice) => {
            const duration = timeToMinutes(practice.endTime) - timeToMinutes(practice.startTime);
            const hours = Math.floor(duration / 60);
            const mins = duration % 60;
            const durationText = hours > 0 
              ? mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
              : `${mins}m`;

            const active = isPracticeActive(practice, selectedDayIndex);
            const upcoming = isPracticeUpcoming(practice, selectedDayIndex);
            const ended = isPracticeEnded(practice, selectedDayIndex);

            return (
              <div
                key={practice._id}
                className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border-2 border-dashed border-orange-300 dark:border-orange-700 ${
                  active ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                }`}
              >
                <div className="flex">
                  <div className="w-1.5 bg-orange-500" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">
                            Practice
                          </span>
                          {active && (
                            <span className="flex items-center gap-1 text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Now
                            </span>
                          )}
                          {upcoming && (
                            <span className="text-xs font-medium bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                              Soon
                            </span>
                          )}
                          {ended && (
                            <span className="text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full">
                              Done
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">
                          {practice.groupName}
                        </h3>
                        {practice.description && (
                          <p className="text-slate-500 text-sm mb-2">{practice.description}</p>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span className="font-semibold text-sm">
                              {practice.startTime}
                            </span>
                          </div>
                          <span className="text-slate-400">→</span>
                          <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg">
                            <span className="font-semibold text-sm">
                              {practice.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-500 text-white px-3 py-1 rounded-full">
                        <span className="text-xs font-bold">{durationText}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </>
        )}
      </div>

      {/* All Days Overview */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Week Overview
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day, index) => {
              const classes = getClassesForDay(index);
              const practices = getPracticeLessonsForDay(index);
              const hasClasses = classes.length > 0 || practices.length > 0;
              const today = isToday(index);
              const selected = selectedDayIndex === index;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`py-2 rounded-lg transition-all ${
                    selected
                      ? 'bg-blue-500 text-white'
                      : today
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : hasClasses
                      ? 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-xs font-medium">{day.charAt(0)}</span>
                  <div className={`text-lg font-bold ${!hasClasses && !selected ? 'opacity-50' : ''}`}>
                    {classes.length + practices.length}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentScheduleView;
