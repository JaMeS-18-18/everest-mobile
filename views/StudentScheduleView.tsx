import React, { useState, useEffect } from 'react';
import api from '../api';
import Loader from '@/components/Loader';

interface GroupSchedule {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  students?: Array<{
    _id: string;
    fullName: string;
    phone: string;
    username: string;
  }>;
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
  const [activeTab, setActiveTab] = useState<'odd' | 'even'>('odd');
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
    if (!isLoading) {
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentDayIndex = today === 0 ? 6 : today - 1; // Convert to our week format (0 = Monday)
      // Check if today is odd or even day
      const isOddDay = [0, 2, 4, 6].includes(currentDayIndex); // Mon, Wed, Fri, Sun
      setActiveTab(isOddDay ? 'odd' : 'even');
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
  
  // Convert time string to minutes for comparison
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Generate dynamic time slots based on groups
  const generateTimeSlots = () => {
    if (groups.length === 0) {
      return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    }
    
    const slots = new Set<string>();
    groups.forEach(group => {
      const startHour = Math.floor(timeToMinutes(group.startTime) / 60);
      slots.add(`${String(startHour).padStart(2, '0')}:00`);
    });
    
    return Array.from(slots).sort();
  };
  
  const timeSlots = generateTimeSlots();


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

  // Find student's group
  const myGroup = groups.find(group => 
    group.students?.some((student: any) => 
      student._id === user._id || student._id === user.studentId
    )
  );

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
            <h1 className="text-xl font-bold">Timetable</h1>
          </div>
          
          {/* Your Group */}
          {myGroup && (
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">My Group</div>
              <div className="text-sm font-bold text-primary">{myGroup.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Timetable */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Two Column Layout - ODD and EVEN side by side */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'odd', label: 'ODD', days: [0, 2, 4, 6] },
              { id: 'even', label: 'EVEN', days: [1, 3, 5] }
            ].map((group, groupIdx) => {
              const hasClasses = group.days.some(dayIndex => 
                groups.some(g => g.daysOfWeek.includes(fullDayNames[dayIndex]))
              );
              
              return (
                <div key={group.id} className="space-y-4">
                  {/* Column Header */}
                  <div className="bg-primary text-white rounded-xl px-4 py-3 text-center sticky top-0 z-10">
                    <h2 className="font-bold text-lg">{group.label}</h2>
                    <p className="text-xs text-white/80">{group.days.map(idx => weekDays[idx]).join(' • ')}</p>
                  </div>
                  
                  {/* Time Slots */}
                  <div className="space-y-4">
                    {timeSlots.map((time) => {
                      // Get all groups for this time across all days in this group
                      const allGroupsInSlot = group.days.flatMap(dayIndex => {
                        const dayGroups = getGroupsForSlot(dayIndex, time);
                        return dayGroups.map(g => ({
                          ...g,
                          dayIndex,
                          dayName: fullDayNames[dayIndex],
                          dayShort: weekDays[dayIndex]
                        }));
                      });
                      
                      if (allGroupsInSlot.length === 0) return null;
                      
                      return (
                        <div key={time} className="relative">
                          {/* Groups */}
                          <div className="space-y-3">
                            {allGroupsInSlot.map((group) => {
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
                              
                              // Check if current user is in this group
                              const isMyGroup = group.students?.some(
                                (student: any) => student._id === user._id || student._id === user.studentId
                              );
                              
                              return (
                                <div key={`${group._id}-${group.dayIndex}`} className="relative">
                                  {/* Time Range Label */}
                                  <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                      {group.startTime.slice(0, 5)} - {group.endTime.slice(0, 5)}
                                    </span>
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                      {group.dayShort}
                                    </span>
                                  </div>
                                  
                                  {/* Group Card */}
                                  <div
                                    className={`${getGroupColor(groupIndex)} text-white rounded-2xl p-4 shadow-lg ${
                                      isMyGroup ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isMyGroup && (
                                        <span className="material-symbols-outlined text-yellow-300 text-xl">star</span>
                                      )}
                                      <div className="flex-1">
                                        <div className="text-xs opacity-80 mb-1">Group</div>
                                        <h4 className="font-bold text-lg">{group.name}</h4>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Lunch Break */}
                          {time === '12:00' && allGroupsInSlot.length === 0 && (
                            <div className="text-center py-4 my-2 border-y border-slate-200 dark:border-slate-700">
                              <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Lunch Break</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentScheduleView;
