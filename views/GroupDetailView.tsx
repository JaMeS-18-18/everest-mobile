

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '@/components/Loader';

interface Student {
  _id: string;
  fullName: string;
  phone: string;
  username: string;
  points?: number;
  percent?: number;
  rank?: number;
}

interface Group {
  _id: string;
  name: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  students: Student[];
  createdAt: string;
  updatedAt: string;
  monthlyReward?: {
    name: string;
    description: string;
    image: string;
    deadline?: string;
  };
}

const GroupDetailView: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'rank'>('rank');
  const [editForm, setEditForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [] as string[],
  });
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    image: '',
    deadline: ''
  });
  const [rewardImageFile, setRewardImageFile] = useState<File | null>(null);
  const [rewardImagePreview, setRewardImagePreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const allDaysFullName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

    // State for all students (for modal)
  const [allStudents, setAllStudents] = useState([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');

  // Fetch all students when modal opens
  useEffect(() => {
    if (isAddStudentModalOpen) {
      setIsStudentsLoading(true);
      setStudentsError('');
      api.get('/students')
        .then(res => {
          if (res.data.success) {
            setAllStudents(res.data.data);
          } else {
            setStudentsError(res.data.message || 'Failed to fetch students');
          }
        })
        .catch(() => setStudentsError('Failed to fetch students'))
        .finally(() => setIsStudentsLoading(false));
    }
  }, [isAddStudentModalOpen]);

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      const data = response.data;
      
      if (data.success) {
        // Students now come with ranking from backend
        setGroup(data.data);
        setEditForm({
          name: data.data.name,
          startTime: data.data.startTime,
          endTime: data.data.endTime,
          daysOfWeek: data.data.daysOfWeek,
        });
        setRewardForm({
          name: data.data.monthlyReward?.name || '',
          description: data.data.monthlyReward?.description || '',
          image: data.data.monthlyReward?.image || '',
          deadline: data.data.monthlyReward?.deadline || ''
        });
        setRewardImagePreview(data.data.monthlyReward?.image || '');
      } else {
        throw new Error(data.message || 'Failed to fetch group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch group');
    } finally {
      setIsLoading(false);
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

  const toggleDay = (day: string) => {
    setEditForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const handleUpdate = async () => {
    if (!group) return;
    setIsSaving(true);
    try {
      const response = await api.put(`/groups/${group._id}`, editForm);
      if (response.data.success) {
        setGroup({ ...group, ...editForm });
        setIsEditModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to update group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    setIsSaving(true);
    try {
      const response = await api.delete(`/groups/${group._id}`);
      if (response.data.success) {
        navigate(-1);
      } else {
        toast.error(response.data.message || 'Failed to delete group');
      }
    } catch (err) {
      toast.error('Failed to delete group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateReward = async () => {
    if (!group) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', rewardForm.name);
      formData.append('description', rewardForm.description);
      if (rewardForm.deadline) {
        formData.append('deadline', rewardForm.deadline);
      }
      
      if (rewardImageFile) {
        formData.append('image', rewardImageFile);
      }

      const response = await api.put(`/groups/${group._id}/reward`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setGroup({ ...group, monthlyReward: response.data.data.monthlyReward });
        setIsRewardModalOpen(false);
        setRewardImageFile(null);
        toast.success('Monthly reward updated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to update reward');
      }
    } catch (err) {
      toast.error('Failed to update reward');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = group?.students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone.includes(searchQuery)
  ) || [];

  // Sort students based on selected option
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'rank') {
      return (a.rank || 999) - (b.rank || 999);
    } else {
      return a.fullName.localeCompare(b.fullName);
    }
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error || 'Group not found'}</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsRewardModalOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Set Monthly Reward"
            >
              <span className="material-symbols-outlined">card_giftcard</span>
            </button>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        </div>
        
        <h1 className="text-[28px] font-bold tracking-tight capitalize">{group.name}</h1>
        
        <div className="flex items-center gap-4 mt-2 text-text-secondary-light dark:text-text-secondary-dark">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            <span className="text-sm">{group.startTime} - {group.endTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span className="text-sm">{group.students.length} students</span>
          </div>
        </div>

        <div className="flex gap-1 mt-3">
          {allDays.map(day => {
            const isActive = group.daysOfWeek.some(d => getDayAbbr(d) === day);
            return (
              <span key={day} className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-bold ${
                isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {day.slice(0, 2)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center bg-white dark:bg-slate-800 h-12 rounded-xl shadow-sm px-4 border border-transparent focus-within:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-text-secondary-light">search</span>
          <input 
            type="text" 
            placeholder="Search students..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-base"
          />
        </div>
      </div>

      {/* Students List + Add Student Button */}
      <div className="flex-1 px-4 pb-24">
        <div className="flex items-center justify-between mb-3 mt-4">
          <h2 className="text-lg font-semibold">Students ({sortedStudents.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'rank' ? 'name' : 'rank')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                {sortBy === 'rank' ? 'leaderboard' : 'sort_by_alpha'}
              </span>
              {sortBy === 'rank' ? 'Rank' : 'Name'}
            </button>
          </div>
        </div>
        {sortedStudents.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
            <p>No students found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedStudents.map((student) => (
              <div 
                key={student._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card-light dark:bg-card-dark border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/40 transition-all"
                onClick={() => navigate(`/students/${student._id}`)}
              >
                {sortBy === 'rank' && student.rank && (
                  <div className={`text-xl font-bold w-8 text-center ${
                    student.rank === 1 ? 'text-yellow-500' :
                    student.rank === 2 ? 'text-slate-400' :
                    student.rank === 3 ? 'text-orange-600' :
                    'text-slate-400'
                  }`}>
                    {student.rank}
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{student.fullName}</h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {student.phone}
                  </p>
                  {sortBy === 'rank' && student.points !== undefined && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-primary">{student.points} points</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs font-medium text-slate-500">{student.percent}%</span>
                    </div>
                  )}
                </div>
                <a 
                  href={`tel:${student.phone}`}
                  onClick={e => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAddStudentModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card-light dark:bg-card-dark rounded-2xl p-6 animate-slide-up">
            <button 
              onClick={() => setIsAddStudentModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h2 className="text-xl font-bold mb-6">Assign Student to Group</h2>
            {/* Student list for assignment */}
            {isStudentsLoading ? (
              <div className="flex flex-col items-center py-8">
                <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">progress_activity</span>
                <p>Loading students...</p>
              </div>
            ) : studentsError ? (
              <div className="text-center text-red-500 py-8">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p>{studentsError}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {allStudents.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary-light">
                    <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                    <p>No students found</p>
                  </div>
                ) : (
                  allStudents.map(student => (
                    <div key={student._id} className="flex items-center gap-3 p-3 rounded-xl bg-card-light dark:bg-card-dark border border-slate-100 dark:border-slate-800">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                        {student.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{student.fullName}</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{student.phone}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                        {student.groupId ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Edit/Delete Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setIsEditModalOpen(false); setIsDeleteConfirm(false); }}
          />
          <div className="relative w-full max-w-md bg-card-light dark:bg-card-dark rounded-2xl p-6 animate-slide-up">
            <button 
              onClick={() => { setIsEditModalOpen(false); setIsDeleteConfirm(false); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            {!isDeleteConfirm ? (
              <>
                <h2 className="text-xl font-bold mb-6">Edit Group</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Group Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Start Time</label>
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">End Time</label>
                      <input
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Days of Week</label>
                    <div className="flex gap-2 flex-wrap">
                      {allDaysFullName.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            editForm.daysOfWeek.includes(day)
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {getDayAbbr(day)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsDeleteConfirm(true)}
                    className="flex-1 h-12 rounded-lg border border-red-500 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="flex-1 h-12 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-red-500 mb-4">warning</span>
                  <h2 className="text-xl font-bold mb-2">Delete Group?</h2>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                    Are you sure you want to delete "{group.name}"? This action cannot be undone.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteConfirm(false)}
                    className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="flex-1 h-12 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Monthly Reward Modal */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsRewardModalOpen(false)}
          />
          <div className="relative w-full max-w-md max-h-[90vh] bg-card-light dark:bg-card-dark rounded-2xl flex flex-col animate-slide-up">
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setIsRewardModalOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              
              <h2 className="text-xl font-bold">Monthly Reward</h2>
              <p className="text-xs text-slate-500 mt-1">Set a prize for the top student this month</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Reward Name *</label>
                <input
                  type="text"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="e.g., iPhone 15 Pro"
                  className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="e.g., Latest iPhone with 256GB storage"
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Reward Image</label>
                <div className="space-y-2">
                  {/* Image preview */}
                  {rewardImagePreview && (
                    <div className="relative">
                      <img 
                        src={rewardImagePreview} 
                        alt="Reward preview" 
                        className="w-full h-32 object-contain rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRewardImagePreview('');
                          setRewardImageFile(null);
                          setRewardForm({ ...rewardForm, image: '' });
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  )}
                  
                  {/* File input */}
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 text-center hover:border-primary transition-colors">
                      <span className="material-symbols-outlined text-2xl text-slate-400">upload</span>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {rewardImageFile ? rewardImageFile.name : 'Click to upload image'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG up to 4MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 4 * 1024 * 1024) {
                            toast.error('Image size must be less than 4MB');
                            return;
                          }
                          setRewardImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setRewardImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Deadline</label>
                <input
                  type="datetime-local"
                  value={rewardForm.deadline}
                  onChange={(e) => setRewardForm({ ...rewardForm, deadline: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">When will the reward be given?</p>
              </div>
            </div>
            </div>
            
            <div className="flex-shrink-0 flex gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setIsRewardModalOpen(false);
                  setRewardImageFile(null);
                }}
                className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateReward}
                disabled={isSaving || !rewardForm.name}
                className="flex-1 h-12 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Reward'}
              </button>
            </div>
          </div>
        </div>
      )}
    <ToastContainer position="top-center" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover aria-label={undefined} />
    </div>
  );
};

export default GroupDetailView;
