
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
  profileImage?: string;
}
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

const getProfileImageUrl = (url?: string) => {
  if (!url) return undefined;
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

const StudentProfileView: React.FC<StudentProfileViewProps> = ({ studentId, onBack, navigate }) => {
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

    const handleDelete = async () => {
      setIsSaving(true);
      try {
        await api.delete(`/students/${student?._id}`);
        setIsDeleteConfirm(false);
        setIsEditModalOpen(false);
        onBack();
      } catch (err) {
        alert('Failed to delete student');
      } finally {
        setIsSaving(false);
      }
    };
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
    setShowReviewModal(true);
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedHomework?.submission?._id) return;
    
    setIsSubmittingReview(true);
    try {
      const response = await api.put(`/homework/submissions/${selectedHomework.submission._id}/review`, {
        status,
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
    if (!homework.submission) return 'pending';
    if (homework.submission.status === 'approved') return 'approved';
    if (homework.submission.status === 'rejected') return 'rejected';
    return 'submitted'; // status is 'pending' - means submitted but not reviewed
  };

  const filteredHomeworks = homeworks.filter(hw => {
    const status = getHomeworkStatus(hw);
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return status === 'pending' || status === 'submitted';
    if (activeTab === 'graded') return status === 'approved' || status === 'rejected';
    return true;
  });

  const stats = {
    pending: homeworks.filter(hw => !hw.submission).length,
    submitted: homeworks.filter(hw => hw.submission && hw.submission.status === 'pending').length,
    graded: homeworks.filter(hw => hw.submission?.status === 'approved' || hw.submission?.status === 'rejected').length,
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
              src={getProfileImageUrl(student.profileImage) || 'https://picsum.photos/seed/student/200/200'}
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

      <div className="px-4 space-y-3 flex-1 overflow-auto pb-8">
        {filteredHomeworks.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">assignment</span>
            <p>No homeworks found</p>
          </div>
        ) : (
          filteredHomeworks.map((homework) => {
            const status = getHomeworkStatus(homework);
            const statusConfig = {
              pending: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', label: 'Pending', icon: 'hourglass_top' },
              submitted: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', label: 'Submitted', icon: 'schedule_send' },
              approved: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', label: 'Approved', icon: 'check_circle' },
              rejected: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', label: 'Rejected', icon: 'cancel' },
            }[status] || { bg: 'bg-slate-50', text: 'text-slate-600', label: status, icon: 'help' };

            // Get all submitted images
            const submittedImages = homework.submission?.answers?.flatMap(a => a.files || []).filter(f => f.mimetype?.startsWith('image/')) || [];

            return (
              <div 
                key={homework._id}
                onClick={() => homework.submission && openReviewModal(homework)}
                className={`flex flex-col gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-800 ${homework.submission ? 'cursor-pointer active:scale-[0.99] transition-all' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${statusConfig.bg} ${statusConfig.text} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">{statusConfig.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{homework.description}</p>
                      {homework.deadline && (
                        <p className="text-xs text-slate-500 mt-1">
                          Deadline: {new Date(homework.deadline).toLocaleDateString('en-US')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded ${statusConfig.bg} text-[10px] font-bold ${statusConfig.text} uppercase`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Submitted Content */}
                {homework.submission && (
                  <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Submitted: {new Date(homework.submission.createdAt || homework.submission.submittedAt || '').toLocaleString('en-US')}
                    </p>
                    
                    {/* Text answers */}
                    {homework.submission.answers?.map((answer, idx) => (
                      answer.textContent && (
                        <div key={idx} className="mb-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-xs font-medium text-slate-500 mb-1">Task {idx + 1}:</p>
                          <p className="text-sm">{answer.textContent}</p>
                        </div>
                      )
                    ))}

                    {/* Submitted Images */}
                    {submittedImages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-2">{submittedImages.length} images uploaded:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {submittedImages.slice(0, 4).map((file, idx) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                              <img 
                                src={file.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {idx === 3 && submittedImages.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white font-bold">+{submittedImages.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Button for submitted but not reviewed */}
                {homework.submission && homework.submission.status === 'pending' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openReviewModal(homework); }}
                    className="mt-2 w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">rate_review</span>
                    Review
                  </button>
                )}

                {/* Teacher comment if reviewed */}
                {homework.submission?.teacherComment && (
                  <div className={`mt-2 p-3 rounded-lg ${homework.submission.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <p className="text-xs font-medium text-slate-500 mb-1">Teacher's Comment:</p>
                    <p className="text-sm">{homework.submission.teacherComment}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedHomework?.submission && (
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
                <p className="text-xs text-slate-500">
                  Submitted: {new Date(selectedHomework.submission.createdAt || selectedHomework.submission.submittedAt || '').toLocaleString('en-US')}
                </p>
              </div>

              {/* Answers */}
              {selectedHomework.submission.answers?.map((answer, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                  <p className="text-sm font-bold text-primary mb-2">
                    {answer.assignmentName || `Task ${idx + 1}`}
                  </p>
                  
                  {answer.textContent && (
                    <p className="text-sm mb-2">{answer.textContent}</p>
                  )}
                  
                  {answer.files && answer.files.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {answer.files.filter(f => f.mimetype?.startsWith('image/')).map((file, fileIdx) => (
                        <img 
                          key={fileIdx}
                          src={file.url}
                          alt=""
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write feedback for the student..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => handleReview('rejected')}
                disabled={isSubmittingReview}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">close</span>
                Reject
              </button>
              <button
                onClick={() => handleReview('approved')}
                disabled={isSubmittingReview}
                className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">check</span>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfileView;
