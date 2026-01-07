import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import api from '../api';
import { ToastContainer, toast } from 'react-toastify';

interface ImageFile {
  filename: string;
  url: string;
  mimetype: string;
  size: number;
}

interface Assignment {
  _id: string;
  name: string;
  images: ImageFile[];
}

interface GroupInfo {
  _id: string;
  name: string;
}

interface StudentInfo {
  _id: string;
  fullName: string;
  phone?: string;
  submitted: boolean;
  submittedAt: string | null;
  submission: any | null;
}

interface Homework {
  _id: string;
  description: string;
  deadline: string;
  category: string;
  link?: string;
  groupId: GroupInfo | null;
  studentId: string | null;
  studentIds: StudentInfo[];
  groupStudents?: StudentInfo[];
  assignmentType: 'group' | 'individual';
  assignments: Assignment[];
  status: 'new' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface Group {
  _id: string;
  name: string;
}

interface Student {
  _id: string;
  fullName: string;
  groupId: string;
}

interface EditTaskItem {
  id: string;
  title: string;
  files: File[];
  existingImages: ImageFile[];
}

interface TaskDetailViewProps {
  taskId: string;
  navigate: (view: View) => void;
  onBack: () => void;
}

const TaskDetailView: React.FC<TaskDetailViewProps> = ({ taskId, navigate, onBack }) => {
  const [homework, setHomework] = useState<Homework | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Submission review state
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'Worse' | 'Bad' | 'Good' | 'Better' | 'Perfect'>('Good');
  const [isReviewing, setIsReviewing] = useState(false);
  // Step-by-step assignment navigation in modal
  const [currentAssignmentIdx, setCurrentAssignmentIdx] = useState(0);

  // Edit form state
  const [editTasks, setEditTasks] = useState<EditTaskItem[]>([]);
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editAssignmentType, setEditAssignmentType] = useState<'group' | 'individual'>('group');
  const [editGroupId, setEditGroupId] = useState('');
  const [editStudentIds, setEditStudentIds] = useState<string[]>([]);

  useEffect(() => {
    fetchHomework();
    fetchGroups();
  }, [taskId]);

  useEffect(() => {
    if (editAssignmentType === 'individual') {
      fetchAllStudents();
    }
  }, [editAssignmentType]);

  const fetchHomework = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/homework/${taskId}`);
      const data = response.data;
      
      if (data.success) {
        setHomework(data.data);
        initEditForm(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch homework');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch homework');
    } finally {
      setIsLoading(false);
    }
  };

  const initEditForm = (hw: Homework) => {
    setEditDescription(hw.description);
    // Format deadline for datetime-local input (YYYY-MM-DDTHH:MM)
    if (hw.deadline) {
      const d = new Date(hw.deadline);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEditDeadline(formatted);
    } else {
      setEditDeadline('');
    }
    setEditLink(hw.link || '');
    setEditAssignmentType(hw.assignmentType);
    setEditGroupId(hw.groupId?._id || '');
    
    // Set student IDs from studentIds array
    if (hw.studentIds && hw.studentIds.length > 0) {
      setEditStudentIds(hw.studentIds.map(s => String(s._id)));
    } else if (hw.studentId) {
      setEditStudentIds([String(hw.studentId)]);
    } else {
      setEditStudentIds([]);
    }
    
    // Convert assignments to edit format
    const tasks: EditTaskItem[] = hw.assignments.map((a, index) => ({
      id: a._id || `task-${Date.now()}-${index}`,
      title: a.name,
      files: [],
      existingImages: a.images
    }));
    
    setEditTasks(tasks.length > 0 ? tasks : [{ id: 'task-' + Date.now(), title: '', files: [], existingImages: [] }]);
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api.get('/students');
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const openReviewModal = (student: StudentInfo) => {
    setSelectedStudent(student);
    setCurrentAssignmentIdx(0);
    if (student.submitted && student.submission) {
      setReviewFeedback(student.submission.teacherComment || '');
      setReviewStatus(student.submission.status || '');
    } else {
      setReviewFeedback('');
      setReviewStatus('Good');
    }
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedStudent?.submission?._id) return;
    
    setIsReviewing(true);
    try {
      const response = await api.put(`/homework/submissions/${selectedStudent.submission._id}/review`, {
        status: reviewStatus,
        teacherComment: reviewFeedback
      });

      if (response.data.success) {
        setShowReviewModal(false);
        fetchHomework(); // Refresh data
      } else {
        toast.error(response.data.message || 'Failed to submit review');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit review');
    } finally {
      setIsReviewing(false);
    }
  };

  // Task management functions
  const addEditTask = () => {
    const newId = Date.now().toString();
    setEditTasks([...editTasks, { id: newId, title: '', files: [], existingImages: [] }]);
  };

  const removeEditTask = (id: string) => {
    if (editTasks.length > 1) {
      setEditTasks(editTasks.filter(t => t.id !== id));
    }
  };

  const updateEditTaskTitle = (id: string, title: string) => {
    setEditTasks(editTasks.map(t => t.id === id ? { ...t, title } : t));
  };

  const addEditTaskFiles = (id: string, newFiles: FileList | null) => {
    if (!newFiles) return;
    setEditTasks(editTasks.map(t => t.id === id ? { ...t, files: [...t.files, ...Array.from(newFiles)] } : t));
  };

  const removeEditTaskFile = (taskId: string, fileIndex: number) => {
    setEditTasks(editTasks.map(t => t.id === taskId ? { ...t, files: t.files.filter((_, i) => i !== fileIndex) } : t));
  };

  const removeExistingImage = (taskId: string, imageIndex: number) => {
    setEditTasks(editTasks.map(t => t.id === taskId ? { ...t, existingImages: t.existingImages.filter((_, i) => i !== imageIndex) } : t));
  };

  const handleEdit = async () => {
    const validTasks = editTasks.filter(t => t.title.trim());
    if (validTasks.length === 0) {
      toast.error('Please add at least one task with a title');
      return;
    }

    if (editAssignmentType === 'group' && !editGroupId) {
      toast.error('Please select a group');
      return;
    }

    if (editAssignmentType === 'individual' && editStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('description', editDescription);
      formData.append('deadline', editDeadline);
      formData.append('category', 'DOCUMENT');
      formData.append('assignmentType', editAssignmentType);
      
      if (editLink) {
        formData.append('link', editLink);
      }

      if (editAssignmentType === 'group') {
        formData.append('groupId', editGroupId);
      } else {
        editStudentIds.forEach(id => {
          formData.append('studentIds[]', String(id));
        });
      }

      validTasks.forEach((task, index) => {
        formData.append(`assignments[${index}][name]`, task.title);
        // Include existing images URLs
        task.existingImages.forEach((img, imgIndex) => {
          formData.append(`assignments[${index}][existingImages][${imgIndex}]`, img.url);
        });
        // Add new files
        task.files.forEach((file) => {
          formData.append(`assignments[${index}][files]`, file);
        });
      });

      const response = await api.put(`/homework/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setHomework(response.data.data);
        setShowEditModal(false);
        fetchHomework();
      } else {
        throw new Error(response.data.message || 'Failed to update homework');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update homework');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/homework/${taskId}`);

      if (response.data.success) {
        onBack();
      } else {
        throw new Error(response.data.message || 'Failed to delete homework');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete homework');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Date and time formatting utility
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', label: 'New' };
      case 'in_progress':
        return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600', label: 'In Progress' };
      case 'completed':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600', label: 'Completed' };
      default:
        return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600', label: status };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PHOTO':
        return 'photo_library';
      case 'VIDEO':
        return 'videocam';
      case 'AUDIO':
        return 'mic';
      case 'DOCUMENT':
        return 'description';
      default:
        return 'assignment';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error || 'Homework not found'}</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(homework.status);
    // For group assignments, fallback to 'pending' if status is missing
    const displayStatus = homework.status || (homework.assignmentType === 'group' ? 'pending' : '');
    const statusConfigGroup = getStatusConfig(displayStatus);
  const totalImages = homework.assignments.reduce((acc, a) => acc + a.images.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background-light dark:bg-background-dark p-4 pt-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">Task Details</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowEditModal(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-primary"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        {/* Main Info Card */}
        <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-14 h-14 rounded-xl ${statusConfigGroup.bg} ${statusConfigGroup.text} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-[28px]">{getCategoryIcon(homework.category)}</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusConfigGroup.bg} ${statusConfigGroup.text}`}>
                  {statusConfigGroup.label}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 uppercase">
                  {homework.category}
                </span>
              </div>
              <h2 className="text-md font-bold">{homework.description}</h2>
            </div>
          </div>

          {/* Meta Info */}
          <div className="space-y-3">
            {homework.groupId && (
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[20px] text-slate-400">group</span>
                <span className="text-slate-600 dark:text-slate-400">Group:</span>
                <span className="font-medium capitalize">{homework.groupId.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-[20px] text-slate-400">event</span>
              <span className="text-slate-600 dark:text-slate-400">Deadline:</span>
              <span className="font-medium">{formatDateTime(homework.deadline)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-[20px] text-slate-400">category</span>
              <span className="text-slate-600 dark:text-slate-400">Type:</span>
              <span className="font-medium capitalize">{homework.assignmentType}</span>
            </div>
            {homework.link && (
              <a 
                href={homework.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[20px]">link</span>
                <span className="truncate">{homework.link}</span>
              </a>
            )}
          </div>
        </div>

        {/* Assigned Students Card - for individual assignments */}
        {homework.assignmentType === 'individual' && homework.studentIds && homework.studentIds.length > 0 && (
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">people</span>
                <h3 className="font-bold">Selected Students ({homework.studentIds.length})</h3>
              </div>
              <br />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600 font-medium">
                  {homework.studentIds.filter(s => s.submitted).length} completed
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-orange-500 font-medium">
                  {homework.studentIds.filter(s => !s.submitted).length} pending
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {homework.studentIds.map((student) => (
                <button 
                  key={student._id}
                  onClick={() => student.submitted && openReviewModal(student)}
                  disabled={!student.submitted}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    student.submitted 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 cursor-default'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    student.submitted 
                      ? 'bg-green-100 dark:bg-green-900/40' 
                      : 'bg-primary/10'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${
                      student.submitted ? 'text-green-600' : 'text-primary'
                    }`}>
                      {student.submitted ? 'check_circle' : 'person'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{student.fullName}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${student.submission?.status === 'Worse' ? 'bg-red-200 dark:bg-red-900/40 text-red-700'
                            : student.submission?.status === 'Bad' ? 'bg-orange-200 dark:bg-orange-900/40 text-orange-700'
                            : student.submission?.status === 'Good' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                            : student.submission?.status === 'Better' ? 'bg-green-200 dark:bg-green-900/40 text-green-700'
                            : student.submission?.status === 'Perfect' ? 'bg-yellow-200 dark:bg-yellow-300/40 text-yellow-800'
                            : student.submitted ? 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-500'}
                        `}
                      >
                        {student.submission?.status
                          ? student.submission.status
                          : student.submitted
                            ? 'Under Review'
                            : 'Pending'}
                      </span>
                    </div>
                    {student.phone && (
                      <p className="text-xs text-slate-500 mt-0.5">{student.phone}</p>
                    )}
                    {student.submitted && student.submittedAt && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Submitted: {formatDateTime(student.submittedAt)}
                      </p>
                    )}
                  </div>
                  {student.submitted && (
                    <span className="material-symbols-outlined text-green-500 text-[24px]">
                      task_alt
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Group Students Card - for group assignments */}
        {homework.assignmentType === 'group' && homework.groupStudents && homework.groupStudents.length > 0 && (
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                <h3 className="font-bold">{homework.groupId?.name} ({homework.groupStudents.length})</h3>
              </div>
            </div>
              <div className="flex items-center text-end  gap-2 mb-2 text-xs">
                <span className="text-green-600 font-medium">
                  {homework.groupStudents.filter(s => s.submitted).length} completed
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-orange-500 font-medium">
                  {homework.groupStudents.filter(s => !s.submitted).length} pending
                </span>
              </div>
            <div className="space-y-2">
              {homework.groupStudents.map((student) => (
                <button
                  key={student._id}
                  onClick={() => openReviewModal(student)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    student.submitted
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-100'
                  }`}
                  style={{ pointerEvents: 'auto', zIndex: 1 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    student.submitted
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : 'bg-primary/10'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${
                      student.submitted ? 'text-green-600' : 'text-primary'
                    }`}>
                      {student.submitted ? 'check_circle' : 'person'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{student.fullName}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${student.submission?.status === 'Worse' ? 'bg-red-200 dark:bg-red-900/40 text-red-700'
                            : student.submission?.status === 'Bad' ? 'bg-orange-200 dark:bg-orange-900/40 text-orange-700'
                            : student.submission?.status === 'Good' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                            : student.submission?.status === 'Better' ? 'bg-green-200 dark:bg-green-900/40 text-green-700'
                            : student.submission?.status === 'Perfect' ? 'bg-yellow-200 dark:bg-yellow-300/40 text-yellow-800'
                            : student.submitted ? 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-500'}`}
                      >
                        {student.submission?.status
                          ? student.submission.status
                          : student.submitted
                            ? 'Under Review'
                            : 'Pending'}
                      </span>
                    </div>
                    {student.phone && (
                      <p className="text-xs text-slate-500 mt-0.5">{student.phone}</p>
                    )}
                    {student.submitted && student.submittedAt && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Submitted: {formatDateTime(student.submittedAt)}
                      </p>
                    )}
                  </div>
                  {student.submitted && (
                    <span className="material-symbols-outlined text-green-500 text-[24px]">
                      task_alt
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Card */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-2xl font-bold text-primary">{homework.assignments.length}</span>
            <p className="text-xs text-slate-500 mt-1">Assignments</p>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-2xl font-bold text-primary">{totalImages}</span>
            <p className="text-xs text-slate-500 mt-1">Total Images</p>
          </div>
        </div>

        {/* Assignments */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Assignments</h3>
          {homework.assignments.length === 0 ? (
            <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 text-center border border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_off</span>
              <p className="text-slate-500">No assignments yet</p>
            </div>
          ) : (
            homework.assignments.map((assignment) => (
              <div 
                key={assignment._id}
                className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary">folder</span>
                  <h4 className="font-semibold">{assignment.name}</h4>
                  <span className="ml-auto px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                    {assignment.images.length} images
                  </span>
                </div>
                {assignment.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {assignment.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img.path || img.url)}
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
                      >
                        <img 
                          src={img.path || img.url}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  if (homework) initEditForm(homework);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="text-lg font-bold">Edit Homework</h2>
              <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">Tasks ({editTasks.length})</h3>
                  <button 
                    onClick={addEditTask}
                    className="flex items-center gap-1 text-primary font-semibold text-sm px-3 py-1.5 rounded-lg border border-primary hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Task
                  </button>
                </div>

                <div className="space-y-3">
                  {editTasks.map((task, index) => (
                    <div 
                      key={task.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Task {index + 1}</span>
                        {editTasks.length > 1 && (
                          <button 
                            onClick={() => removeEditTask(task.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Title *"
                        value={task.title}
                        onChange={(e) => updateEditTaskTitle(task.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent mb-2 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="file"
                        multiple
                        ref={el => fileInputRefs.current[task.id] = el}
                        onChange={(e) => {
                          addEditTaskFiles(task.id, e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <button
                        onClick={() => fileInputRefs.current[task.id]?.click()}
                        className="w-full py-3 border-2 border-dashed border-primary/30 rounded-lg text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
                      >
                        <span className="material-symbols-outlined">upload_file</span>
                        Upload Files
                      </button>
                      
                      {/* Existing images preview */}
                      {task.existingImages.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-slate-500 mb-1 block">Existing images:</span>
                          <div className="flex flex-wrap gap-2">
                            {task.existingImages.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative">
                                <img 
                                  src={img.path || img.url} 
                                  alt="" 
                                  className="w-14 h-14 rounded-lg object-cover"
                                />
                                <button
                                  onClick={() => removeExistingImage(task.id, imgIndex)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* New files preview */}
                      {task.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-xs text-slate-500 mb-1 block">New files:</span>
                          {task.files.map((file, fileIndex) => (
                            <div key={fileIndex} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="material-symbols-outlined text-sm text-primary">
                                  {file.type.startsWith('image/') ? 'image' : 'description'}
                                </span>
                                <span className="text-xs truncate">{file.name}</span>
                              </div>
                              <button
                                onClick={() => removeEditTaskFile(task.id, fileIndex)}
                                className="text-red-500 hover:text-red-600 shrink-0"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Settings */}
              <div>
                <h3 className="text-lg font-bold mb-1">Common Settings</h3>
                <p className="text-sm text-slate-500 mb-3">Applied to all tasks above</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description <span className="text-slate-400">(Optional)</span>
                    </label>
                    <textarea
                      placeholder="Add detailed instructions..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Deadline <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Link <span className="text-slate-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://"
                        value={editLink}
                        onChange={(e) => setEditLink(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <h3 className="text-lg font-bold mb-3">Recipients</h3>
                
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editAssignmentType"
                      checked={editAssignmentType === 'group'}
                      onChange={() => setEditAssignmentType('group')}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Entire Group</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editAssignmentType"
                      checked={editAssignmentType === 'individual'}
                      onChange={() => setEditAssignmentType('individual')}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Individual Students</span>
                  </label>
                </div>

                {editAssignmentType === 'group' && (
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group._id} value={group._id}>{group.name}</option>
                    ))}
                  </select>
                )}

                {editAssignmentType === 'individual' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {editStudentIds.length} student{editStudentIds.length !== 1 ? 's' : ''} selected
                      </span>
                      {editStudentIds.length > 0 && (
                        <button
                          onClick={() => setEditStudentIds([])}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                      {students.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          No students found
                        </div>
                      ) : (
                        students.map(student => (
                          <label 
                            key={student._id} 
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={editStudentIds.includes(String(student._id))}
                              onChange={(e) => {
                                const studentId = String(student._id);
                                if (e.target.checked) {
                                  setEditStudentIds([...editStudentIds, studentId]);
                                } else {
                                  setEditStudentIds(editStudentIds.filter(id => id !== studentId));
                                }
                              }}
                              className="w-5 h-5 text-primary rounded border-slate-300"
                            />
                            <span className="font-medium">{student.fullName}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  if (homework) initEditForm(homework);
                }}
                className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSaving}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-sm bg-card-light dark:bg-card-dark rounded-2xl p-6 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px] text-red-500">delete_forever</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Task?</h2>
              <p className="text-slate-500">
                This action cannot be undone. All assignments and images will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img 
            src={selectedImage}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Submission Review Modal (step-by-step, always opens) */}
      {showReviewModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-background-light dark:bg-background-dark w-full max-w-md mx-4 sm:mx-auto rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold">{selectedStudent.fullName}</h2>
                <p className="text-xs text-slate-500">
                  {selectedStudent.submittedAt ? `Submitted: ${formatDateTime(selectedStudent.submittedAt)}` : 'Not submitted yet'}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Step-by-step assignments navigation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {homework.assignments.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <button
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setCurrentAssignmentIdx(idx => Math.max(0, idx - 1))}
                    disabled={currentAssignmentIdx === 0}
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className="text-sm font-medium">
                    Task {currentAssignmentIdx + 1} / {homework.assignments.length}
                  </span>
                  <button
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setCurrentAssignmentIdx(idx => Math.min(homework.assignments.length - 1, idx + 1))}
                    disabled={currentAssignmentIdx === homework.assignments.length - 1}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}
              {/* Assignment details and answer */}
              {(() => {
                const assignment = homework.assignments[currentAssignmentIdx];
                let answer = null;
                if (selectedStudent.submission && selectedStudent.submission.answers) {
                  answer = selectedStudent.submission.answers[currentAssignmentIdx];
                }
                return (
                  <>
                    {/* Teacher assignment info */}
                    <div className="mb-3 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary">assignment</span>
                        <span className="font-semibold text-primary text-sm">Teacher's Assignment</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-200 text-sm font-medium mb-1">{assignment.name || `Task ${currentAssignmentIdx + 1}`}</div>
                      {assignment.description && (
                        <div className="text-xs text-slate-500 mb-1">{assignment.description}</div>
                      )}
                      {assignment.images && assignment.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {assignment.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImage(img.path || img.url)}
                              className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
                            >
                              <img src={img.path || img.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
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
                      {/* Text Answer */}
                      {answer && answer.textContent ? (
                        <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-sm">{answer.textContent}</p>
                        </div>
                      ) : (
                        <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 text-sm italic">
                          No answer submitted
                        </div>
                      )}
                      {/* Images */}
                      {answer && answer.files && answer.files.filter((f: any) => f.mimetype?.startsWith('image/')).length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {answer.files.filter((f: any) => f.mimetype?.startsWith('image/')).map((file: any, fileIdx: number) => (
                            <button
                              key={fileIdx}
                              onClick={() => setSelectedImage(file.path)}
                              className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700"
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
                    </div>
                  </>
                );
              })()}

              {/* Feedback Input */}
              <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <label className="block text-sm font-medium mb-2">Feedback</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Write feedback for the student..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm resize-none min-h-[80px]"
                  disabled={!selectedStudent.submitted}
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
                      onClick={() => selectedStudent.submitted && setReviewStatus(status as any)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${color} ${border} ${!selectedStudent.submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!selectedStudent.submitted}
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
            </div>

            {/* Modal Footer */}
            <div className="p-4 mb-5 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              >
                Close
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={isReviewing || !reviewStatus || !selectedStudent.submitted}
                className={`flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {isReviewing && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        aria-label="Notification"
      />
    </div>
    );
};

export default TaskDetailView;
