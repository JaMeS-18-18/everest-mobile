import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SuperadminAdminsView: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users?role=admin');
      setAdmins(res.data.data || []);
    } catch (err: any) {
      setError('Failed to load admins');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Admins</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="w-full border rounded-xl overflow-hidden">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-3 text-left">Full Name</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Organization</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin._id} className="border-b">
                <td className="p-3 font-medium">{admin.fullName}</td>
                <td className="p-3">{admin.username}</td>
                <td className="p-3">{admin.phone}</td>
                <td className="p-3">{admin.email}</td>
                <td className="p-3">{admin.organizationId?.name || admin.organizationId || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SuperadminAdminsView;
