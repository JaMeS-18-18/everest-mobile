import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';

interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
}

interface DaySchedule {
  _id?: string;
  dayOfWeek: number;
  timeSlots: TimeSlot[];
  isAvailable: boolean;
  note: string;
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

export default function SupportTeacherScheduleView() {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DaySchedule | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<number | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/support-teacher-schedule/my-schedule');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaySchedule = (dayOfWeek: number): DaySchedule | undefined => {
    return schedules.find(s => s.dayOfWeek === dayOfWeek);
  };

  const openDayModal = (dayOfWeek: number) => {
    const existing = getDaySchedule(dayOfWeek);
    setEditingSchedule(existing || {
      dayOfWeek,
      timeSlots: [],
      isAvailable: true,
      note: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const addTimeSlot = () => {
    if (!editingSchedule) return;
    setEditingSchedule({
      ...editingSchedule,
      timeSlots: [...editingSchedule.timeSlots, { startTime: '09:00', endTime: '18:00' }]
    });
  };

  const removeTimeSlot = (index: number) => {
    if (!editingSchedule) return;
    const newSlots = editingSchedule.timeSlots.filter((_, i) => i !== index);
    setEditingSchedule({
      ...editingSchedule,
      timeSlots: newSlots
    });
  };

  const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    if (!editingSchedule) return;
    const newSlots = [...editingSchedule.timeSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setEditingSchedule({
      ...editingSchedule,
      timeSlots: newSlots
    });
  };

  const saveSchedule = async () => {
    if (!editingSchedule) return;

    setSaving(true);
    try {
      await api.post('/support-teacher-schedule/day', editingSchedule);
      await fetchSchedules();
      closeModal();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (dayOfWeek: number) => {
    try {
      await api.delete(`/support-teacher-schedule/day/${dayOfWeek}`);
      toast.success('Schedule deleted');
      setConfirmDeleteDay(null);
      await fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const formatTimeRange = (slots: TimeSlot[]) => {
    if (slots.length === 0) return 'No time set';
    return slots.map(s => `${s.startTime} - ${s.endTime}`).join(', ');
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📅</span>
          <h1 className="text-2xl font-bold">My Available Times</h1>
        </div>
        <p className="text-blue-100 text-sm">
          Set your availability for each day of the week
        </p>
      </div>

      {/* Info Card */}
      <div className="mx-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl">⏰</span>
          <div>
            <p className="text-blue-800 font-medium text-sm">Enter your available times</p>
            <p className="text-blue-600 text-xs mt-1">
              Add time slots for each day you're available
            </p>
          </div>
        </div>
      </div>

      {/* Days Grid */}
      <div className="p-4 space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const schedule = getDaySchedule(day.value);
          const hasSchedule = schedule && schedule.timeSlots.length > 0;

          return (
            <div
              key={day.value}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                hasSchedule ? 'border-green-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    hasSchedule 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {day.short}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{day.label}</h3>
                    {hasSchedule ? (
                      <p className="text-sm text-green-600">
                        {formatTimeRange(schedule.timeSlots)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">No time set</p>
                    )}
                    {schedule?.note && (
                      <p className="text-xs text-gray-500 mt-1">📝 {schedule.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasSchedule && (
                    <button
                      onClick={() => setConfirmDeleteDay(day.value)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xl"
                    >
                      🗑️
                    </button>
                  )}
                  <button
                    onClick={() => openDayModal(day.value)}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      hasSchedule
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    {hasSchedule ? 'Edit' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && editingSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {getDayLabel(editingSchedule.dayOfWeek)}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-700">Available this day</span>
                <button
                  onClick={() => setEditingSchedule({
                    ...editingSchedule,
                    isAvailable: !editingSchedule.isAvailable
                  })}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    editingSchedule.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                    editingSchedule.isAvailable ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {editingSchedule.isAvailable && (
                <>
                  {/* Time Slots */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">Time Slots</h3>
                      <button
                        onClick={addTimeSlot}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        ➕ Add
                      </button>
                    </div>

                    {editingSchedule.timeSlots.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <span className="text-5xl block mb-2">⏰</span>
                        <p className="text-gray-500">No time added</p>
                        <button
                          onClick={addTimeSlot}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Add first time slot
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editingSchedule.timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Start</label>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">End</label>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <button
                              onClick={() => removeTimeSlot(index)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors mt-5 text-xl"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (optional)
                    </label>
                    <textarea
                      value={editingSchedule.note}
                      onChange={(e) => setEditingSchedule({
                        ...editingSchedule,
                        note: e.target.value
                      })}
                      placeholder="e.g., Only for online sessions"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {!editingSchedule.isAvailable && (
                <div className="text-center py-8 bg-red-50 rounded-xl">
                  <span className="text-5xl block mb-2">🚫</span>
                  <p className="text-red-600 font-medium">Not available this day</p>
                  <p className="text-red-400 text-sm mt-1">No sessions can be scheduled</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={saveSchedule}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    💾 Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteDay !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <span className="text-5xl block mb-4">⚠️</span>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Schedule?</h3>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this day's schedule?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteDay(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                >
                  No
                </button>
                <button
                  onClick={() => deleteSchedule(confirmDeleteDay)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
