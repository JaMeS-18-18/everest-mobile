import React, { useEffect, useState } from 'react';
import api from '../api';

const SuperadminDashboardView: React.FC = () => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    address: '',
    phone: '',
    adminName: '',
    adminPhone: '',
    adminLogin: '',
    adminPassword: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizations');
      // Ensure organizations is always an array
      if (Array.isArray(res.data)) {
        setOrganizations(res.data);
      } else if (Array.isArray(res.data.data)) {
        setOrganizations(res.data.data);
      } else {
        setOrganizations([]);
      }
    } catch (err: any) {
      setError('Failed to load organizations');
      setOrganizations([]);
    }
    setLoading(false);
  };

  const handleCreateOrg = async () => {
    try {
      // Send organization and admin info together
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
      setShowOrgModal(false);
      setNewOrg({
        name: '',
        address: '',
        phone: '',
        adminName: '',
        adminPhone: '',
        adminLogin: '',
        adminPassword: ''
      });
      fetchOrganizations();
    } catch (err: any) {
      setError('Failed to create organization');
    }
  };

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; orgId: string | null }>({ open: false, orgId: null });

  const handleDeleteOrg = async () => {
    if (!deleteModal.orgId) return;
    try {
      await api.delete(`/organizations/${deleteModal.orgId}`);
      setDeleteModal({ open: false, orgId: null });
      fetchOrganizations();
    } catch (err: any) {
      setError('Failed to delete organization');
      setDeleteModal({ open: false, orgId: null });
    }
  };

  return (
    <div className="p-2 max-w-md mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Superadmin Dashboard</h1>
        <button className="bg-white dark:bg-slate-800 shadow rounded-full p-1 text-lg" title="Toggle dark mode">
          <span className="material-symbols-outlined dark:text-white">dark_mode</span>
        </button>
      </div>
      <p className="text-slate-500 dark:text-slate-300 mb-3 text-xs">Manage educational franchises</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-3 flex flex-col items-center">
          <span className="material-symbols-outlined text-xl text-primary mb-1">apartment</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{organizations.length}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-300 mt-1">TOTAL ORGS</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-3 flex flex-col items-center">
          <span className="material-symbols-outlined text-xl text-green-500 mb-1">trending_up</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white">-</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-300 mt-1">NEW THIS MONTH</div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-base font-bold text-slate-900 dark:text-white">Organizations</span>
        <button
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow flex items-center gap-1 text-sm"
          onClick={() => setShowOrgModal(true)}
        >
          <span className="material-symbols-outlined text-base">add_business</span> Add
        </button>
      </div>
      {loading ? (
        <div className="text-center text-base text-slate-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 font-semibold text-sm">{error}</div>
      ) : organizations.length === 0 ? (
        <div className="text-center text-slate-400 text-sm">No organizations found.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {organizations.map((org, idx) => {
            const initials = org.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();
            const status = idx % 2 === 0 ? 'Active' : 'Pending';
            const statusColor = status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
            const avatarColor = idx===0?'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200':idx===1?'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200':'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
            return (
              <div key={org._id} className="bg-white dark:bg-slate-800 rounded-xl shadow p-3 flex flex-col gap-2 relative border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${avatarColor}`}>{initials}</div>
                  <div>
                    <div className="text-base font-bold text-slate-800 dark:text-white">{org.name}</div>
                    <span className={`px-2 py-[2px] rounded-full text-[10px] font-semibold ml-1 ${statusColor}`}>{status}</span>
                  </div>
                  <button className="ml-auto text-slate-400 hover:text-slate-200 dark:hover:text-white p-1 rounded-full">
                    <span className="material-symbols-outlined text-base">more_vert</span>
                  </button>
                </div>
                {/* Teacher count display */}
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300 text-xs font-semibold mb-1">
                  <span className="material-symbols-outlined text-xs">group</span>
                  <span>{typeof org.teacherCount === 'number' ? org.teacherCount : 0} teacher{org.teacherCount === 1 ? '' : 's'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-300 text-xs mb-1">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  <span>{org.address || 'Uzbekistan'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-300 text-xs mb-1">
                  <span className="material-symbols-outlined text-xs">call</span>
                  <span>{org.phone}</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <button className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1 shadow text-xs">
                    <span className="material-symbols-outlined text-xs">badge</span> Admins
                  </button>
                  <button className="flex-1 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-semibold flex items-center justify-center gap-1 shadow text-xs">
                    <span className="material-symbols-outlined text-xs">edit</span> Edit
                  </button>
                  <button
                    className="flex-1 py-1 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded-lg font-semibold flex items-center justify-center gap-1 shadow text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({ open: true, orgId: org._id });
                    }}
                  >
                    <span className="material-symbols-outlined text-xs">delete</span> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 w-full max-w-md shadow-2xl border border-blue-100 dark:border-slate-800 relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-2xl text-blue-600">apartment</span>
              <h2 className="text-xl font-extrabold tracking-tight">Add Organization</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Everest Academy"
                  value={newOrg.name}
                  onChange={e => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Tashkent, Yunusabad"
                  value={newOrg.address}
                  onChange={e => setNewOrg({ ...newOrg, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newOrg.adminName}
                    onChange={e => setNewOrg({ ...newOrg, adminName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +998 90 111 22 33"
                    value={newOrg.adminPhone}
                    onChange={e => setNewOrg({ ...newOrg, adminPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Login</label>
                  <input
                    type="text"
                    placeholder="e.g. admin123"
                    value={newOrg.adminLogin}
                    onChange={e => setNewOrg({ ...newOrg, adminLogin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={newOrg.adminPassword}
                    onChange={e => setNewOrg({ ...newOrg, adminPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-900"
                  />
                </div>
            </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg font-semibold text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                onClick={() => setShowOrgModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition"
                onClick={handleCreateOrg}
              >
                <span className="material-symbols-outlined align-middle text-base mr-1">check_circle</span> Save
              </button>
            </div>
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full"
              onClick={() => setShowOrgModal(false)}
              title="Close"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-xs shadow-lg flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-red-500 mb-2">warning</span>
            <h2 className="text-lg font-bold mb-2 text-center">Delete Organization?</h2>
            <p className="text-slate-500 text-sm mb-4 text-center">Are you sure you want to delete this organization? This action cannot be undone.</p>
            <div className="flex gap-3 w-full mt-2">
              <button
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-white font-semibold"
                onClick={() => setDeleteModal({ open: false, orgId: null })}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold"
                onClick={handleDeleteOrg}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminDashboardView;
