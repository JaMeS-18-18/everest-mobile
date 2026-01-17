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

const StudentScheduleView: React.FC = () => {
  const [groups, setGroups] = useState<GroupSchedule[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');
  
  const getProfileImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Scroll to current day
  useEffect(() => {
    if (!isLoading && scrollContainerRef.current) {
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentDayIndex = today === 0 ? 6 : today - 1; // Convert to our week format (0 = Monday)
      const cardWidth = 280 + 16; // card width + gap
      const scrollPosition = currentDayIndex * cardWidth;
      
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [isLoading]);

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

        // Fetch teacher info
        const teacherResponse = await api.get(`/users/${teacherId}`);
        if (teacherResponse.data.success) {
          setTeacher(teacherResponse.data.data);
        }

        // Fetch all groups for this teacher
        const groupsResponse = await api.get('/groups');
        console.log('Groups API response:', groupsResponse.data);
        if (groupsResponse.data.success) {
          console.log('Fetched groups count:', groupsResponse.data.count);
          console.log('Fetched groups:', groupsResponse.data.data);
          setGroups(groupsResponse.data.data);
        } else {
          console.log('Failed to fetch groups:', groupsResponse.data);
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

  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Get current time info
  const getCurrentTimeInfo = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday
    const currentDayIndex = currentDay === 0 ? 6 : currentDay - 1; // Convert to our format
    
    // Only show if within schedule hours (8:00 - 17:00)
    if (currentMinutes < 8 * 60 || currentMinutes > 17 * 60) return null;
    
    const startMinutes = 8 * 60; // 08:00
    const minutesFromStart = currentMinutes - startMinutes;
    const timeSlotHeight = 60; // Each hour slot is approximately 60px
    const position = (minutesFromStart / 60) * (timeSlotHeight + 8); // 8px is spacing
    
    return {
      position,
      currentDayIndex,
      currentTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    };
  };

  const currentTimeInfo = getCurrentTimeInfo();

  // Convert time string to minutes for comparison
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get group color based on index
  const getGroupColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-cyan-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    return colors[index % colors.length];
  };

  // Find groups for specific day and time slot
  const getGroupsForSlot = (dayIndex: number, timeSlot: string) => {
    const dayName = fullDayNames[dayIndex];
    const slotMinutes = timeToMinutes(timeSlot);
    const nextSlotMinutes = slotMinutes + 60; // Next hour
    
    return groups.filter(group => {
      if (!group.daysOfWeek.includes(dayName)) return false;
      
      const startMinutes = timeToMinutes(group.startTime);
      const endMinutes = timeToMinutes(group.endTime);
      
      // Show group if it starts or continues during this hour slot
      return startMinutes < nextSlotMinutes && endMinutes > slotMinutes;
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-orange-500 mb-2">calendar_month</span>
        <p className="text-orange-500 text-center font-semibold mb-2">{error}</p>
        <p className="text-slate-500 text-sm text-center mb-4">Please contact your teacher</p>
        <button
          onClick={fetchSchedule}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="p-4 pt-12 bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {teacher?.profileImage ? (
                <img
                  src={getProfileImageUrl(teacher.profileImage)}
                  alt={teacher.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-white">person</span>
              )}
            </div>
            <h1 className="text-xl font-bold">Teacher's Timetable</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-500">search</span>
          </button>
        </div>
        
        {/* Teacher Chip */}
        {/* <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {teacher?.profileImage ? (
                <img
                  src={getProfileImageUrl(teacher.profileImage)}
                  alt={teacher.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-white text-sm">person</span>
              )}
            </div>
            <span className="text-sm font-medium">{teacher?.fullName || 'Teacher'}</span>
          </div>
        </div> */}
      </div>

      {/* Timetable */}
      <div className="flex-1 overflow-hidden pb-24">
        {/* Horizontal Scrolling Days */}
        <div 
          ref={scrollContainerRef} 
          className="flex overflow-x-auto gap-4 px-4 py-4 snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#137FEC transparent'
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              .flex.overflow-x-auto::-webkit-scrollbar {
                height: 4px;
              }
              .flex.overflow-x-auto::-webkit-scrollbar-track {
                background: transparent;
              }
              .flex.overflow-x-auto::-webkit-scrollbar-thumb {
                background: #137FEC;
                border-radius: 10px;
              }
              .flex.overflow-x-auto::-webkit-scrollbar-thumb:hover {
                background: #0f6ad4;
              }
            `
          }} />
          {weekDays.map((day, dayIndex) => {
            const dayName = fullDayNames[dayIndex];
            const hasClasses = groups.some(group => group.daysOfWeek.includes(dayName));
            
            return (
              <div 
                key={day} 
                className={`flex-shrink-0 w-[280px] snap-start ${!hasClasses ? 'opacity-40' : ''}`}
              >
                {/* Day Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden h-full">
                  {/* Day Header */}
                  <div className="bg-primary px-4 py-3 text-center">
                    <h3 className="text-white font-bold text-sm">{day}</h3>
                    <p className="text-white/80 text-xs">{dayName}</p>
                  </div>
                  
                  {/* Time Slots Container */}
                  <div 
                    className="p-3 space-y-2 overflow-y-auto relative" 
                    style={{ 
                      maxHeight: 'calc(100vh - 280px)',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#137FEC transparent'
                    }}
                  >
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .overflow-y-auto::-webkit-scrollbar {
                          width: 4px;
                        }
                        .overflow-y-auto::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        .overflow-y-auto::-webkit-scrollbar-thumb {
                          background: #137FEC;
                          border-radius: 10px;
                        }
                        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                          background: #0f6ad4;
                        }
                      `
                    }} />
                    {/* Current Time Indicator */}
                    {currentTimeInfo && currentTimeInfo.currentDayIndex === dayIndex && (
                      <div 
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: `${currentTimeInfo.position}px` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 ml-1" />
                        <div className="h-0.5 bg-red-500 flex-1 mr-3" />
                        <span className="text-[10px] font-semibold text-red-500 bg-white dark:bg-slate-800 px-1 absolute right-0 -top-2">
                          {currentTimeInfo.currentTime}
                        </span>
                      </div>
                    )}
                    
                    {timeSlots.map((time) => {
                      const groupsInSlot = getGroupsForSlot(dayIndex, time);
                      
                      return (
                        <div key={time} className="relative min-h-[60px]">
                          {/* Time Label */}
                          <div className="text-xs text-slate-400 mb-1">{time}</div>
                          
                          {/* Groups */}
                          {groupsInSlot.map((group) => {
                            const groupIndex = groups.findIndex(g => g._id === group._id);
                            const startMinutes = timeToMinutes(group.startTime);
                            const endMinutes = timeToMinutes(group.endTime);
                            const slotMinutes = timeToMinutes(time);
                            
                            // Only show at the hour where it starts
                            const hourStart = Math.floor(startMinutes / 60) * 60;
                            if (slotMinutes !== hourStart) return null;
                            
                            const duration = endMinutes - startMinutes;
                            const hours = Math.floor(duration / 60);
                            const mins = duration % 60;
                            const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                            
                            return (
                              <div
                                key={group._id}
                                className={`${getGroupColor(groupIndex)} text-white rounded-xl p-3 shadow-md mb-2`}
                              >
                                <h4 className="font-bold text-sm mb-1">{group.name}</h4>
                                <div className="text-xs opacity-90">
                                  <div>{group.startTime.slice(0, 5)} - {group.endTime.slice(0, 5)}</div>
                                  <div>{durationText}</div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Lunch Break */}
                          {time === '12:00' && groupsInSlot.length === 0 && (
                            <div className="text-center py-2 border-t border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Lunch</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentScheduleView;
