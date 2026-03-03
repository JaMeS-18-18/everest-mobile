import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

interface Teacher {
  _id: string;
  fullName: string;
  username: string;
  phone?: string;
  createdAt?: string;
}

interface Group {
  _id: string;
  name: string;
  studentCount?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: string[];
}

interface Admin {
  _id: string;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
}

interface OrgDetail {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  plan?: 'basic' | 'premium' | 'platinum';
  teacherCount: number;
  studentCount: number;
  groupCount: number;
  teachers?: Teacher[];
  groups?: Group[];
  admins?: Admin[];
}

const SuperadminOrgDetailView: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId) fetchOrg();
  }, [orgId]);

  const fetchOrg = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await api.get(`/organizations/${orgId}`);
      setOrg(res.data);
    } catch (err) {
      toast.error('Failed to load organization');
      navigate('/superadmin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background-light dark:bg-background-dark py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/superadmin/dashboard')}
            className="w-10 h-10 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-text-primary-light dark:text-text-primary-dark">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark truncate flex-1">
            {org.name}
          </h1>
        </div>

        {/* Info card */}
        <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark mb-4">
          {org.address && (
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-xl">location_on</span>
              <span className="text-text-primary-light dark:text-text-primary-dark">{org.address}</span>
            </div>
          )}
          {org.phone && (
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-xl">call</span>
              <a href={`tel:${org.phone}`} className="text-primary font-medium">{org.phone}</a>
            </div>
          )}
          {org.plan && (
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-xl">sell</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark capitalize">{org.plan}</span>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                ({org.plan === 'basic' ? '$19' : org.plan === 'premium' ? '$39' : '$59'})
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{org.teacherCount}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Teachers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{org.studentCount}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{org.groupCount}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Groups</p>
            </div>
          </div>
        </div>

        {/* Admins */}
        {org.admins && org.admins.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-2">Admins</h2>
            <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
              {org.admins.map((a) => (
                <div key={a._id} className="px-4 py-3 border-b border-border-light dark:border-border-dark last:border-0 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{a.fullName}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{a.username}{a.phone ? ` · ${a.phone}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teachers */}
        {org.teachers && org.teachers.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-2">Teachers</h2>
            <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
              {org.teachers.map((t) => (
                <div key={t._id} className="px-4 py-3 border-b border-border-light dark:border-border-dark last:border-0 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">school</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{t.fullName}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{t.username}{t.phone ? ` · ${t.phone}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups */}
        {org.groups && org.groups.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-2">Groups</h2>
            <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
              {org.groups.map((g) => (
                <div key={g._id} className="px-4 py-3 border-b border-border-light dark:border-border-dark last:border-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">folder</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{g.name}</p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {g.studentCount ?? 0} students{g.startTime && g.endTime ? ` · ${g.startTime}-${g.endTime}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/superadmin/dashboard')}
            className="flex-1 py-3 rounded-xl border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark font-medium"
          >
            Back to list
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperadminOrgDetailView;
