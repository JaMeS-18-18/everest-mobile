
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '@/components/Loader';

interface GroupInfo {
  _id: string;
  name: string;
}

interface Student {
  _id: string;
  fullName: string;
  phone: string;
  username: string;
  groupId: GroupInfo;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  parentId?: {
    _id: string;
    fullName: string;
    phone: string;
  };
}

interface Parent {
  userId: any;
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  students: { _id: string; fullName: string }[];
  createdAt: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

const getProfileImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const StudentsView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'parents'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Parent Modal
  const [isCreateParentOpen, setIsCreateParentOpen] = useState(false);
  const [parentForm, setParentForm] = useState({
    fullName: '',
    phone: '',
    username: '',
    password: '',
    studentIds: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Parent Modal
  const [isEditParentOpen, setIsEditParentOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [editParentForm, setEditParentForm] = useState({
    fullName: '',
    phone: '',
    username: '',
    password: '',
    studentIds: [] as string[]
  });

  // Assign Parent Modal
  const [isAssignParentOpen, setIsAssignParentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedParentId, setSelectedParentId] = useState('');

  // Alert Modal
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    message: '',
    type: 'error'
  });

  const showAlert = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setAlertModal({ isOpen: true, message, type });
  };

  // Confirm Delete Modal
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    type: 'deleteParent' | 'removeParent'; 
    id: string; 
    name: string 
  }>({
    isOpen: false,
    type: 'deleteParent',
    id: '',
    name: ''
  });

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ isOpen: false, type: 'deleteParent', id: '', name: '' });
    
    if (type === 'deleteParent') {
      try {
        const response = await api.delete(`/parents/${id}`);
        if (response.data.success) {
          fetchParents();
          fetchStudents();
          showAlert('Parent deleted successfully', 'success');
        }
      } catch (err) {
        showAlert('Failed to delete parent', 'error');
      }
    } else if (type === 'removeParent') {
      try {
        const response = await api.put(`/students/${id}/remove-parent`);
        if (response.data.success) {
          fetchStudents();
          fetchParents();
          showAlert('Parent removed successfully', 'success');
        }
      } catch (err) {
        showAlert('Failed to remove parent', 'error');
      }
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchParents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      const data = response.data;
      
      if (data.success) {
        setStudents(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await api.get('/parents');
      if (response.data.success) {
        setParents(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch parents:', err);
    }
  };

  const handleCreateParent = async () => {
    if (!parentForm.fullName || !parentForm.phone || !parentForm.username || !parentForm.password) {
      showAlert('Please fill all required fields', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/parents', parentForm);
      if (response.data.success) {
        setIsCreateParentOpen(false);
        setParentForm({ fullName: '', phone: '', username: '', password: '', studentIds: [] });
        fetchParents();
        fetchStudents();
        showAlert('Parent created successfully', 'success');
      } else {
        showAlert(response.data.message || 'Failed to create parent', 'error');
      }
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Failed to create parent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignParent = async () => {
    if (!selectedStudent || !selectedParentId) return;
    setIsSubmitting(true);
    try {
      const response = await api.put(`/parents/${selectedParentId}/assign-student/${selectedStudent._id}`);
      if (response.data.success) {
        setIsAssignParentOpen(false);
        setSelectedStudent(null);
        setSelectedParentId('');
        fetchStudents();
        fetchParents();
        showAlert('Parent assigned successfully', 'success');
      } else {
        showAlert(response.data.message || 'Failed to assign parent', 'error');
      }
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Failed to assign parent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveParent = (studentId: string, studentName: string) => {
    setConfirmModal({ isOpen: true, type: 'removeParent', id: studentId, name: studentName });
  };

  const openEditParent = (parent: Parent) => {
    setEditingParent(parent);
    setEditParentForm({
      fullName: parent.fullName,
      phone: parent.phone,
      username: parent.userId?.username || '',
      password: '',
      studentIds: parent.students?.map(s => s._id) || []
    });
    setIsEditParentOpen(true);
  };

  const handleEditParent = async () => {
    if (!editingParent) return;
    if (!editParentForm.fullName || !editParentForm.phone) {
      showAlert('Please fill all required fields', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.put(`/parents/${editingParent._id}`, editParentForm);
      if (response.data.success) {
        setIsEditParentOpen(false);
        setEditingParent(null);
        fetchParents();
        fetchStudents();
        showAlert('Parent updated successfully', 'success');
      } else {
        showAlert(response.data.message || 'Failed to update parent', 'error');
      }
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Failed to update parent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParent = (parentId: string, parentName: string) => {
    setConfirmModal({ isOpen: true, type: 'deleteParent', id: parentId, name: parentName });
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone.includes(searchQuery) ||
    student.groupId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParents = parents.filter(parent =>
    parent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.phone.includes(searchQuery)
  );

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error}</p>
        <button 
          onClick={fetchStudents}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Students</h2>
          <span className="text-sm text-primary font-medium">
            {activeTab === 'students' ? `${students.length} students` : `${parents.length} parents`}
          </span>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'students'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-1 align-middle">school</span>
            Students
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'parents'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-1 align-middle">family_restroom</span>
            Parents
          </button>
        </div>
      </header>

      <div className="p-4 pb-20">
        <div className="relative flex items-center bg-white dark:bg-slate-800 h-12 rounded-xl shadow-sm px-4 border border-slate-200 dark:border-slate-800 mb-6">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input 
            type="text" 
            placeholder={activeTab === 'students' ? "Search by name, phone or group..." : "Search by name or phone..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
          />
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-text-secondary-light">
                <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                <p>No students found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map(student => (
                  <div 
                    key={student._id} 
                    className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all"
                  >
                    <div 
                      onClick={() => navigate(`/students/${student._id}`)}
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate capitalize">{student.fullName}</p>
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {student.groupId?.name ? (
                            <span className="capitalize">{student.groupId.name}</span>
                          ) : (
                            <span className="text-slate-400">No group</span>
                          )}
                          {' • '}{student.phone}
                        </p>
                        {student.parentId ? (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">family_restroom</span>
                            {student.parentId.fullName}
                          </p>
                        ) : (
                          <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">person_off</span>
                            No parent assigned
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Parent assign/remove button */}
                    {student.parentId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveParent(student._id, student.fullName);
                        }}
                        className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600"
                        title="Remove parent"
                      >
                        <span className="material-symbols-outlined text-[20px]">person_remove</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setIsAssignParentOpen(true);
                        }}
                        className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"
                        title="Assign parent"
                      >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                      </button>
                    )}
                    
                    <a 
                      href={`tel:${student.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"
                    >
                      <span className="material-symbols-outlined text-[20px]">call</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Parents Tab */}
        {activeTab === 'parents' && (
          <>
            {filteredParents.length === 0 ? (
              <div className="text-center py-12 text-text-secondary-light">
                <span className="material-symbols-outlined text-4xl mb-2">family_restroom</span>
                <p>No parents found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredParents.map(parent => (
                  <div 
                    key={parent._id} 
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-lg font-bold text-purple-600">
                        {parent.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate capitalize">{parent.fullName}</p>
                        <p className="text-sm text-slate-500 truncate mt-0.5">{parent.phone}</p>
                        {parent.userId?.username && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">@{parent.userId.username}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditParent(parent)}
                          className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteParent(parent._id, parent.fullName)}
                          className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                        <a 
                          href={`tel:${parent.phone}`}
                          className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">call</span>
                        </a>
                      </div>
                    </div>
                    {parent.students && parent.students.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 mb-2">Children:</p>
                        <div className="flex flex-wrap gap-2">
                          {parent.students.map(s => (
                            <span key={s._id} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg capitalize">
                              {s.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB Button */}
      <div className="fixed bottom-24 right-0 left-0 z-30 flex justify-end max-w-md mx-auto px-4 pointer-events-none">
        <button 
          onClick={() => activeTab === 'students' ? navigate('/students/create') : setIsCreateParentOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-all pointer-events-auto"
          style={{ boxShadow: '0 4px 32px 0 rgba(45,140,240,0.10)' }}
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </div>

      {/* Create Parent Modal */}
      {isCreateParentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Parent</h3>
              <button onClick={() => setIsCreateParentOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={parentForm.fullName}
                  onChange={(e) => setParentForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Parent full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={parentForm.phone}
                  onChange={(e) => setParentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="+998901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  value={parentForm.username}
                  onChange={(e) => setParentForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Login username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  value={parentForm.password}
                  onChange={(e) => setParentForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assign Children (optional)</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                  {students.filter(s => !s.parentId).map(student => (
                    <label key={student._id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentForm.studentIds.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setParentForm(prev => ({ ...prev, studentIds: [...prev.studentIds, student._id] }));
                          } else {
                            setParentForm(prev => ({ ...prev, studentIds: prev.studentIds.filter(id => id !== student._id) }));
                          }
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm capitalize">{student.fullName}</span>
                      <span className="text-xs text-slate-400">({student.groupId?.name || 'No group'})</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateParent}
                disabled={isSubmitting}
                className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Parent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Parent Modal */}
      {isAssignParentOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold">Assign Parent to {selectedStudent.fullName}</h3>
              <button onClick={() => { setIsAssignParentOpen(false); setSelectedStudent(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              {parents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">family_restroom</span>
                  <p>No parents created yet</p>
                  <button
                    onClick={() => {
                      setIsAssignParentOpen(false);
                      setIsCreateParentOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Create Parent First
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Parent</label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Select a parent...</option>
                      {parents.map(parent => (
                        <option key={parent._id} value={parent._id}>
                          {parent.fullName} ({parent.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAssignParent}
                      disabled={!selectedParentId || isSubmitting}
                      className="flex-1 h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
                    >
                      {isSubmitting ? 'Assigning...' : 'Assign Parent'}
                    </button>
                    <button
                      onClick={() => {
                        setParentForm(prev => ({ ...prev, studentIds: [selectedStudent._id] }));
                        setIsAssignParentOpen(false);
                        setIsCreateParentOpen(true);
                      }}
                      className="h-11 px-4 bg-green-500 text-white rounded-xl font-medium flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">add</span>
                      New
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {isEditParentOpen && editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit Parent</h3>
              <button onClick={() => { setIsEditParentOpen(false); setEditingParent(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editParentForm.fullName}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Parent full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={editParentForm.phone}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="+998901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={editParentForm.username}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Login username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={editParentForm.password}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Leave empty to keep current"
                />
                <p className="text-xs text-slate-400 mt-1">Leave empty if you don't want to change the password</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assigned Children</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                  {students.map(student => (
                    <label key={student._id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editParentForm.studentIds.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditParentForm(prev => ({ ...prev, studentIds: [...prev.studentIds, student._id] }));
                          } else {
                            setEditParentForm(prev => ({ ...prev, studentIds: prev.studentIds.filter(id => id !== student._id) }));
                          }
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm capitalize">{student.fullName}</span>
                      <span className="text-xs text-slate-400">({student.groupId?.name || 'No group'})</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleEditParent}
                disabled={isSubmitting}
                className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-red-600">
                {confirmModal.type === 'deleteParent' ? 'delete_forever' : 'person_remove'}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">
              {confirmModal.type === 'deleteParent' ? 'Delete Parent' : 'Remove Parent'}
            </h3>
            <p className="text-slate-500 mb-6">
              {confirmModal.type === 'deleteParent' ? (
                <>
                  Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{confirmModal.name}</span>? 
                  This will also remove the parent from all assigned students.
                </>
              ) : (
                <>
                  Are you sure you want to remove parent from <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{confirmModal.name}</span>?
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: 'deleteParent', id: '', name: '' })}
                className="flex-1 h-11 rounded-xl font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 h-11 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600"
              >
                {confirmModal.type === 'deleteParent' ? 'Delete' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              alertModal.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
              alertModal.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              <span className={`material-symbols-outlined text-3xl ${
                alertModal.type === 'success' ? 'text-green-600' :
                alertModal.type === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {alertModal.type === 'success' ? 'check_circle' :
                 alertModal.type === 'warning' ? 'warning' : 'error'}
              </span>
            </div>
            <p className="text-base mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className={`w-full h-11 rounded-xl font-medium text-white ${
                alertModal.type === 'success' ? 'bg-green-500' :
                alertModal.type === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsView;
