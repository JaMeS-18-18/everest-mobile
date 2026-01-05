import React, { useState, useEffect } from 'react';
import { View } from '../types';
import api from '../api';

interface Student {
  _id: string;
  fullName: string;
  phone: string;
  username: string;
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
}

interface GroupDetailViewProps {
  groupId: string;
  navigate: (view: View) => void;
  onBack: () => void;
}

const GroupDetailView: React.FC<GroupDetailViewProps> = ({ groupId, navigate, onBack }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  const allDaysFullName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      const data = response.data;
      
      if (data.success) {
        setGroup(data.data);
        setEditForm({
          name: data.data.name,
          startTime: data.data.startTime,
          endTime: data.data.endTime,
          daysOfWeek: data.data.daysOfWeek,
        });
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
      alert('Failed to update group');
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
        onBack();
      }
    } catch (err) {
      alert('Failed to delete group');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = group?.students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone.includes(searchQuery)
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error || 'Group not found'}</p>
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
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

      {/* Students List */}
      <div className="flex-1 px-4 pb-24">
        <h2 className="text-lg font-semibold mb-3 mt-4">Students ({filteredStudents.length})</h2>
        
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
            <p>No students found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div 
                key={student._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card-light dark:bg-card-dark border border-slate-100 dark:border-slate-800"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{student.fullName}</h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {student.phone}
                  </p>
                </div>
                <a 
                  href={`tel:${student.phone}`}
                  className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default GroupDetailView;
