import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from './types';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import AdminTeachersView from './views/AdminTeachersView';
import GroupsView from './views/GroupsView';
import GroupDetailView from './views/GroupDetailView';
import StudentsView from './views/StudentsView';
import StudentProfileView from './views/StudentProfileView';
import TasksView from './views/TasksView';
import TaskDetailView from './views/TaskDetailView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import CreateGroupView from './views/CreateGroupView';
import CreateStudentView from './views/CreateStudentView';
import SubmitHomeworkView from './views/SubmitHomeworkView';
import GradingView from './views/GradingView';
import StudentHomeView from './views/StudentHomeView';
import StudentHomeworkDetailView from './views/StudentHomeworkDetailView';
import BottomNav from './components/BottomNav';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  // Example: dark mode state (can be expanded as needed)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(() => {
    // Try to restore role from localStorage on reload
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'Admin') return UserRole.ADMIN;
        if (user.role === 'teacher' || user.role === 'Teacher') return UserRole.TEACHER;
        return UserRole.STUDENT;
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);



  // Simple login handler for demonstration (expand as needed)
  const handleLogin = (role: UserRole) => {
    setRole(role);
    if (role === UserRole.TEACHER) {
      navigate('/groups', { replace: true });
    } else if (role === UserRole.ADMIN) {
      navigate('/admin/teachers', { replace: true });
    } else {
      navigate('/student/home', { replace: true });
    }
  };

  // Logout handler
  const handleLogout = () => {
    setRole(null);
    localStorage.clear()
    // Optionally clear other session/localStorage items here
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginView onLogin={handleLogin} />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/admin/teachers" element={<AdminTeachersView />} />
          <Route path="/groups" element={<GroupsView />} />
          <Route path="/groups/:groupId" element={<GroupDetailView />} />
          <Route path="/groups/create" element={<CreateGroupView />} />
          <Route path="/students" element={<StudentsView />} />
          <Route path="/students/create" element={<CreateStudentView />} />
          <Route path="/students/:studentId" element={<StudentProfileView />} />
          <Route path="/tasks" element={<TasksView />} />
          <Route path="/tasks/:taskId" element={<TaskDetailView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/settings" element={<SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />} />
          <Route path="/grading" element={<GradingView />} />
          <Route path="/student/home" element={<StudentHomeView />} />
          <Route path="/student/homework/:homeworkId" element={<StudentHomeworkDetailView />} />
          <Route path="/student/submit-homework/:homeworkId" element={<SubmitHomeworkView />} />
        </Routes>
      </div>
      {/* TODO: Update BottomNav to use location.pathname for active state */}
      {location.pathname !== '/login' && location.pathname !== '/students/create' && location.pathname !== '/groups/create' && !location.pathname.startsWith('/student/homework') && !location.pathname.startsWith('/student/submit-homework') && (
        <BottomNav role={role || undefined} />
      )}
    </div>
  );
};

export default App;
