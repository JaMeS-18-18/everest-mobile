import React, { useEffect, useState } from 'react';
import api from '../api';

interface Props {
  orgId: string;
  onClose: () => void;
}

const OrganizationAdminsModal: React.FC<Props> = ({ orgId, onClose }) => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', fullName: '', phone: '', email: '' });
  const [editAdmin, setEditAdmin] = useState<any | null>(null);
  const [editAdminData, setEditAdminData] = useState({ username: '', password: '', fullName: '', phone: '', email: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, [orgId]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/organizations/${orgId}/admins`);
      setAdmins(res.data);
    } catch (err: any) {
      setError('Failed to load admins');
    }
    setLoading(false);
  };

  const handleCreateAdmin = async () => {
    try {
      await api.post(`/organizations/${orgId}/admin`, newAdmin);
      setShowAddModal(false);
      setNewAdmin({ username: '', password: '', fullName: '', phone: '', email: '' });
      fetchAdmins();
    } catch (err: any) {
      setError('Failed to create admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold mb-4">Organization Admins</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <table className="w-full border rounded-xl overflow-hidden mb-4 border-slate-200 dark:border-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
              <tr>
                <th className="p-3 text-left">Full Name</th>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin._id} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-3 font-medium text-slate-900 dark:text-white">{admin.fullName}</td>
                  <td className="p-3 text-slate-900 dark:text-white">{admin.username}</td>
                  <td className="p-3 text-slate-900 dark:text-white">{admin.phone}</td>
                  <td className="p-3 text-slate-900 dark:text-white">{admin.email}</td>
                  <td className="p-3">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300"
                      onClick={() => {
                        setEditAdmin(admin);
                        setEditAdminData({
                          username: admin.username,
                          password: '',
                          fullName: admin.fullName,
                          phone: admin.phone,
                          email: admin.email,
                        });
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex gap-3 mb-2">
          <button className="flex-1 py-2 bg-primary text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300" onClick={() => setShowAddModal(true)}>
            + Add Admin
          </button>
          <button className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Add Admin Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-bold mb-4 dark:text-white">Add Admin</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={newAdmin.fullName}
                onChange={e => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Username"
                value={newAdmin.username}
                onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Phone"
                value={newAdmin.phone}
                onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="email"
                placeholder="Email"
                value={newAdmin.email}
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <div className="flex gap-3 mt-4">
                <button
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 rounded"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2 bg-primary text-white rounded"
                  onClick={handleCreateAdmin}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Admin Modal */}
        {showEditModal && editAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-lg relative z-[101]">
              <h2 className="text-lg font-bold mb-4 dark:text-white">Edit Admin</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={editAdminData.fullName}
                onChange={e => setEditAdminData({ ...editAdminData, fullName: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Username"
                value={editAdminData.username}
                onChange={e => setEditAdminData({ ...editAdminData, username: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="password"
                placeholder="Password (leave blank to keep current)"
                value={editAdminData.password}
                onChange={e => setEditAdminData({ ...editAdminData, password: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Phone"
                value={editAdminData.phone}
                onChange={e => setEditAdminData({ ...editAdminData, phone: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <input
                type="email"
                placeholder="Email"
                value={editAdminData.email}
                onChange={e => setEditAdminData({ ...editAdminData, email: e.target.value })}
                className="w-full mb-3 px-3 py-2 border rounded bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
              <div className="flex gap-3 mt-4">
                <button
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 rounded"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2 bg-primary text-white rounded"
                  onClick={async () => {
                    try {
                      await api.put(`/organizations/${orgId}/admin/${editAdmin._id}`, editAdminData);
                      setShowEditModal(false);
                      setEditAdmin(null);
                      setEditAdminData({ username: '', password: '', fullName: '', phone: '', email: '' });
                      fetchAdmins();
                    } catch (err: any) {
                      setError('Failed to update admin');
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationAdminsModal;
