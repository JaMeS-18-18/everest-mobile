
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '@/components/Loader';
import { useTranslation } from '../contexts/LanguageContext';

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
  status?: 'active' | 'finished' | 'left';
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
  const t = useTranslation();
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

  // Create Student Modal
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    phone: '',
    username: '',
    password: '',
    groupId: ''
  });
  const [groups, setGroups] = useState<{ _id: string; name: string }[]>([]);
  const [createStudentError, setCreateStudentError] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [isCreateStudentSubmitting, setIsCreateStudentSubmitting] = useState(false);

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

  useEffect(() => {
    if (isCreateStudentOpen) {
      setCreateStudentError('');
      api.get('/groups').then(res => {
        if (res.data.success) setGroups(res.data.data || []);
      });
    }
  }, [isCreateStudentOpen]);

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

  const handleCreateStudent = async () => {
    setCreateStudentError('');
    if (!studentForm.fullName.trim() || !studentForm.phone.trim() || !studentForm.username.trim() || !studentForm.password.trim()) {
      setCreateStudentError('Barcha maydonlarni to\'ldiring');
      return;
    }
    if (studentForm.password.length < 8) {
      setCreateStudentError('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setIsCreateStudentSubmitting(true);
    try {
      const res = await api.post('/students', {
        fullName: studentForm.fullName,
        phone: studentForm.phone,
        username: studentForm.username,
        password: studentForm.password
      });
      if (res.data.success) {
        if (studentForm.groupId) {
          await api.post(`/groups/${studentForm.groupId}/students/${res.data.data._id}`);
        }
        setIsCreateStudentOpen(false);
        setStudentForm({ fullName: '', phone: '', username: '', password: '', groupId: '' });
        fetchStudents();
        showAlert('O\'quvchi muvaffaqiyatli qo\'shildi', 'success');
      } else {
        setCreateStudentError(res.data.message || 'O\'quvchi qo\'shib bo\'lmadi');
      }
    } catch (err: any) {
      setCreateStudentError(err?.response?.data?.message || 'O\'quvchi qo\'shib bo\'lmadi');
    } finally {
      setIsCreateStudentSubmitting(false);
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

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
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-border-dark px-2 py-4 pt-4 sm:px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('students_my_students')}</h2>
          <span className="text-sm text-primary font-medium">
            {activeTab === 'students' ? `${students.length} ${t('students_count')}` : `${parents.length} ${t('students_count_parents')}`}
          </span>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'students'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-card-dark text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-1 align-middle">school</span>
            {t('students_tab_students')}
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'parents'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-card-dark text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-1 align-middle">family_restroom</span>
            {t('students_tab_parents')}
          </button>
        </div>
      </header>

      <div className="px-2 py-4 pb-20 sm:px-4">
        <div className="relative flex items-center bg-white dark:bg-card-dark h-12 rounded-xl shadow-sm px-4 border border-slate-200 dark:border-border-dark mb-6">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input 
            type="text" 
            placeholder={activeTab === 'students' ? t('students_search_students') : t('students_search_parents')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
          />
        </div>

        {/* Students Tab — card format (grid) */}
        {activeTab === 'students' && (
          <>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
                <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                <p>{t('students_no_students')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(student => (
                  <div
                    key={student._id}
                    className="bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden flex flex-col"
                  >
                    <div
                      onClick={() => navigate(`/students/${student._id}`)}
                      className="flex items-start gap-3 p-4 cursor-pointer flex-1 min-w-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0 overflow-hidden">
                        {student.profileImage ? (
                          <img
                            src={getProfileImageUrl(student.profileImage) || ''}
                            alt={student.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(student.fullName)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate capitalize">
                          {student.fullName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
                          @{student.username}
                        </p>
                        <p className="text-sm text-primary mt-0.5">
                          {student.phone}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          {(student.status === 'finished' || student.status === 'left') ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                              {t('student_status_nofaol')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                              {t('student_status_faol')}
                            </span>
                          )}
                            {student.groupId?.name && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px]">groups</span>
                              <span className="capitalize truncate max-w-[120px]">{student.groupId.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 flex-shrink-0">
                        chevron_right
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1 px-4 pb-3 pt-0 border-t border-slate-100 dark:border-border-dark">
                      <a
                        href={`tel:${student.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"
                        title={t('students_call')}
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </a>
                      {student.parentId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveParent(student._id, student.fullName);
                          }}
                          className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600"
                          title={t('students_remove_parent')}
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setIsAssignParentOpen(true);
                          }}
                          className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"
                          title={t('students_assign_parent')}
                        >
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                        </button>
                      )}
                    </div>
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
                <p>{t('students_no_parents')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredParents.map(parent => (
                  <div 
                    key={parent._id} 
                    className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-100 dark:border-border-dark"
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
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-border-dark">
                        <p className="text-xs text-slate-500 mb-2">{t('students_children')}</p>
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

      {/* FAB Button — o'ng pastda, pastki navdan aniq ajratilgan */}
      <div className="fixed z-30 bottom-20 right-4 sm:right-6 lg:bottom-8 lg:right-8">
        <button 
          onClick={() => activeTab === 'students' ? setIsCreateStudentOpen(true) : setIsCreateParentOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-all hover:bg-primary-dark"
          style={{ boxShadow: '0 4px 20px rgba(5, 171, 196, 0.35)' }}
          aria-label={activeTab === 'students' ? t('students_add_student') : t('students_add_parent')}
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </div>

      {/* Create Student Modal — scrollsiz, avto-to'ldirish o'chiq */}
      {isCreateStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 p-0 lg:p-4">
          <div className="bg-white dark:bg-card-dark rounded-t-3xl lg:rounded-2xl w-full max-w-md lg:max-w-xl flex flex-col shadow-xl max-h-[88vh] lg:max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-border-dark shrink-0">
              <h3 className="text-lg font-bold">{t('students_modal_new_student')}</h3>
              <button onClick={() => { setIsCreateStudentOpen(false); setCreateStudentError(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-card-dark/90 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-hidden flex flex-col min-h-0">
              {createStudentError && <div className="text-red-500 text-sm text-center shrink-0">{createStudentError}</div>}
              <div className="grid grid-cols-1 gap-3 shrink-0">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-0.5">{t('students_modal_fio')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                    <input
                      type="text"
                      autoComplete="off"
                      value={studentForm.fullName}
                      onChange={e => setStudentForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder={t('students_modal_fio_placeholder')}
                      className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl pl-10 pr-3 text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-0.5">{t('students_modal_phone')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={studentForm.phone}
                      onChange={e => setStudentForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="998901234567"
                      className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl pl-10 pr-3 text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-0.5">{t('students_modal_login')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">alternate_email</span>
                    <input
                      type="text"
                      autoComplete="off"
                      value={studentForm.username}
                      onChange={e => setStudentForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder={t('students_modal_login')}
                      className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl pl-10 pr-3 text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-0.5">{t('students_modal_password')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                    <input
                      type={showStudentPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={studentForm.password}
                      onChange={e => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowStudentPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-lg">{showStudentPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-0.5">{t('students_modal_assign_group')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">groups</span>
                    <select
                      value={studentForm.groupId}
                      onChange={e => setStudentForm(prev => ({ ...prev, groupId: e.target.value }))}
                      className="w-full h-11 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl pl-10 pr-4 text-base appearance-none"
                    >
                      <option value="">{t('students_modal_select_group')}</option>
                      {groups.map(g => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCreateStudent}
                disabled={isCreateStudentSubmitting}
                className="w-full h-11 bg-primary text-white font-bold rounded-xl disabled:opacity-50 shrink-0"
              >
                {isCreateStudentSubmitting ? t('students_modal_loading') : t('students_modal_add_student_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Parent Modal */}
      {isCreateParentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('students_modal_create_parent_title')}</h3>
              <button onClick={() => setIsCreateParentOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_full_name')}</label>
                <input
                  type="text"
                  value={parentForm.fullName}
                  onChange={(e) => setParentForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder={t('students_modal_parent_name_placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_phone')}</label>
                <input
                  type="tel"
                  value={parentForm.phone}
                  onChange={(e) => setParentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder="+998901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_login')}</label>
                <input
                  type="text"
                  value={parentForm.username}
                  onChange={(e) => setParentForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder={t('students_modal_login')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_password')}</label>
                <input
                  type="password"
                  value={parentForm.password}
                  onChange={(e) => setParentForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder={t('students_modal_password')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('students_modal_assign_children')}</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 dark:border-border-dark rounded-xl p-2">
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
                      <span className="text-xs text-slate-400">({student.groupId?.name || t('students_modal_no_group')})</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateParent}
                disabled={isSubmitting}
                className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isSubmitting ? t('students_modal_creating') : t('students_modal_create_parent_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Parent Modal */}
      {isAssignParentOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('students_modal_assign_parent_title')} — {selectedStudent.fullName}</h3>
              <button onClick={() => { setIsAssignParentOpen(false); setSelectedStudent(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              {parents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">family_restroom</span>
                  <p>{t('students_modal_no_parents_yet')}</p>
                  <button
                    onClick={() => {
                      setIsAssignParentOpen(false);
                      setIsCreateParentOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    {t('students_modal_create_parent_first')}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Parent</label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
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
                      {isSubmitting ? t('students_modal_assigning') : t('students_modal_assign_btn')}
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
                      {t('students_modal_new')}
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
          <div className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('students_modal_edit_parent')}</h3>
              <button onClick={() => { setIsEditParentOpen(false); setEditingParent(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_full_name')}</label>
                <input
                  type="text"
                  value={editParentForm.fullName}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder={t('students_modal_parent_name_placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_phone')}</label>
                <input
                  type="tel"
                  value={editParentForm.phone}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder="+998901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_login')}</label>
                <input
                  type="text"
                  value={editParentForm.username}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder={t('students_modal_login')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('students_modal_new_password')}</label>
                <input
                  type="password"
                  value={editParentForm.password}
                  onChange={(e) => setEditParentForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark"
                  placeholder={t('students_modal_password_leave_empty')}
                />
                <p className="text-xs text-slate-400 mt-1">{t('students_modal_password_leave_empty_hint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('students_modal_assigned_children')}</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 dark:border-border-dark rounded-xl p-2">
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
                      <span className="text-xs text-slate-400">({student.groupId?.name || t('students_modal_no_group')})</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleEditParent}
                disabled={isSubmitting}
                className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isSubmitting ? t('students_modal_saving') : t('students_modal_save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-red-600">
                {confirmModal.type === 'deleteParent' ? 'delete_forever' : 'person_remove'}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">
              {confirmModal.type === 'deleteParent' ? t('students_confirm_delete_parent') : t('students_confirm_remove_parent')}
            </h3>
            <p className="text-slate-500 mb-6">
              {confirmModal.type === 'deleteParent' ? (
                <>
                  {t('students_confirm_delete_message').replace('{name}', confirmModal.name)}
                </>
              ) : (
                <>
                  {t('students_confirm_remove_message').replace('{name}', confirmModal.name)}
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: 'deleteParent', id: '', name: '' })}
                className="flex-1 h-11 rounded-xl font-medium border border-slate-200 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {t('settings_cancel')}
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 h-11 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600"
              >
                {confirmModal.type === 'deleteParent' ? t('students_confirm_delete_btn') : t('students_confirm_remove_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-sm p-6 text-center">
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
              {t('students_ok')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsView;
