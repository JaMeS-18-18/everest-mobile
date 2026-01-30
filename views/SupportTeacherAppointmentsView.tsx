import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';

interface Student {
  _id: string;
  fullName: string;
  phone: string;
  groupId?: {
    name: string;
  };
}

interface Appointment {
  _id: string;
  studentId: Student;
  dayOfWeek: number;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function SupportTeacherAppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('pending');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || '';
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments/teacher-appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedAppointment || !actionType) return;

    if (actionType === 'reject' && !rejectionReason.trim()) {
      toast.warning('Please enter a rejection reason');
      return;
    }

    setSubmitting(true);
    try {
      const statusMap = {
        approve: 'approved',
        reject: 'rejected',
        complete: 'completed'
      };

      await api.put(`/appointments/${selectedAppointment._id}/status`, {
        status: statusMap[actionType],
        rejectionReason: rejectionReason.trim(),
        notes: notes.trim()
      });

      await fetchAppointments();
      closeModal();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (appointment: Appointment, action: 'approve' | 'reject' | 'complete') => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setRejectionReason('');
    setNotes('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setActionType(null);
    setRejectionReason('');
    setNotes('');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const approvedCount = appointments.filter(a => a.status === 'approved').length;

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
          <span className="text-3xl">📋</span>
          <h1 className="text-2xl font-bold">Appointments</h1>
        </div>
        <p className="text-blue-100 text-sm">
          Student appointment requests
        </p>
        
        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="bg-white/20 px-4 py-2 rounded-xl">
            <p className="text-xs text-white/70">Pending</p>
            <p className="text-xl font-bold">{pendingCount}</p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-xl">
            <p className="text-xs text-white/70">Approved</p>
            <p className="text-xl font-bold">{approvedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex mx-4 mt-4 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="p-4 space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <span className="text-6xl block mb-4">📭</span>
            <p className="text-gray-500">No appointment requests</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {appointment.studentId?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {appointment.studentId?.fullName || 'Unknown'}
                    </h3>
                    {appointment.studentId?.groupId?.name && (
                      <p className="text-xs text-gray-500">
                        {appointment.studentId.groupId.name}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(appointment.status)}
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  📅 Every {getDayLabel(appointment.dayOfWeek)}
                </p>
                <p className="text-gray-600">
                  ⏰ {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                </p>
                <p className="text-gray-700 bg-gray-50 p-2 rounded-lg">
                  📝 {appointment.reason}
                </p>
                {appointment.studentId?.phone && (
                  <p className="text-gray-600">
                    📞 {appointment.studentId.phone}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {appointment.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openActionModal(appointment, 'approve')}
                    className="flex-1 py-2 bg-green-100 text-green-600 rounded-xl font-medium hover:bg-green-200 transition-colors"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => openActionModal(appointment, 'reject')}
                    className="flex-1 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition-colors"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}

              {appointment.status === 'approved' && (
                <button
                  onClick={() => openActionModal(appointment, 'complete')}
                  className="w-full mt-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                >
                  ✓ Complete
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {actionType === 'approve' && '✅ Approve'}
                {actionType === 'reject' && '❌ Reject'}
                {actionType === 'complete' && '✓ Complete'}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedAppointment.studentId?.fullName}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., I'm not available on this day..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}

              {(actionType === 'approve' || actionType === 'complete') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional information..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting || (actionType === 'reject' && !rejectionReason.trim())}
                className={`flex-1 py-3 rounded-xl font-medium disabled:opacity-50 ${
                  actionType === 'approve' ? 'bg-green-600 text-white' :
                  actionType === 'reject' ? 'bg-red-600 text-white' :
                  'bg-blue-600 text-white'
                }`}
              >
                {submitting ? 'Loading...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
