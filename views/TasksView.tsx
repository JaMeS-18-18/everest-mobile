
import React, { useState, useEffect, useRef } from 'react';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import api from '../api';

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

interface Homework {
  _id: string;
  description: string;
  deadline: string;
  category: string;
  link?: string;
  groupId: GroupInfo | null;
  studentId: string | null;
  assignmentType: 'group' | 'individual';
  assignments: Assignment[];
  status: 'new' | 'pending' | 'reviewed';
  submissionStats?: {
    submitted: number;
    reviewed: number;
    total: number;
  };
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

interface TaskItem {
  id: string;
  title: string;
  files: File[];
  images?: ImageFile[];
}

const TasksView: React.FC = () => {
  const navigate = useNavigate();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'pending' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state for API
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Status counts from backend
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    new: 0,
    pending: 0,
    reviewed: 0,
    overdue: 0
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([{ id: 'task-1', title: '', files: [] }]);
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [link, setLink] = useState('');
  const [assignmentType, setAssignmentType] = useState<'group' | 'individual'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  // Search state for students in create and edit modals
  const [studentSearch, setStudentSearch] = useState('');
  // Separate search state for recreate (edit) modal
  const [recreateStudentSearch, setRecreateStudentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchHomeworks(1, '', 'all');
    fetchGroups();
  }, []);

  // Refetch when activeFilter changes
  useEffect(() => {
    fetchHomeworks(1, searchQuery, activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    if (assignmentType === 'individual') {
      fetchAllStudents();
    }
  }, [assignmentType]);

  const handleSearch = () => {
    fetchHomeworks(1, searchQuery, activeFilter);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchHomeworks(1, '', activeFilter);
  };

  const fetchHomeworks = async (page = 1, search = '', status: string = 'all') => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      // Send status param for filtering (except 'all' and 'overdue' which are handled client-side)
      const statusParam = (status && status !== 'all' && status !== 'overdue') ? `&status=${status}` : '';
      const response = await api.get(`/homework?page=${page}&limit=5${searchParam}${statusParam}`);
      const data = response.data;

      if (data.success) {
        if (page === 1) {
          setHomeworks(data.data);
        } else {
          setHomeworks(prev => [...prev, ...data.data]);
        }
        setTotalPages(data.pages || 1);
        setTotalCount(data.total || data.count);
        setCurrentPage(page);
        
        // Update status counts from backend
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch homeworks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch homeworks');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreHomeworks = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchHomeworks(currentPage + 1, searchQuery, activeFilter);
    }
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

  const fetchStudentsByGroup = async (groupId: string) => {
    try {
      const response = await api.get(`/students?groupId=${groupId}`);
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
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

  const addTask = () => {
    const newId = Date.now().toString();
    setTasks(prev => {
      const copy = [...prev];
      copy.unshift({ id: newId, title: '', files: [] });
      return copy;
    });
  };

  // Open edit modal for a specific task
  // Fill modal fields with old task values
  const openEditModal = (task: TaskItem) => {
    setRecreateStudentSearch(' ');
    // Simulate fetching old task data (replace with actual API call if needed)
    // Example response structure:
    // {
    //   description, deadline, link, assignmentType, groupId, studentIds, assignments
    // }
    // For demo, use task.id to find homework from homeworks list
    const oldHomework = homeworks.find(hw => hw._id === task.id);
    if (oldHomework) {
      setDescription(oldHomework.description || '');
      // Format deadline for input type="datetime-local"
      if (oldHomework.deadline) {
        const d = new Date(oldHomework.deadline);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDeadline(formatted);
      } else {
        setDeadline('');
      }
      setLink(oldHomework.link || '');
      setAssignmentType(oldHomework.assignmentType);
      setSelectedGroupId(oldHomework.groupId?._id || '');
      setSelectedStudentIds(oldHomework.studentIds ? oldHomework.studentIds.map(s => String(s._id)) : []);
      // Convert assignments to TaskItem format
      const tasksFromOld = oldHomework.assignments.map((a, idx) => ({
        id: a._id || `task-${Date.now()}-${idx}`,
        title: a.name,
        files: [],
        images: a.images || []
      }));
      setTasks(tasksFromOld.length > 0 ? tasksFromOld : [{ id: 'task-' + Date.now(), title: '', files: [], images: [] }]);
    } else {
      setDescription(task.title || '');
      setDeadline('');
      setLink('');
      setAssignmentType('group');
      setSelectedGroupId('');
      setSelectedStudentIds([]);
      setTasks([{ id: task.id, title: task.title, files: [], images: [] }]);
    }
    setEditTask(task);
    setEditModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditTask(null);
    setEditModalOpen(false);
    setRecreateStudentSearch('');
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const updateTaskTitle = (id: string, title: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, title } : t));
  };

  const addTaskFiles = (id: string, newFiles: FileList | null) => {
    if (!newFiles) return;
    const validFiles: File[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!file.type.startsWith('image/')) {
        alert('Faqat rasm fayllarini yuklash mumkin!');
        continue;
      }
      if (file.size > 4 * 1024 * 1024) {
        alert('The image size must not exceed 4MB!');
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;
    setTasks(tasks.map(t => t.id === id ? { ...t, files: [...t.files, ...validFiles] } : t));
  };

  // Remove old image from a task
  const removeTaskImage = (taskId: string, imgIndex: number) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, images: t.images?.filter((_, i) => i !== imgIndex) } : t));
  };

  const removeTaskFile = (taskId: string, fileIndex: number) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, files: t.files.filter((_, i) => i !== fileIndex) } : t));
  };

  const resetModal = () => {
    setTasks([{ id: 'task-' + Date.now(), title: '', files: [] }]);
    setDescription('');
    setDeadline('');
    setLink('');
    setAssignmentType('group');
    setSelectedGroupId('');
    setSelectedStudentIds([]);
  };

  const handleCreateHomework = async () => {
    const validTasks = tasks.filter(t => t.title.trim());
    if (validTasks.length === 0) {
      alert('Please add at least one task with a title');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (!deadline) {
      alert('Please select a deadline');
      return;
    }

    if (assignmentType === 'group' && !selectedGroupId) {
      alert('Please select a group');
      return;
    }

    if (assignmentType === 'individual' && selectedStudentIds.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('deadline', deadline);
      formData.append('category', 'DOCUMENT');
      formData.append('assignmentType', assignmentType);

      if (link) {
        formData.append('link', link);
      }

      if (assignmentType === 'group') {
        formData.append('groupId', selectedGroupId);
      } else {
        selectedStudentIds.forEach(id => {
          formData.append('studentIds[]', String(id));
        });
      }

      // Reverse tasks so backend order matches frontend visual order
      [...validTasks].reverse().forEach((task, index) => {
        formData.append(`assignments[${index}][name]`, task.title);
        task.files.forEach((file, fileIndex) => {
          formData.append(`assignments[${index}][files]`, file);
        });
      });

      const response = await api.post('/homework', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setIsModalOpen(false);
        resetModal();
        fetchHomeworks(1, searchQuery, activeFilter);
      } else {
        throw new Error(response.data.message || 'Failed to create homework');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create homework');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      case 'pending':
        return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600', label: 'Pending' };
      case 'reviewed':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600', label: 'Reviewed' };
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


  // Helper to determine if homework is overdue
  const isOverdue = (hw: Homework) => {
    const deadline = new Date(hw.deadline);
    // Only 'new' status can be overdue. 'pending' (submitted) tasks should not be marked overdue
    return hw.status === 'new' && deadline < new Date();
  };

  // Filter homeworks based on active filter, including overdue
  // For statuses filtered by backend (new, pending, reviewed), just return all
  const filteredHomeworks = homeworks.filter(hw => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'new' || activeFilter === 'pending' || activeFilter === 'reviewed') return true; // Already filtered by backend
    if (activeFilter === 'overdue') return isOverdue(hw);
    return true;
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error}</p>
        <button
          onClick={fetchHomeworks}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pt-12">
        {/* <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-primary">{user.fullName || 'Teacher'}</span>
          <button 
            onClick={() => navigate('SETTINGS')}
            className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden"
          >
            <img src="https://picsum.photos/seed/teacher/100/100" className="w-full h-full object-cover" alt="Profile" />
          </button>
        </div> */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[32px] font-bold tracking-tight">Tasks</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-blue-500 text-lg">schedule</span>
              <span className="text-xs text-blue-600 font-medium">New</span>
            </div>
            <span className="text-xl font-bold text-blue-600">{statusCounts.new}</span>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-800">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-orange-500 text-lg">pending</span>
              <span className="text-xs text-orange-600 font-medium">Pending</span>
            </div>
            <span className="text-xl font-bold text-orange-600">{statusCounts.pending}</span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
              <span className="text-xs text-green-600 font-medium">Reviewed</span>
            </div>
            <span className="text-xl font-bold text-green-600">{statusCounts.reviewed}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by group or student name..."
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="h-11 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { key: 'all', label: 'All', count: statusCounts.all },
            { key: 'new', label: 'New', count: statusCounts.new },
            { key: 'pending', label: 'Pending', count: statusCounts.pending },
            { key: 'reviewed', label: 'Reviewed', count: statusCounts.reviewed },
            { key: 'overdue', label: 'Overdue', count: statusCounts.overdue },
          ].map((filter) => {
            const isOverdueTab = filter.key === 'overdue';
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                className={`h-9 px-4 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1
                  ${isOverdueTab
                    ? activeFilter === filter.key
                      ? 'bg-red-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-red-400 text-red-600 dark:border-red-600'
                    : activeFilter === filter.key
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}
                `}
              >
                {filter.label}
                <span className={`text-xs ${isOverdueTab
                  ? activeFilter === filter.key ? 'text-white/80' : 'text-red-400'
                  : activeFilter === filter.key ? 'text-white/80' : 'text-slate-400'}`}>{filter.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {filteredHomeworks.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">assignment</span>
            <p>{activeFilter === 'all' ? 'No tasks found' : `No ${activeFilter.replace('_', ' ')} tasks`}</p>
          </div>
        ) : (
          filteredHomeworks.map((homework) => {
            // Overdue logic for display
            const overdue = isOverdue(homework);
            const statusConfig = overdue
              ? { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600', label: 'Overdue' }
              : getStatusConfig(homework.status);
            const totalImages = homework.assignments.reduce((acc, a) => acc + a.images.length, 0);

            return (
              <div
                key={homework._id}
                className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer relative"
                onClick={() => navigate(`/tasks/${homework._id}`)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl ${statusConfig.bg} ${statusConfig.text} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined">{getCategoryIcon(homework.category)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                      {homework.groupId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                          {homework.groupId.name}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold truncate">{homework.description}</p>
                    <div className="grid text-xs text-slate-500 mt-1">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Deadline: {formatDateTime(homework.deadline)}</span>
                      {homework.submissionStats && (
                        <span className="flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-sm">group</span>
                          <span className={homework.submissionStats.submitted === homework.submissionStats.total ? 'text-green-600' : 'text-orange-600'}>
                            {homework.submissionStats.submitted}/{homework.submissionStats.total}
                          </span>
                        </span>
                      )}
                      </div>
                      {/* Show assigned students if assignmentType is individual */}
                      {homework.assignmentType === 'individual' && Array.isArray(homework.studentIds) && homework.studentIds.length > 0 && (
                        <span className="flex items-center gap-1 text-blue-500 font-medium">
                          <span className="material-symbols-outlined text-sm">person</span>
                          <span>
                            {homework.studentIds.map((s: any) => s.fullName || s.username || s).join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Edit button */}
                <button
                  className="absolute top-4 right-4 px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudentSearch('');
                    openEditModal({ id: homework._id, title: homework.description, files: [] });
                  }}
                >
                  recreate
                </button>

                {/* <div className="flex flex-wrap gap-2 mb-3">
                  {homework.assignments.map((assignment) => (
                    <span 
                      key={assignment._id}
                      className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                    >
                      {assignment.name} ({assignment.images.length})
                    </span>
                  ))}
                </div>

                {totalImages > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {homework.assignments.flatMap(a => a.images).slice(0, 4).map((img, idx) => (
                      <img 
                        key={idx}
                        src={img.path || img.url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                    ))}
                    {totalImages > 4 && (
                      <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-slate-500">+{totalImages - 4}</span>
                      </div>
                    )}
                  </div>
                )}

                {homework.link && (
                  <a 
                    href={homework.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-primary text-xs font-medium mt-3 hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    View Link
                  </a>
                )} */}
              </div>
            );
          })
        )}
        
        {/* Load More Button */}
        {currentPage < totalPages && filteredHomeworks.length > 0 && (
          <div className="flex justify-center py-4">
            <button
              onClick={loadMoreHomeworks}
              disabled={isLoadingMore}
              className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Loading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">expand_more</span>
                  Load More ({homeworks.length} of {totalCount})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* FAB Button */}
      <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto pointer-events-none z-40">
        <button
          onClick={() => {
            setStudentSearch('');
            setDescription('');
            setDeadline('');
            setLink('');
            setAssignmentType('group');
            setSelectedGroupId('');
            setSelectedStudentIds([]);
            setTasks([{ id: 'task-1', title: '', files: [] }]);
            setIsModalOpen(true);
          }}
          className="absolute bottom-0 right-4 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:bg-primary/90 transition-all hover:scale-105 pointer-events-auto"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>

      {/* Create Homework Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsModalOpen(false);
              setStudentSearch('');
            }}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setStudentSearch('');
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="text-lg font-bold">Add Homework</h2>
              <button
                onClick={() => { }}
                className="text-primary font-semibold text-sm"
              >
                {/* Save Draft */}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">Tasks ({tasks.length})</h3>
                  <button
                    onClick={addTask}
                    className="flex items-center gap-1 text-primary font-semibold text-sm px-3 py-1.5 rounded-lg border border-primary hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Task
                  </button>
                </div>

                <div className="space-y-3">
                  {tasks.reverse().map((task, index) => (
                    <div
                      key={task.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Task {tasks.length - index}</span>
                        {tasks.length > 1 && (
                          <button
                            onClick={() => removeTask(task.id)}
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
                        onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent mb-2 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="file"
                        multiple
                        ref={el => fileInputRefs.current[task.id] = el}
                        onChange={(e) => {
                          addTaskFiles(task.id, e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                        accept="image/*"
                      />
                      <button
                        onClick={() => fileInputRefs.current[task.id]?.click()}
                        className="w-full py-3 border-2 border-dashed border-primary/30 rounded-lg text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
                      >
                        <span className="material-symbols-outlined">upload_file</span>
                        Upload Images
                      </button>
                      {/* Uploaded files preview */}
                      {task.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {task.files.map((file, fileIndex) => (
                            <div key={fileIndex} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="material-symbols-outlined text-sm text-primary">
                                  {file.type.startsWith('image/') ? 'image' : 'description'}
                                </span>
                                <span className="text-xs truncate">{file.name}</span>
                              </div>
                              <button
                                onClick={() => removeTaskFile(task.id, fileIndex)}
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
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Add detailed instructions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary"
                      required
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
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
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
                      name="assignmentType"
                      checked={assignmentType === 'group'}
                      onChange={() => setAssignmentType('group')}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Entire Group</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={assignmentType === 'individual'}
                      onChange={() => setAssignmentType('individual')}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Individual Students</span>
                  </label>
                </div>

                {assignmentType === 'group' && (
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group._id} value={group._id}>{group.name}</option>
                    ))}
                  </select>
                )}

                {assignmentType === 'individual' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                      </span>
                      {selectedStudentIds.length > 0 && (
                        <button
                          onClick={() => setSelectedStudentIds([])}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {/* Search input for students */}
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="w-full px-3 py-2 mb-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                      {students.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          No students found
                        </div>
                      ) : (
                        students
                          .filter(student => student.fullName.toLowerCase().includes(studentSearch.toLowerCase()))
                          .map(student => (
                            <label
                              key={student._id}
                              className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(String(student._id))}
                                onChange={(e) => {
                                  const studentId = String(student._id);
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, studentId]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
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
                  setIsModalOpen(false);
                  resetModal();
                }}
                className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHomework}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : `Create ${tasks.filter(t => t.title.trim()).length} Assignment`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Task Modal */}
      {editModalOpen && editTask && (
        <div className="fixed inset-0 z-[61] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { closeEditModal(); setRecreateStudentSearch(''); }} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <button onClick={closeEditModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="text-lg font-bold">Recreate Homework</h2>
              <div className="w-10"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">Tasks</h3>
                  <button onClick={addTask} className="flex items-center gap-1 text-primary font-semibold text-sm px-3 py-1.5 rounded-lg border border-primary hover:bg-primary/5">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Task
                  </button>
                </div>
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      {/* Recipients (edit modal) */}
                      {/* Existing images preview */}
                      {task.images && task.images.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-slate-500 mb-1 block">Existing images:</span>
                          <div className="flex flex-wrap gap-2">
                            {task.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative">
                                <img
                                  src={img.url}
                                  alt=""
                                  className="w-14 h-14 rounded-lg object-cover"
                                />
                                <button
                                  onClick={() => removeTaskImage(task.id, imgIndex)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Task {tasks.length - index}</span>
                        {tasks.length > 1 && (
                          <button onClick={() => removeTask(task.id)} className="text-slate-400 hover:text-red-500">
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Title *"
                        value={task.title}
                        onChange={e => updateTaskTitle(task.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent mb-2 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="file"
                        multiple
                        ref={el => fileInputRefs.current[task.id] = el}
                        onChange={e => {
                          addTaskFiles(task.id, e.target.files);
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
                              <button onClick={() => removeTaskFile(task.id, fileIndex)} className="text-red-500 hover:text-red-600 shrink-0">
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
                    <label className="block text-sm font-medium mb-1">Description <span className="text-red-500">*</span></label>
                    <textarea
                      placeholder="Add detailed instructions..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Deadline <span className="text-red-500">*</span></label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link <span className="text-slate-400">(Optional)</span></label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://"
                        value={link}
                        onChange={e => setLink(e.target.value)}
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
                      name="assignmentType"
                      checked={assignmentType === 'group'}
                      onChange={() => setAssignmentType('group')}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Entire Group</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={assignmentType === 'individual'}
                      onChange={() => setAssignmentType('individual')}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Individual Students</span>
                  </label>
                </div>
                {assignmentType === 'group' && (
                  <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group._id} value={group._id}>{group.name}</option>
                    ))}
                  </select>
                )}
                {assignmentType === 'individual' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">{selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected</span>
                      {selectedStudentIds.length > 0 && (
                        <button onClick={() => setSelectedStudentIds([])} className="text-xs text-red-500 hover:text-red-600">Clear all</button>
                      )}
                    </div>
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="w-full px-3 py-2 mb-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                      {students.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">No students found</div>
                      ) : (
                        students
                          .filter(student => student.fullName.toLowerCase().includes(studentSearch.toLowerCase()))
                          .map(student => (
                            <label key={student._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(String(student._id))}
                                onChange={e => {
                                  const studentId = String(student._id);
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, studentId]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
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
              <button onClick={closeEditModal} className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
              <button
                onClick={async () => {
                  // Recreate logic: send POST request with all data
                  try {
                    const validTasks = tasks.filter(t => t.title.trim());
                    if (validTasks.length === 0) {
                      alert('Please add at least one task with a title');
                      return;
                    }
                    if (!description.trim()) {
                      alert('Please enter a description');
                      return;
                    }
                    if (!deadline) {
                      alert('Please select a deadline');
                      return;
                    }
                    if (assignmentType === 'group' && !selectedGroupId) {
                      alert('Please select a group');
                      return;
                    }
                    if (assignmentType === 'individual' && selectedStudentIds.length === 0) {
                      alert('Please select at least one student');
                      return;
                    }
                    const formData = new FormData();
                    formData.append('description', description);
                    formData.append('deadline', deadline);
                    formData.append('category', 'DOCUMENT');
                    formData.append('assignmentType', assignmentType);
                    if (link) formData.append('link', link);
                    if (assignmentType === 'group') {
                      formData.append('groupId', selectedGroupId);
                    } else {
                      selectedStudentIds.forEach(id => {
                        formData.append('studentIds[]', String(id));
                      });
                    }
                    [...validTasks].reverse().forEach((task, index) => {
                      formData.append(`assignments[${index}][name]`, task.title);
                      // Add new files
                      task.files.forEach((file) => {
                        formData.append(`assignments[${index}][files]`, file);
                      });
                      // Add remaining old images (as URLs)
                      if (task.images && task.images.length > 0) {
                        task.images.forEach((img, imgIndex) => {
                          formData.append(`assignments[${index}][existingImages][${imgIndex}]`, img.url);
                        });
                      }
                    });
                    const response = await api.post('/homework', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (response.data.success) {
                      closeEditModal();
                      fetchHomeworks(1, searchQuery, activeFilter);
                    } else {
                      throw new Error(response.data.message || 'Failed to recreate homework');
                    }
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to recreate homework');
                  }
                }}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl"
              >
                Recreate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;
