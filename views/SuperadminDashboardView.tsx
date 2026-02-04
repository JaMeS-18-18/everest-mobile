import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { toast } from 'react-toastify';

interface Organization {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  teacherCount?: number;
  studentCount?: number;
  createdAt?: string;
}

interface Admin {
  _id: string;
  fullName: string;
  username: string;
  phone?: string;
}

const SuperadminDashboardView: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState({
    name: '',
    address: '',
    phone: '',
    adminName: '',
    adminPhone: '',
    adminLogin: '',
    adminPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; org: Organization | null }>({ 
    open: false, 
    org: null 
  });

  // Admins modal
  const [adminsModal, setAdminsModal] = useState<{ 
    open: boolean; 
    org: Organization | null; 
    admins: Admin[] 
  }>({ 
    open: false, 
    org: null, 
    admins: [] 
  });
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizations');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setOrganizations(data);
    } catch (err) {
      toast.error('Failed to load organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrg.name.trim()) {
      toast.error('Organization name is required');
      return;
    }
    if (!newOrg.adminName.trim() || !newOrg.adminLogin.trim() || !newOrg.adminPassword.trim()) {
      toast.error('Admin details are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/organizations', {
        name: newOrg.name,
        address: newOrg.address,
        phone: newOrg.adminPhone,
        admin: {
          fullName: newOrg.adminName,
          phone: newOrg.adminPhone,
          username: newOrg.adminLogin,
          password: newOrg.adminPassword
        }
      });
      toast.success('Organization created successfully');
      closeOrgModal();
      fetchOrganizations();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create organization';
      if (message.includes('duplicate')) {
        toast.error('Organization with this name already exists');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrg = async () => {
    if (!editingOrg) return;
    
    setSubmitting(true);
    try {
      await api.put(`/organizations/${editingOrg._id}`, {
        name: newOrg.name,
        address: newOrg.address,
        phone: newOrg.phone
      });
      toast.success('Organization updated successfully');
      closeOrgModal();
      fetchOrganizations();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!deleteModal.org) return;
    
    try {
      await api.delete(`/organizations/${deleteModal.org._id}`);
      toast.success('Organization deleted successfully');
      setDeleteModal({ open: false, org: null });
      fetchOrganizations();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete organization');
    }
  };

  const fetchAdmins = async (org: Organization) => {
    setLoadingAdmins(true);
    setAdminsModal({ open: true, org, admins: [] });
    try {
      const res = await api.get(`/organizations/${org._id}/admins`);
      const admins = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setAdminsModal({ open: true, org, admins });
    } catch (err) {
      toast.error('Failed to fetch admins');
      setAdminsModal({ open: true, org, admins: [] });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setNewOrg({
      name: org.name,
      address: org.address || '',
      phone: org.phone || '',
      adminName: '',
      adminPhone: '',
      adminLogin: '',
      adminPassword: ''
    });
    setShowOrgModal(true);
  };

  const closeOrgModal = () => {
    setShowOrgModal(false);
    setEditingOrg(null);
    setNewOrg({
      name: '',
      address: '',
      phone: '',
      adminName: '',
      adminPhone: '',
      adminLogin: '',
      adminPassword: ''
    });
  };

  // Filter organizations by search
  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalTeachers = organizations.reduce((acc, org) => acc + (org.teacherCount || 0), 0);
  const totalStudents = organizations.reduce((acc, org) => acc + (org.studentCount || 0), 0);

  // Avatar colors
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
                Superadmin
              </h1>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Manage organizations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"
                onClick={() => fetchOrganizations()}
              >
                <span className="material-symbols-outlined text-xl">refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">apartment</span>
            </div>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {organizations.length}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Organizations</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">school</span>
            </div>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {totalTeachers}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Teachers</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">groups</span>
            </div>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {totalStudents}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Students</p>
          </motion.div>
        </div>

        {/* Search & Add */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOrgModal(true)}
            className="h-12 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            <span className="hidden sm:inline">Add</span>
          </motion.button>
        </div>

        {/* Organizations List */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Loading...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">domain_disabled</span>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {searchQuery ? 'No organizations found' : 'No organizations yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowOrgModal(true)}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-medium"
                >
                  Create First Organization
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredOrgs.map((org, idx) => {
                const initials = org.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const colorClass = avatarColors[idx % avatarColors.length];
                
                return (
                  <motion.div
                    key={org._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                        {initials}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                          {org.name}
                        </h3>
                        
                        {org.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark">location_on</span>
                            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                              {org.address}
                            </span>
                          </div>
                        )}
                        
                        {org.phone && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark">call</span>
                            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {org.phone}
                            </span>
                          </div>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-blue-500">school</span>
                            <span className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                              {org.teacherCount || 0} teachers
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-green-500">groups</span>
                            <span className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                              {org.studentCount || 0} students
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => fetchAdmins(org)}
                        className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium text-sm flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">badge</span>
                        Admins
                      </button>
                      <button
                        onClick={() => openEditModal(org)}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary-light dark:text-text-primary-dark rounded-xl font-medium text-sm flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, org })}
                        className="py-2 px-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-medium text-sm flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Create/Edit Organization Modal */}
      <AnimatePresence>
        {showOrgModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={closeOrgModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card-light dark:bg-card-dark rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      {editingOrg ? 'edit' : 'add_business'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    {editingOrg ? 'Edit Organization' : 'New Organization'}
                  </h2>
                </div>
                <button
                  onClick={closeOrgModal}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                {/* Organization Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">
                    Organization Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Everest Academy"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tashkent, Yunusabad"
                      value={newOrg.address}
                      onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +998 90 111 22 33"
                      value={newOrg.phone}
                      onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Admin Info (only for new org) */}
                {!editingOrg && (
                  <div className="space-y-3 pt-2 border-t border-border-light dark:border-border-dark">
                    <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">
                      Admin Account
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                        Admin Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={newOrg.adminName}
                        onChange={(e) => setNewOrg({ ...newOrg, adminName: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                        Admin Phone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +998 90 111 22 33"
                        value={newOrg.adminPhone}
                        onChange={(e) => setNewOrg({ ...newOrg, adminPhone: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. admin123"
                        value={newOrg.adminLogin}
                        onChange={(e) => setNewOrg({ ...newOrg, adminLogin: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newOrg.adminPassword}
                        onChange={(e) => setNewOrg({ ...newOrg, adminPassword: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-card-light dark:bg-card-dark p-4 border-t border-border-light dark:border-border-dark flex gap-3">
                <button
                  onClick={closeOrgModal}
                  className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary-light dark:text-text-primary-dark rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingOrg ? handleUpdateOrg : handleCreateOrg}
                  disabled={submitting}
                  className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">
                        {editingOrg ? 'save' : 'add'}
                      </span>
                      {editingOrg ? 'Save Changes' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.open && deleteModal.org && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteModal({ open: false, org: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card-light dark:bg-card-dark rounded-2xl w-full max-w-sm p-6 shadow-xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
              </div>
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                Delete Organization?
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Are you sure you want to delete
              </p>
              <p className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                "{deleteModal.org.name}"?
              </p>
              <p className="text-sm text-red-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, org: null })}
                  className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary-light dark:text-text-primary-dark rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrg}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admins Modal */}
      <AnimatePresence>
        {adminsModal.open && adminsModal.org && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setAdminsModal({ open: false, org: null, admins: [] })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card-light dark:bg-card-dark rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">badge</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark">Admins</h2>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {adminsModal.org.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAdminsModal({ open: false, org: null, admins: [] })}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-80 overflow-y-auto">
                {loadingAdmins ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">Loading...</p>
                  </div>
                ) : adminsModal.admins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-3xl text-slate-400">person_off</span>
                    </div>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">No admins found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {adminsModal.admins.map((admin) => (
                      <div
                        key={admin._id}
                        className="flex items-center gap-3 p-3 bg-background-light dark:bg-background-dark rounded-xl"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {admin.fullName?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                            {admin.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                            @{admin.username}
                          </p>
                          {admin.phone && (
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                              {admin.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border-light dark:border-border-dark">
                <button
                  onClick={() => setAdminsModal({ open: false, org: null, admins: [] })}
                  className="w-full h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary-light dark:text-text-primary-dark rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperadminDashboardView;
