

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { View } from '@/types';
import Loader from '@/components/Loader';

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
  profileImage?: string;
}
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

const getProfileImageUrl = (url?: string) => {
  if (!url) return undefined;
  // Support Cloudinary direct URLs and legacy local URLs
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

interface Submission {
  _id: string;
  answers?: {
    assignmentId: string;
    assignmentName?: string;
    textContent?: string;
    files?: {
      filename: string;
      url: string;
      mimetype?: string;
    }[];
  }[];
  submittedAt?: string;
  createdAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  teacherComment?: string;
  grade?: number;
}

interface Assignment {
  _id: string;
  name: string;
  images?: { url: string; filename: string }[];
}

interface Homework {
  _id: string;
  description: string;
  deadline?: string;
  category?: string;
  assignments?: Assignment[];
  submitted?: boolean;
  submission: Submission | null;
}

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  navigate: (view: View) => void;
}

const StudentProfileView: React.FC = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'graded'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', username: '', password: '', groupId: '' });
  const [groups, setGroups] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  useEffect(() => {
    if (isEditModalOpen) {
      api.get('/groups').then(res => {
        if (res.data.success) setGroups(res.data.data);
      });
      if (student) {
        setEditForm({
          fullName: student.fullName,
          phone: student.phone,
          username: student.username,
          password: '',
          groupId: student.groupId?._id || ''
        });
      }
    }
  }, [isEditModalOpen, student]);
  const handleEditSave = async () => {
    setIsSaving(true);
    try {
      const payload: { fullName: string; phone: string; username: string; password?: string } = {
        fullName: editForm.fullName,
        phone: editForm.phone,
        username: editForm.username
      };
      if (editForm.password) payload.password = editForm.password;
      await api.put(`/students/${student?._id}`, payload);
      // Change group if needed
      if (editForm.groupId && student?.groupId?._id !== editForm.groupId) {
        await api.post(`/groups/${editForm.groupId}/students/${student?._id}`);
      }
      setIsEditModalOpen(false);
      fetchStudentProfile();
    } catch (err) {
      alert('Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  const navigate = useNavigate();
  const handleDelete = async () => {
    setIsSaving(true);
    try {
      const res = await api.delete(`/students/${student?._id}`);
      setIsDeleteConfirm(false);
      setIsEditModalOpen(false);
      if (res.data && res.data.success) {
        navigate(-1);
      } else {
        alert(res.data?.message || 'Failed to delete student');
      }
    } catch (err: any) {
      if (err?.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Failed to delete student');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'Worse' | 'Bad' | 'Good' | 'Better' | 'Perfect'>('Good');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Assignment navigation state for review modal
  const [activeAssignmentIdx, setActiveAssignmentIdx] = useState(0);

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

  const openReviewModal = (homework: Homework) => {
    setSelectedHomework(homework);
    setReviewComment(homework.submission?.teacherComment || '');
    setReviewStatus(
      (['Worse', 'Bad', 'Good', 'Better', 'Perfect'].includes(homework.submission?.status as string)
        ? (homework.submission?.status as any)
        : 'Good')
    );
    setActiveAssignmentIdx(0);
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (!selectedHomework?.submission?._id) return;
    setIsSubmittingReview(true);
    try {
      const response = await api.put(`/homework/submissions/${selectedHomework.submission._id}/review`, {
        status: reviewStatus,
        teacherComment: reviewComment
      });
      if (response.data.success) {
        setShowReviewModal(false);
        setSelectedHomework(null);
        setReviewComment('');
        fetchStudentProfile(); // Refresh data
      } else {
        alert(response.data.message || 'Failed to review submission');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to review submission');
    } finally {
      setIsSubmittingReview(false);
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
    if (!homework.submission) {
      // Overdue logic
      if (homework.deadline && new Date(homework.deadline) < new Date()) return 'overdue';
      return 'pending';
    }
    if ([
      'Worse',
      'Bad',
      'Good',
      'Better',
      'Perfect'
    ].includes(homework.submission.status)) return 'graded';
    return 'submitted'; // status is 'pending' - means submitted but not reviewed
  };

  const filteredHomeworks = homeworks.filter(hw => {
    const status = getHomeworkStatus(hw);
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return status === 'pending' || status === 'submitted';
    if (activeTab === 'graded') return status === 'graded';
    return true;
  });

  const stats = {
    pending: homeworks.filter(hw => getHomeworkStatus(hw) === 'pending').length,
    submitted: homeworks.filter(hw => getHomeworkStatus(hw) === 'submitted').length,
    graded: homeworks.filter(hw => getHomeworkStatus(hw) === 'graded').length,
    overdue: homeworks.filter(hw => getHomeworkStatus(hw) === 'overdue').length,
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error || 'Student not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }


  // Image preview modal state

  return (
    <div className="flex flex-col h-full pb-24">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-4 pt-12 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Student Profile</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsEditModalOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-primary">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <a
            href={`tel:${student.phone}`}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600"
          >
            <span className="material-symbols-outlined text-[20px]">call</span>
          </a>
        </div>
      </header>
      {/* Edit Student Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setIsDeleteConfirm(false); }} />
          <div className="relative w-full max-w-md bg-card-light dark:bg-card-dark rounded-2xl p-6 animate-slide-up">
            <button onClick={() => { setIsEditModalOpen(false); setIsDeleteConfirm(false); }} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            {!isDeleteConfirm ? (
              <>
                <h2 className="text-xl font-bold mb-6">Edit Student</h2>
                <div className="space-y-4">
                  <div>
                    {/* <label className="text-sm font-medium mb-1 block">Profile Image</label>
                    <input type="file" accept="image/*" onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('image', file);
                      try {
                        const res = await api.post('/auth/upload-profile-image', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data.success && res.data.url) {
                          setStudent(s => s ? { ...s, profileImage: res.data.url } : s);
                        }
                      } catch (err) {
                        alert('Failed to upload image');
                      }
                    }} /> */}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Full Name</label>
                    <input type="text" value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Username</label>
                    <input type="text" value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Password (leave blank to keep unchanged)</label>
                    <input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Group</label>
                    <select value={editForm.groupId} onChange={e => setEditForm(f => ({ ...f, groupId: e.target.value }))} className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <option value="">No group</option>
                      {groups.map((g: any) => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsDeleteConfirm(true)} className="flex-1 h-12 rounded-lg border border-red-500 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete</button>
                  <button onClick={handleEditSave} disabled={isSaving} className="flex-1 h-12 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-red-500 mb-4">warning</span>
                  <h2 className="text-xl font-bold mb-2">Delete Student?</h2>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">Are you sure you want to delete this student? This action cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsDeleteConfirm(false)} className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                  <button onClick={handleDelete} disabled={isSaving} className="flex-1 h-12 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">{isSaving ? 'Deleting...' : 'Delete'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile Info */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mb-4 overflow-hidden">
          {student.profileImage ? (
            <img
              src={getProfileImageUrl(student.profileImage) || student.profileImage || 'https://picsum.photos/seed/student/200/200'}
              alt={student.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            student.fullName.charAt(0).toUpperCase()
          )}
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
                  <span key={day} className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
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
            { key: 'graded', label: 'Graded' },
            { key: 'overdue', label: 'Overdue' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.key
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

      <div className="px-4 space-y-4 flex-1 overflow-auto pb-10">
        {filteredHomeworks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">assignment</span>
            <p className="text-sm font-medium">No homeworks found</p>
          </div>
        ) : (
          filteredHomeworks
            .filter((homework) => {
              const status = getHomeworkStatus(homework);
              if (activeTab === 'all') return true;
              if (activeTab === 'pending') return status === 'pending' || status === 'overdue';
              if (activeTab === 'graded') return status === 'graded' || status === 'overdue';
              if (activeTab === 'overdue') return status === 'overdue';
              return true;
            })
            .map((homework) => {

              const status = getHomeworkStatus(homework);
              const submission = homework.submission;
              const isSubmitted = !!submission;
              const submissionStatus = submission?.status || status;

              // Badge color logic (match TaskDetailView)
              let badgeClass = '';
              if (submissionStatus === 'Worse') badgeClass = 'bg-red-200 dark:bg-red-900/40 text-red-700';
              else if (submissionStatus === 'Bad') badgeClass = 'bg-orange-200 dark:bg-orange-900/40 text-orange-700';
              else if (submissionStatus === 'Good') badgeClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-600';
              else if (submissionStatus === 'Better') badgeClass = 'bg-green-200 dark:bg-green-900/40 text-green-700';
              else if (submissionStatus === 'Perfect') badgeClass = 'bg-yellow-200 dark:bg-yellow-300/40 text-yellow-800';
              else if (submissionStatus === 'overdue') badgeClass = 'bg-red-100 dark:bg-red-900/40 text-red-700';
              else if (isSubmitted) badgeClass = 'bg-slate-200 dark:bg-slate-700 text-slate-600';
              else badgeClass = 'bg-orange-100 dark:bg-orange-900/40 text-orange-500';

              // Badge label logic (match TaskDetailView)
              let badgeLabel = '';
              if (submissionStatus) badgeLabel = submissionStatus;
              else if (isSubmitted) badgeLabel = 'Under Review';
              else badgeLabel = 'Pending';

              // Card background logic (overdue = red, submitted = green, else default)
              let cardBg = '';
              if (submissionStatus === 'overdue') {
                cardBg = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
              } else if (isSubmitted) {
                cardBg = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer';
              } else {
                cardBg = 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700';
              }

              // Description fix
              const descriptionText = Array.isArray(homework.description)
                ? homework.description.join(', ')
                : typeof homework.description === 'string'
                  ? homework.description.replace(/["[\]]/g, '')
                  : '';

              return (
                <div
                  key={homework._id}
                  onClick={() => openReviewModal(homework)}
                  className={`group relative flex items-start gap-4 rounded-2xl p-4 border shadow-sm transition-all duration-300 ${cardBg} cursor-pointer`}
                >
                  {/* Icon */}
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl ${isSubmitted ? 'bg-green-100 dark:bg-green-900/40' : 'bg-primary/10 text-primary'} transition-colors`}
                  >
                    <span className={`material-symbols-outlined text-2xl ${isSubmitted ? 'text-green-600' : 'text-primary'}`}>description</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${badgeClass}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>

                    {/* Title / Description */}
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1">
                      {descriptionText}
                    </p>

                    {/* Meta */}
                    {homework.deadline && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {new Date(homework.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })},{' '}
                        {new Date(homework.deadline).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {isSubmitted && (
                    <span className="material-symbols-outlined text-green-500 text-[24px]">
                      task_alt
                    </span>
                  )}
                </div>
              );
            })
        )}
      </div>



      {/* Review Modal */}
      {showReviewModal && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-background-light dark:bg-background-dark w-full max-w-md mx-4 sm:mx-auto rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold">Review Submission</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Homework Info */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="font-semibold mb-1">{selectedHomework.description}</p>
                {selectedHomework.submission ? (
                  <p className="text-xs text-slate-500">
                    Submitted: {new Date(selectedHomework.submission.createdAt || selectedHomework.submission.submittedAt || '').toLocaleString('en-US')}
                  </p>
                ) : (
                  <p className="text-base font-bold text-red-500 text-center">No submission yet</p>
                )}
              </div>
              {/* Step-by-step assignment navigation */}
              {selectedHomework.assignments && selectedHomework.assignments.length > 0 && (
                (() => {
                  const assignment = selectedHomework.assignments[activeAssignmentIdx];
                  const answer = selectedHomework.submission?.answers?.find(a => a.assignmentId === assignment._id) || selectedHomework.submission?.answers?.[activeAssignmentIdx];
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <button
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
                          onClick={() => setActiveAssignmentIdx(i => Math.max(0, i - 1))}
                          disabled={activeAssignmentIdx === 0}
                        >
                          <span className="material-symbols-outlined text-base align-middle">chevron_left</span> Previous
                        </button>
                        <span className="text-xs font-bold text-primary">
                          Task {activeAssignmentIdx + 1} of {selectedHomework.assignments.length}
                        </span>
                        <button
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
                          onClick={() => setActiveAssignmentIdx(i => Math.min(selectedHomework.assignments.length - 1, i + 1))}
                          disabled={activeAssignmentIdx === selectedHomework.assignments.length - 1}
                        >
                          Next <span className="material-symbols-outlined text-base align-middle">chevron_right</span>
                        </button>
                      </div>
                      {/* Teacher assignment info */}
                      <div className="mb-3 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-primary">assignment</span>
                          <span className="font-semibold text-primary text-sm">Teacher's Assignment</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-200 text-sm font-medium mb-1">{assignment.name || `Task ${activeAssignmentIdx + 1}`}</div>
                        {assignment.description && (
                          <div className="text-xs text-slate-500 mb-1">{assignment.description}</div>
                        )}
                        {assignment.images && assignment.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {assignment.images.map((img, imgIdx) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => setPreviewImage(img.url)}
                                className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
                              >
                                <img
                                  src={img.url}
                                  alt={img.filename || ''}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Student answer info */}
                      <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-blue-400">person</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Student's Answer</span>
                        </div>
                        {answer ? (
                          <>
                            {answer.textContent && (
                              <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <p className="text-sm">{answer.textContent}</p>
                              </div>
                            )}
                            {answer.files && answer.files.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {answer.files.filter(f => f.mimetype?.startsWith('image/')).map((file: { path: any; }, fileIdx: any) => (
                                  <button
                                    key={fileIdx}
                                    type="button"
                                    onClick={() => setPreviewImage(file.path)}
                                    className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                                  >
                                    <img
                                      src={file.path}
                                      alt=""
                                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center text-slate-400 text-sm">No answer submitted for this task.</div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
              {/* Feedback and Status only if submission exists */}
              {selectedHomework.submission && (
                <>
                  {/* Feedback Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Feedback (optional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write feedback for the student..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                  {/* Status Selection */}
                  <div className="grid grid-cols-5 gap-2">
                    {['Worse', 'Bad', 'Good', 'Better', 'Perfect'].map((status) => {
                      let color = '';
                      let border = '';
                      switch (status) {
                        case 'Worse':
                          color = reviewStatus === status ? 'bg-red-50' : 'bg-red-25';
                          border = reviewStatus === status ? 'border-red-500' : 'border-red-200';
                          break;
                        case 'Bad':
                          color = reviewStatus === status ? 'bg-orange-50' : 'bg-orange-25';
                          border = reviewStatus === status ? 'border-orange-400' : 'border-orange-200';
                          break;
                        case 'Good':
                          color = reviewStatus === status ? 'bg-blue-50' : 'bg-blue-25';
                          border = reviewStatus === status ? 'border-blue-500' : 'border-blue-200';
                          break;
                        case 'Better':
                          color = reviewStatus === status ? 'bg-green-50' : 'bg-green-25';
                          border = reviewStatus === status ? 'border-green-500' : 'border-green-200';
                          break;
                        case 'Perfect':
                          color = reviewStatus === status ? 'bg-yellow-50' : 'bg-yellow-25';
                          border = reviewStatus === status ? 'border-yellow-400' : 'border-yellow-200';
                          break;
                      }
                      return (
                        <button
                          key={status}
                          onClick={() => setReviewStatus(status as any)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${color} ${border}`}
                        >
                          <span className={`material-symbols-outlined text-2xl text-slate-500`}>
                            {status === 'Worse' && 'sentiment_very_dissatisfied'}
                            {status === 'Bad' && 'sentiment_dissatisfied'}
                            {status === 'Good' && 'sentiment_satisfied'}
                            {status === 'Better' && 'sentiment_very_satisfied'}
                            {status === 'Perfect' && 'star'}
                          </span>
                          <span className={`text-xs font-medium text-slate-700`}>
                            {status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {/* Modal Footer: Only show if submission exists */}
            {selectedHomework.submission && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                <button
                  onClick={handleReview}
                  disabled={isSubmittingReview || !reviewStatus}
                  className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
            onClick={e => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default StudentProfileView;

