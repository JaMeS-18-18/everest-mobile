import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { useTranslation } from '../contexts/LanguageContext';

interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
}

interface Schedule {
  dayOfWeek: number;
  timeSlots: TimeSlot[];
  note?: string;
}

interface SupportTeacher {
  _id: string;
  fullName: string;
  schedules: Schedule[];
}

interface Appointment {
  _id: string;
  supportTeacherId: {
    _id: string;
    fullName: string;
  };
  date: string;
  dayOfWeek: number;
  timeSlot: TimeSlot;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  rejectionReason?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
];

// Duration options (in minutes)
const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 210, label: '3.5 hours' },
  { value: 240, label: '4 hours' },
];

const DAY_LABEL_KEYS = ['schedule_sunday', 'schedule_monday', 'schedule_tuesday', 'schedule_wednesday', 'schedule_thursday', 'schedule_friday', 'schedule_saturday'] as const;
const DAY_SHORT_KEYS = ['schedule_sun', 'schedule_mon', 'schedule_tue', 'schedule_wed', 'schedule_thu', 'schedule_fri', 'schedule_sat'] as const;

export default function StudentAppointmentView() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<'book' | 'my'>('book');
  const [supportTeachers, setSupportTeachers] = useState<SupportTeacher[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<SupportTeacher | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null);
  const [availableRanges, setAvailableRanges] = useState<TimeSlot[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [slotNote, setSlotNote] = useState('');
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [blockStatus, setBlockStatus] = useState<{ blocked: boolean; daysLeft?: number; blockedUntil?: string } | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

  useEffect(() => {
    checkBlockStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'book') {
      fetchSupportTeachers();
    } else {
      fetchMyAppointments();
    }
  }, [activeTab]);

  const checkBlockStatus = async () => {
    try {
      const response = await api.get('/appointments/check-block-status');
      setBlockStatus(response.data);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const fetchSupportTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/appointments/support-teachers');
      setSupportTeachers(response.data);
    } catch (error) {
      console.error('Error fetching support teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/appointments/my-appointments');
      setMyAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (teacherId: string, dayOfWeek: number) => {
    setLoadingSlots(true);
    try {
      const response = await api.get(`/appointments/available-slots/${teacherId}/${dayOfWeek}`);
      if (response.data.available && response.data.ranges && response.data.ranges.length > 0) {
        setAvailableRanges(response.data.ranges);
        setSlotNote(response.data.note || '');
        setBookedSlots(response.data.bookedSlots || []);
        // Generate available start times from all ranges
        generateStartTimes(response.data.ranges, response.data.bookedSlots || []);
      } else {
        setAvailableRanges([]);
        setAvailableStartTimes([]);
        setBookedSlots([]);
        setSlotNote('');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableRanges([]);
      setAvailableStartTimes([]);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate available start times (every 30 minutes) from all ranges
  const generateStartTimes = (ranges: TimeSlot[], booked: TimeSlot[]) => {
    const times: string[] = [];

    // Generate times for each range
    for (const range of ranges) {
      const [startHour, startMin] = range.startTime.split(':').map(Number);
      const [endHour, endMin] = range.endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      // Generate times every 30 minutes until end time - 30 min (minimum booking)
      const endTotalMin = endHour * 60 + endMin - 30;

      while (currentHour * 60 + currentMin <= endTotalMin) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        if (!times.includes(timeStr)) {
          times.push(timeStr);
        }

        // Increment by 30 minutes
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }
    }

    // Sort times
    times.sort();
    setAvailableStartTimes(times);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
  };

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  const getEndTime = (): string => {
    if (!selectedStartTime) return '';
    return addMinutesToTime(selectedStartTime, selectedDuration);
  };

  // Check if a time slot is available (within any range and not overlapping with booked slots)
  const isTimeSlotAvailable = (startTime: string, duration: number): boolean => {
    if (availableRanges.length === 0) return false;

    const startMin = timeToMinutes(startTime);
    const endMin = startMin + duration;

    // Check if within ANY available range
    let isWithinRange = false;
    for (const range of availableRanges) {
      const rangeStartMin = timeToMinutes(range.startTime);
      const rangeEndMin = timeToMinutes(range.endTime);

      if (startMin >= rangeStartMin && endMin <= rangeEndMin) {
        isWithinRange = true;
        break;
      }
    }

    if (!isWithinRange) return false;

    // Check if overlaps with any booked slot
    for (const booked of bookedSlots) {
      const bookedStart = timeToMinutes(booked.startTime);
      const bookedEnd = timeToMinutes(booked.endTime);

      // Check overlap
      if (startMin < bookedEnd && endMin > bookedStart) {
        return false;
      }
    }

    return true;
  };

  const isValidDuration = (duration: number): boolean => {
    if (!selectedStartTime || availableRanges.length === 0) return false;
    return isTimeSlotAvailable(selectedStartTime, duration);
  };

  const isStartTimeAvailable = (time: string): boolean => {
    // Check if at least 30 min slot is available from this time
    return isTimeSlotAvailable(time, 30);
  };

  const handleDayChange = (dayOfWeek: number) => {
    setSelectedDayOfWeek(dayOfWeek);
    setSelectedStartTime('');
    setSelectedDuration(60);
    setAvailableRanges([]);
    setAvailableStartTimes([]);
    setBookedSlots([]);
    setLoadingSlots(false);

    if (selectedTeacher) {
      // Check if the selected day is available
      const hasSchedule = selectedTeacher.schedules.some(s => s.dayOfWeek === dayOfWeek);

      if (hasSchedule) {
        fetchAvailableSlots(selectedTeacher._id, dayOfWeek);
      }
    }
  };

  const handleSelectTeacher = (teacher: SupportTeacher) => {
    setSelectedTeacher(teacher);
    setSelectedDayOfWeek(null);
    setSelectedStartTime('');
    setSelectedDuration(60);
    setAvailableRanges([]);
    setAvailableStartTimes([]);
    setBookedSlots([]);
    setShowModal(true);
  };

  // Calculate next occurrence of a day of week
  const getNextDateForDay = (dayOfWeek: number): string => {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil <= 0) daysUntil += 7; // Next week if today or past
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!selectedTeacher || selectedDayOfWeek === null || !selectedStartTime || !reason.trim()) {
      toast.warning('Please fill in all fields');
      return;
    }

    const endTime = getEndTime();
    if (!endTime) {
      toast.warning('Please select time range');
      return;
    }

    // Show warning modal first
    const nextDate = getNextDateForDay(selectedDayOfWeek);
    setPendingBookingData({
      supportTeacherId: selectedTeacher._id,
      dayOfWeek: selectedDayOfWeek,
      date: nextDate,
      timeSlot: {
        startTime: selectedStartTime,
        endTime: endTime
      },
      reason: reason.trim()
    });
    setShowWarningModal(true);
  };

  const confirmBooking = async () => {
    if (!pendingBookingData) return;

    setSubmitting(true);
    try {
      await api.post('/appointments', pendingBookingData);

      toast.success(t('appointment_toast_booked'));
      setShowModal(false);
      setShowWarningModal(false);
      setSelectedTeacher(null);
      setSelectedDayOfWeek(null);
      setSelectedStartTime('');
      setSelectedDuration(60);
      setReason('');
      setPendingBookingData(null);
      setActiveTab('my');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred');
      setShowWarningModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await api.put(`/appointments/${id}/cancel`);
      toast.success(t('appointment_toast_cancelled'));
      setConfirmCancelId(null);
      fetchMyAppointments();
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-primary/10 text-primary',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    const labelKeys: Record<string, string> = {
      pending: 'appointment_status_pending',
      approved: 'appointment_status_approved',
      rejected: 'appointment_status_rejected',
      completed: 'appointment_status_completed',
      cancelled: 'appointment_status_cancelled'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {t(labelKeys[status] || status)}
      </span>
    );
  };

  const getDayLabel = (dayOfWeek: number) => {
    return t(DAY_LABEL_KEYS[dayOfWeek as keyof typeof DAY_LABEL_KEYS] || '');
  };

  // Calculate the next occurrence of a day of week
  const getAppointmentDate = (dayOfWeek: number, createdAt?: string, status?: string): string => {
    // For completed/cancelled, show the date it was for
    const baseDate = createdAt ? new Date(createdAt) : new Date();
    const currentDay = baseDate.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + daysUntil);
    return nextDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-1">
            ←
          </button>
          <span className="text-3xl">📋</span>
          <h1 className="text-2xl font-bold">{t('appointment_title')}</h1>
        </div>
        <p className="text-white/90 text-sm">
          {t('appointment_subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 bg-white rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('book')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${activeTab === 'book'
            ? 'bg-orange-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          {t('appointment_tab_book')}
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${activeTab === 'my'
            ? 'bg-orange-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          {t('appointment_tab_my')}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'book' ? (
          <>
            {/* Block Status Warning */}
            {blockStatus?.blocked && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <h3 className="font-bold text-red-700">{t('appointment_blocked_title')}</h3>
                    <p className="text-sm text-red-600 mt-1">
                      {t('appointment_blocked_message').replace('{n}', String(blockStatus.daysLeft ?? 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {supportTeachers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <span className="text-6xl block mb-4">😔</span>
                <p className="text-gray-500">{t('appointment_no_teachers')}</p>
              </div>
            ) : blockStatus?.blocked ? (
              <div className="text-center py-12 bg-white rounded-2xl opacity-50">
                <span className="text-6xl block mb-4">📅</span>
                <p className="text-gray-500">{t('appointment_booking_disabled')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {supportTeachers.map((teacher) => (
                  <div
                    key={teacher._id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {teacher.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{teacher.fullName}</h3>
                          <p className="text-sm text-gray-500">
                            {teacher.schedules.length} {t('appointment_days_available')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectTeacher(teacher)}
                        className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl font-medium hover:bg-orange-200 transition-colors"
                      >
                        {t('appointment_btn_book')}
                      </button>
                    </div>

                    {/* Available days */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {teacher.schedules.map((schedule) => (
                        <span
                          key={schedule.dayOfWeek}
                          className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-medium"
                        >
                          {getDayLabel(schedule.dayOfWeek)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {myAppointments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <span className="text-6xl block mb-4">📭</span>
                <p className="text-gray-500">{t('appointment_no_appointments')}</p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-medium"
                >
                  {t('appointment_book_now')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {appointment.supportTeacherId?.fullName || t('appointment_unknown')}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          📅 {getAppointmentDate(appointment.dayOfWeek, appointment.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          ⏰ {appointment.timeSlot?.startTime || '--:--'} - {appointment.timeSlot?.endTime || '--:--'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          📝 {appointment.reason}
                        </p>
                        {appointment.status === 'rejected' && appointment.rejectionReason && (
                          <p className="text-sm text-red-500 mt-2">
                            ❌ {t('appointment_rejection_reason')} {appointment.rejectionReason}
                          </p>
                        )}
                      </div>
                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => setConfirmCancelId(appointment._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t('appointment_modal_title')}</h2>
                <p className="text-sm text-gray-500">{selectedTeacher.fullName}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Day of Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 {t('appointment_select_day')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isAvailable = selectedTeacher.schedules.some(
                      s => s.dayOfWeek === day.value
                    );
                    return (
                      <button
                        key={day.value}
                        onClick={() => isAvailable && handleDayChange(day.value)}
                        disabled={!isAvailable}
                        className={`py-3 px-2 rounded-xl border-2 text-sm font-medium transition-colors ${!isAvailable
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : selectedDayOfWeek === day.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 text-gray-700'
                          }`}
                      >
                        {t(DAY_SHORT_KEYS[day.value as keyof typeof DAY_SHORT_KEYS])}
                        {isAvailable && (
                          <span className="block text-xs text-green-500 mt-1">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDayOfWeek !== null && (
                <>
                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                      <p className="text-gray-500 text-sm">{t('appointment_loading_times')}</p>
                    </div>
                  ) : availableRanges.length > 0 ? (
                    <>
                      {/* Available time ranges info */}
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-green-700 font-medium mb-1">✅ {t('appointment_available_times')}</p>
                        {availableRanges.map((range, idx) => (
                          <p key={idx} className="text-sm text-green-700">
                            <strong>{range.startTime} - {range.endTime}</strong>
                          </p>
                        ))}
                        {slotNote && (
                          <p className="text-xs text-green-600 mt-1">📝 {slotNote}</p>
                        )}
                      </div>

                      {/* Start Time Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⏰ {t('appointment_start_time')}
                        </label>
                        {availableStartTimes.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {availableStartTimes.map((time) => {
                              const available = isStartTimeAvailable(time);
                              return (
                                <button
                                  key={time}
                                  onClick={() => available && setSelectedStartTime(time)}
                                  disabled={!available}
                                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${!available
                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                    : selectedStartTime === time
                                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                                      : 'border-gray-200 hover:border-orange-300'
                                    }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-gray-500 bg-gray-50 rounded-xl">
                            {t('appointment_no_time_today')}
                          </p>
                        )}
                      </div>

                      {/* Duration Selection */}
                      {selectedStartTime && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ⏱️ {t('appointment_duration')}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {DURATION_OPTIONS.map((option) => {
                              const valid = isValidDuration(option.value);
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => valid && setSelectedDuration(option.value)}
                                  disabled={!valid}
                                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${!valid
                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : selectedDuration === option.value
                                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                                      : 'border-gray-200 hover:border-orange-300'
                                    }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Selected Time Summary */}
                      {selectedStartTime && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                          <p className="text-orange-800 font-medium text-center">
                            🕐 {t('appointment_selected_time')} <strong>{selectedStartTime} - {getEndTime()}</strong>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 bg-red-50 rounded-xl">
                      <span className="text-4xl block mb-2">😔</span>
                      <p className="text-red-600">{t('appointment_no_time_today')}</p>
                      <p className="text-red-400 text-sm mt-1">{t('appointment_select_another_day')}</p>
                    </div>
                  )}
                </>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✏️ {t('appointment_reason_label')}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('appointment_reason_placeholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 text-right">{reason.length}/500</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedDayOfWeek === null || !selectedStartTime || !reason.trim()}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    ✅ {t('appointment_confirm_btn')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <span className="text-5xl block mb-4">⚠️</span>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{t('appointment_cancel_confirm_title')}</h3>
              <p className="text-gray-500 text-sm mb-6">{t('appointment_cancel_confirm_message')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCancelId(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                >
                  {t('appointment_no')}
                </button>
                <button
                  onClick={() => handleCancelAppointment(confirmCancelId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
                >
                  {t('appointment_yes_cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal - Before Booking */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <span className="text-5xl block mb-4">⚠️</span>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{t('appointment_notice_title')}</h3>
              <div className="text-left bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>{t('appointment_notice_intro')}</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span>📌</span>
                    <span>{t('appointment_notice_blocked')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📌</span>
                    <span>{t('appointment_notice_attend')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📌</span>
                    <span>{t('appointment_notice_cancel_advance')}</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    setPendingBookingData(null);
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                >
                  {t('settings_cancel')}
                </button>
                <button
                  onClick={confirmBooking}
                  disabled={submitting}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? t('appointment_booking_loading') : t('appointment_understand_book')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
