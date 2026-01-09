import React, { useEffect, useState } from 'react';
// Version is injected at build time from package.json
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
import { UserRole } from '../types';
import api from '../api';
import Loader from '@/components/Loader';

interface SettingsViewProps {
  role: UserRole;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onLogout: () => void;
  onBack: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  role: string;
  fullName: string;
  phone?: string;
  studentInfo?: any;
  email?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '');

const SettingsView: React.FC<SettingsViewProps> = ({ role, isDarkMode, setIsDarkMode, onLogout, onBack }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Restore dark mode from localStorage on mount
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode !== null) {
      setIsDarkMode(storedDarkMode === 'true');
    }
  }, [setIsDarkMode]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setProfile(response.data.user);
        }
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Save dark mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  const handleChangePassword = async () => {
    setIsChanging(true);
    setPasswordError(null);
    try {
      const response = await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      if (response.status === 200 && response.data.success) {
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        onLogout(); // Logout only if 200 and success
      } else {
        setPasswordError(response.data.message || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageError('File size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    setUploadingImage(true);
    setImageError(null);
    try {
      const fileInput = document.getElementById('profile-image-input') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) {
        setImageError('No file selected');
        setUploadingImage(false);
        return;
      }
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/auth/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success && response.data.url) {
        setImagePreview(null);
        setShowImageModal(false);
        setProfile((prev) => prev ? { ...prev, profileImage: response.data.url } : prev);
      } else {
        setImageError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      setImageError('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const getProfileImageUrl = (url: string | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black">
      {/* <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-4 pt-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-primary">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">Settings</h2>
        <div className="w-10"></div>
      </header> */}

      <div className="p-4 flex flex-col items-center py-8">
        <div className="relative mb-4 group cursor-pointer" onClick={() => setShowImageModal(true)}>
          <img 
            src={getProfileImageUrl(profile?.profileImage) || "https://media.istockphoto.com/id/2168774111/vector/avatar-or-person-sign-profile-picture-portrait-icon-user-profile-symbol.jpg?s=612x612&w=0&k=20&c=6qw1LRG53z00RXJnVKQC58W7XnW2gdQfGBIR43E97Oc="}
            className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-sm object-cover" 
            alt="Profile" 
          />
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </div>
        </div>
        <h3 className="text-xl font-bold">{profile?.fullName || '...'}</h3>
        <p className="text-sm text-slate-500">{profile?.role === UserRole.TEACHER ? 'Mathematics Teacher' : (profile?.studentInfo?.groupId?.name ? `${profile.studentInfo.groupId.name} • Student` : '')}</p>
        {/* <button className="mt-4 px-6 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm">Edit Profile</button> */}
      </div>

      <div className="px-4 space-y-6 pb-12">
        <section>
          <h4 className="px-2 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Account</h4>
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] align-middle">person</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Username</p>
              </div>
              <span className="text-sm text-slate-500">{profile?.username || '-'}</span>
            </div>
            <button
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
              onClick={() => setShowPasswordModal(true)}
            >
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Change Password</p>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
          </div>
        </section>

        <section>
          <h4 className="px-2 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Preferences</h4>
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {/* <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </div>
              <div className="flex-1 font-medium">Push Notifications</div>
              <div 
                onClick={() => {}} 
                className="w-12 h-6 bg-primary rounded-full relative cursor-pointer"
              >
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div> */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">dark_mode</span>
              </div>
              <div className="flex-1 font-medium">Dark Mode</div>
              <div 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isDarkMode ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h4 className="px-2 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Support</h4>
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            <a
              href="https://t.me/Pluto_18"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </div>
              <div className="flex-1 font-medium">Telegram</div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </a>
            <a
              href="tel:+998900292374"
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">call</span>
              </div>
              <div className="flex-1 font-medium">+998 90 029 23 74</div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </a>
          </div>
        </section>

        <button 
          onClick={onLogout}
          className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-red-500 font-bold rounded-xl active:bg-red-50 transition-colors"
        >
          Log Out
        </button>

        <div className="text-center text-[10px] text-slate-400 pb-8">
          Version {APP_VERSION}
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-bold mb-2">Change Password</h3>
            <label className="text-sm font-medium">Current Password</label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm pr-12"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowOldPassword(v => !v)}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined">
                  {showOldPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <label className="text-sm font-medium mt-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm pr-12"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowNewPassword(v => !v)}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined">
                  {showNewPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                onClick={() => setShowPasswordModal(false)}
                disabled={isChanging}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={handleChangePassword}
                disabled={isChanging || !oldPassword || !newPassword}
              >
                {isChanging && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-auto flex flex-col items-center border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-3 text-primary">Change Profile Image</h3>
            <input id="profile-image-input" type="file" accept="image/*" className="mb-3 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition" onChange={handleImageChange} disabled={uploadingImage} />
            {imagePreview && <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-primary/30 shadow" />}
            {imageError && <p className="text-xs text-red-500 mb-2 text-center">{imageError}</p>}
            <div className="flex gap-2 mt-2 w-full">
              <button className="flex-1 px-4 py-2 rounded-full bg-primary text-white font-bold shadow hover:bg-primary-dark transition disabled:opacity-50" onClick={handleUploadImage} disabled={uploadingImage}>{uploadingImage ? 'Uploading...' : 'Upload'}</button>
              <button className="flex-1 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold shadow hover:bg-slate-300 dark:hover:bg-slate-700 transition" onClick={() => { setShowImageModal(false); setImagePreview(null); setImageError(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
