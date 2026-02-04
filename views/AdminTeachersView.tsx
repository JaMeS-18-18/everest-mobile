
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';

interface Teacher {
  _id: string;
  fullName: string;
  username: string;
  phone: string;
  subject?: string;
  avatar?: string;
}

const AdminTeachersView: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', phone: '', subject: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState<{ open: boolean; teacher?: Teacher }>({ open: false });
  const [editForm, setEditForm] = useState({ fullName: '', username: '', phone: '', subject: '', password: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal
  const [showDelete, setShowDelete] = useState<{ open: boolean; teacher?: Teacher }>({ open: false });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Menu
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setShowMenuId(null);
    if (showMenuId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenuId]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users?role=teacher');
      setTeachers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const filtered = teachers.filter(t =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    t.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.fullName.trim() || !form.username.trim() || !form.password.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setCreating(true);
    try {
      await api.post('/users', { ...form, role: 'teacher' });
      toast.success('Teacher created successfully');
      setShowCreate(false);
      setForm({ fullName: '', username: '', password: '', phone: '', subject: '' });
      setShowPassword(false);
      fetchTeachers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create teacher';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit.teacher) return;

    setEditLoading(true);
    try {
      const payload: any = {
        fullName: editForm.fullName,
        username: editForm.username,
        phone: editForm.phone,
        subject: editForm.subject,
      };
      if (editForm.password && editForm.password.length >= 8) {
        payload.password = editForm.password;
      }
      await api.put(`/users/${showEdit.teacher._id}`, payload);
      toast.success('Teacher updated successfully');
      setShowEdit({ open: false });
      setShowEditPassword(false);
      fetchTeachers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update teacher');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete.teacher) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/users/${showDelete.teacher._id}`);
      toast.success('Teacher deleted successfully');
      setShowDelete({ open: false });
      fetchTeachers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setEditForm({
      fullName: teacher.fullName,
      username: teacher.username,
      phone: teacher.phone,
      subject: teacher.subject || '',
      password: '',
    });
    setShowEdit({ open: true, teacher });
    setShowMenuId(null);
  };

  const getOrgName = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.organization?.name || null;
      }
    } catch {}
    return null;
  };

  const avatarColors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors">
      {/* Header */}
      <div className="bg-card-light dark:bg-card-dark shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Teachers
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {teachers.length} Active Teachers
                </span>
                {getOrgName() && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {getOrgName()}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => fetchTeachers()}
              className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Search */}
        <div className="mt-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>

        {/* Teachers List */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">person_off</span>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {search ? 'No teachers found' : 'No teachers yet'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.map((teacher, idx) => {
                const initials = teacher.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const colorClass = avatarColors[idx % avatarColors.length];
                
                return (
                  <motion.div
                    key={teacher._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {teacher.avatar ? (
                        <img src={teacher.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                          {initials}
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                            {teacher.fullName}
                          </h3>
                          {teacher.subject && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full flex-shrink-0">
                              {teacher.subject}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                          @{teacher.username}
                        </p>
                        {teacher.phone && (
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {teacher.phone}
                          </p>
                        )}
                      </div>

                      {/* Menu Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenuId(showMenuId === teacher._id ? null : teacher._id);
                          }}
                          className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">more_vert</span>
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {showMenuId === teacher._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-0 top-10 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 transition-colors"
                                onClick={() => openEditModal(teacher)}
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                                Edit
                              </button>
                              <button
                                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                  setShowDelete({ open: true, teacher });
                                  setShowMenuId(null);
                                }}
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Add Teacher Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="w-full mt-6 h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Add Teacher
        </motion.button>
      </div>

      {/* Create Teacher Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleCreate}
              className="bg-card-light dark:bg-card-dark rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Create Teacher</h2>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Full Name (F.I.O) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="material-symbols-outlined text-xl">badge</span>
                    </span>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="material-symbols-outlined text-xl">call</span>
                    </span>
                    <input
                      type="text"
                      placeholder="90 123 45 67"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Username *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="material-symbols-outlined text-xl">alternate_email</span>
                    </span>
                    <input
                      type="text"
                      placeholder="username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="material-symbols-outlined text-xl">lock</span>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value.replace(/\s/g, '') })}
                      className="w-full h-12 pl-11 pr-12 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 ml-1">
                    Must be at least 8 characters
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Subject / Department
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="material-symbols-outlined text-xl">school</span>
                    </span>
                    <input
                      type="text"
                      placeholder="English"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-card-light dark:bg-card-dark p-4 border-t border-border-light dark:border-border-dark">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Create Teacher Profile
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Teacher Modal */}
      <AnimatePresence>
        {showEdit.open && showEdit.teacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowEdit({ open: false })}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleEdit}
              className="bg-card-light dark:bg-card-dark rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEdit({ open: false })}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Edit Teacher</h2>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    New Password <span className="text-text-secondary-light dark:text-text-secondary-dark font-normal">(leave empty to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value.replace(/\s/g, '') })}
                      className="w-full h-12 px-4 pr-12 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showEditPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-card-light dark:bg-card-dark p-4 border-t border-border-light dark:border-border-dark flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEdit({ open: false })}
                  className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary-light dark:text-text-primary-dark rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {editLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDelete.open && showDelete.teacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDelete({ open: false })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card-light dark:bg-card-dark rounded-2xl w-full max-w-sm p-6 shadow-xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-red-500">delete</span>
              </div>
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                Delete Teacher?
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Are you sure you want to delete
              </p>
              <p className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                {showDelete.teacher.fullName}?
              </p>
              <p className="text-sm text-red-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDelete({ open: false })}
                  className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary-light dark:text-text-primary-dark rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTeachersView;