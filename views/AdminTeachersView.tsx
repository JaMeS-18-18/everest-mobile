
import React, { useEffect, useState } from 'react';
import api from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Teacher {
  _id: string;
  fullName: string;
  username: string;
  phone: string;
  subject?: string;
  avatar?: string;
}

const subjectColors: Record<string, string> = {
  Mathematics: 'bg-blue-100 text-blue-700',
  Science: 'bg-green-100 text-green-700',
  'Art & Design': 'bg-purple-100 text-purple-700',
  History: 'bg-orange-100 text-orange-700',
  'Physical Ed.': 'bg-red-100 text-red-700',
};

const AdminTeachersView: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', phone: '', subject: '' });
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState<{ open: boolean, teacher?: Teacher }>({ open: false });
  const [showDelete, setShowDelete] = useState<{ open: boolean, teacher?: Teacher }>({ open: false });
  const [editForm, setEditForm] = useState({ fullName: '', username: '', phone: '', subject: '', password: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const res = await api.get('/users?role=teacher');
    setTeachers(res.data.data || []);
  };

  const filtered = teachers.filter(t =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      // Explicitly send subject and email
      const payload = { ...form, role: 'teacher', subject: form.subject };
      const res = await api.post('/users', payload);
      setShowCreate(false);
      setForm({ fullName: '', username: '', password: '', phone: '', subject: '', email: '' });
      fetchTeachers();
      toast.success(res.data?.message || 'Teacher created successfully');
    } catch (e: any) {
      // Try to show backend error message if available
      const msg = e?.response?.data?.message || e.message || 'Failed to create teacher';
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover aria-label={undefined} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark transition-colors">Teacher Management</h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-300 text-sm transition-colors">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              <span className="font-semibold">{teachers.length} Active Teachers</span>
            </span>
            <span>•</span>
            <span>All Departments</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative">
            <span className="material-symbols-outlined text-2xl">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <input
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
          placeholder="Search by name or subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t._id} className="flex items-center bg-white dark:bg-card-dark rounded-2xl shadow-sm px-4 py-3 hover:shadow-md transition group relative">
            {t.avatar ? (
              <img src={t.avatar} alt="" className="w-12 h-12 rounded-full object-cover mr-3" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold mr-3 text-text-primary-light dark:text-text-primary-dark">
                {t.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[17px] group-hover:text-primary transition-colors text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                {t.fullName}
                {t.subject && (
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${subjectColors[t.subject] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>{t.subject}</span>
                )}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-300 block truncate">{t.username}</span>
            </div>
            <button className="ml-2 text-slate-400 dark:text-slate-300 hover:text-primary transition relative" onClick={() => setShowMenuId(t._id === showMenuId ? null : t._id)}>
              <span className="material-symbols-outlined">more_vert</span>
              {showMenuId === t._id && (
                <div className="absolute right-0 top-8 bg-white dark:bg-card-dark border dark:border-border-dark rounded-xl shadow-lg z-50 min-w-[120px]">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    onClick={() => {
                      setShowEdit({ open: true, teacher: t });
                      setEditForm({
                        fullName: t.fullName,
                        username: t.username,
                        phone: t.phone,
                        subject: t.subject || '',
                        password: t.password || '',
                      });
                      setShowMenuId(null);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2 align-middle">edit</span>
                    Edit
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-300"
                    onClick={() => {
                      setShowDelete({ open: true, teacher: t });
                      setShowMenuId(null);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2 align-middle">delete</span>
                    Delete
                  </button>
                </div>
              )}
            </button>
          </div>
        ))}
              {/* Edit Teacher Modal */}
              {showEdit.open && showEdit.teacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      setEditLoading(true);
                      setError(null);
                      try {
                        await api.put(`/users/${showEdit.teacher!._id}`, editForm);
                        setShowEdit({ open: false });
                        fetchTeachers();
                      } catch (e: any) {
                        setError(e.message || 'Failed to update teacher');
                      } finally {
                        setEditLoading(false);
                      }
                    }}
                    className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl shadow-xl flex flex-col gap-0 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-6 pt-6 pb-2 border-b dark:border-border-dark">
                      <button type="button" onClick={() => setShowEdit({ open: false })} className="mr-2 text-slate-500 hover:text-primary">
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                      </button>
                      <h2 className="font-extrabold text-xl">Edit Teacher</h2>
                    </div>
                    <div className="px-6 py-2 overflow-y-auto">
                      <label className="block text-sm font-semibold mb-1 mt-2 text-text-primary-light dark:text-text-primary-dark">Full Name</label>
                      <input
                        className="w-full mb-2 p-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                        value={editForm.fullName}
                        onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                        required
                      />
                      <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Phone</label>
                      <input
                        className="w-full mb-2 p-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        required
                      />
                      <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Username</label>
                      <input
                        className="w-full mb-2 p-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                        value={editForm.username}
                        onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                        required
                      />
                      <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Password</label>
                      <div className="relative mb-2">
                        <input
                          className="w-full p-3 pr-12 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                          type={showEditPassword ? 'text' : 'password'}
                          minLength={8}
                          value={editForm.password}
                          onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                          required
                        />
                        <span
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer select-none"
                          onClick={() => setShowEditPassword(v => !v)}
                          title={showEditPassword ? 'Hide password' : 'Show password'}
                        >
                          <span className="material-symbols-outlined">
                            {showEditPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </span>
                      </div>
                      <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Subject</label>
                      <input
                        className="w-full mb-2 p-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                        value={editForm.subject}
                        onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                      />
                      {error && <div className="text-red-500 dark:text-red-300 text-sm mb-2">{error}</div>}
                    </div>
                    <div className="px-6 pb-6 pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg hover:bg-primary/90 transition"
                        disabled={editLoading}
                      >
                        Save Changes
                        <span className="material-symbols-outlined ml-1">check</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Delete Teacher Modal */}
              {showDelete.open && showDelete.teacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-card-dark w-full max-w-sm rounded-2xl shadow-xl flex flex-col gap-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-6 pt-6 pb-2 border-b dark:border-border-dark">
                      <button type="button" onClick={() => setShowDelete({ open: false })} className="mr-2 text-slate-500 hover:text-primary">
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                      </button>
                      <h2 className="font-extrabold text-xl">Delete Teacher</h2>
                    </div>
                    <div className="px-6 py-6 text-center">
                      <span className="material-symbols-outlined text-red-500 text-5xl mb-2">delete</span>
                      <div className="font-bold text-lg mb-2 text-text-primary-light dark:text-text-primary-dark">Are you sure you want to delete this teacher?</div>
                      <div className="text-slate-500 dark:text-slate-300 mb-4">{showDelete.teacher.fullName}</div>
                      {error && <div className="text-red-500 dark:text-red-300 text-sm mb-2">{error}</div>}
                      <div className="flex gap-2 justify-center">
                        <button
                          className="bg-slate-200 dark:bg-slate-700 text-text-primary-light dark:text-text-primary-dark px-4 py-2 rounded font-bold"
                          onClick={() => setShowDelete({ open: false })}
                          disabled={deleteLoading}
                        >
                          Cancel
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 dark:hover:bg-red-700 transition"
                          onClick={async () => {
                            setDeleteLoading(true);
                            setError(null);
                            try {
                              await api.delete(`/users/${showDelete.teacher!._id}`);
                              setShowDelete({ open: false });
                              fetchTeachers();
                            } catch (e: any) {
                              setError(e.message || 'Failed to delete teacher');
                            } finally {
                              setDeleteLoading(false);
                            }
                          }}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 dark:text-slate-300 py-8">No teachers found</div>
        )}
      </div>
      <button
        className="w-full mt-8 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg hover:bg-primary/90 transition"
        onClick={() => setShowCreate(true)}
      >
        <span className="material-symbols-outlined">add</span>
        Add Teacher
      </button>

      {/* Modal for creating teacher */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleCreate} className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl shadow-xl flex flex-col gap-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-6 pt-6 pb-2 border-b dark:border-border-dark">
              <button type="button" onClick={() => setShowCreate(false)} className="mr-2 text-slate-500 hover:text-primary">
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
              </button>
              <h2 className="font-extrabold text-xl text-text-primary-light dark:text-text-primary-dark">Create Teacher</h2>
            </div>
            <div className="px-6 py-2 overflow-y-auto">
              {/* Personal Info */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Full Name (F.I.O)</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined">badge</span>
                  </span>
                  <input
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="F.I.O"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    required
                  />
                </div>
                <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Phone Number</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined">call</span>
                  </span>
                  <input
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="+998 90 123-45-67"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
              {/* Account Access */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Username</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined">alternate_email</span>
                  </span>
                  <input
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="username"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required
                  />
                </div>
                <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Password</label>
                <div className="relative mb-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined">lock</span>
                  </span>
                  <input
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Password"
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer select-none">
                    <span className="material-symbols-outlined">visibility</span>
                  </span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 ml-1 mb-2">Must be at least 8 characters</div>
              </div>
              {/* Department Details */}
              <div className="mb-2">
                <label className="block text-sm font-semibold mb-1 text-text-primary-light dark:text-text-primary-dark">Subject / Department</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined">school</span>
                  </span>
                  <input
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="English"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  />
                </div>
              </div>
              {error && <div className="text-red-500 dark:text-red-300 text-sm mb-2">{error}</div>}
            </div>
            <div className="px-6 pb-6 pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg hover:bg-primary/90 transition"
                disabled={creating}
              >
                Create Teacher Profile
                <span className="material-symbols-outlined ml-1">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminTeachersView;