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
import StudentRankingView from './views/StudentRankingView';
import StudentScheduleView from './views/StudentScheduleView';
import TeacherScheduleView from './views/TeacherScheduleView';
import BottomNav from './components/BottomNav';
import SuperadminBottomNav from './components/SuperadminBottomNav';
import SuperadminAdminsView from './views/SuperadminAdminsView';
import 'react-toastify/dist/ReactToastify.css';
import SnowEffect from './components/SnowEffect';
import SuperadminDashboardView from './views/SuperadminDashboardView';
import ParentHomeView from './views/ParentHomeView';
import ParentChildDetailView from './views/ParentChildDetailView';
import ParentBottomNav from './components/ParentBottomNav';
import SupportTeacherGroupsView from './views/SupportTeacherGroupsView';
import SupportTeacherScheduleView from './views/SupportTeacherScheduleView';
import StudentAppointmentView from './views/StudentAppointmentView';
import SupportTeacherAppointmentsView from './views/SupportTeacherAppointmentsView';

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
        if (user.role === 'superadmin' || user.role === 'Superadmin') return UserRole.SUPERADMIN;
        else if (user.role === 'admin' || user.role === 'Admin') return UserRole.ADMIN;
        else if (user.role === 'teacher' || user.role === 'Teacher') return UserRole.TEACHER;
        else if (user.role === 'parent' || user.role === 'Parent') return UserRole.PARENT;
        else if (user.role === 'supportTeacher') return UserRole.SUPPORT_TEACHER;
        else return UserRole.STUDENT;
      } catch { }
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
    if (role === UserRole.SUPERADMIN) {
      navigate('/superadmin/dashboard', { replace: true });
    } else if (role === UserRole.TEACHER) {
      navigate('/groups', { replace: true });
    } else if (role === UserRole.ADMIN) {
      navigate('/admin/teachers', { replace: true });
    } else if (role === UserRole.PARENT) {
      navigate('/parent/home', { replace: true });
    } else if (role === UserRole.SUPPORT_TEACHER) {
      navigate('/support/groups', { replace: true }); // Support teacher goes to their groups view
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

  // If not logged in, only allow /login route
  const isLoggedIn = !!role;
  // Helper component to clear localStorage and redirect to /login
  const LoginRedirectClearStorage: React.FC = () => {
    useEffect(() => {
      localStorage.clear();
    }, []);
    return <Navigate to="/login" replace />;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-background-light dark:bg-background-dark overflow-x-hidden">
			<SnowEffect/>
      
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPageWithClearStorage onLogin={handleLogin} />} />
          {!isLoggedIn ? (
            // Not logged in: any route except /login redirects to /login
            <Route path="*" element={<LoginRedirectClearStorage />} />
          ) : (
            // Logged in: all app routes
            <>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/dashboard" element={<DashboardView />} />
              <Route path="/superadmin/dashboard" element={<SuperadminDashboardView />} />
              <Route path="/superadmin/admins" element={<SuperadminAdminsView />} />
              <Route path="/superadmin/settings" element={<SettingsView role={role!} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />} />
              <Route path="/admin/teachers" element={<AdminTeachersView />} />
              <Route path="/groups" element={<GroupsView />} />
              <Route path="/groups/:groupId" element={<GroupDetailView />} />
              <Route path="/groups/create" element={<CreateGroupView />} />
              <Route path="/students" element={<StudentsView />} />
              <Route path="/students/create" element={<CreateStudentView />} />
              <Route path="/students/:studentId" element={<StudentProfileView />} />
              <Route path="/tasks" element={<TasksView />} />
              <Route path="/tasks/:taskId" element={<TaskDetailView />} />
              <Route path="/teacher/schedule" element={<TeacherScheduleView />} />
              <Route path="/notifications" element={<NotificationsView />} />
              <Route path="/settings" element={<SettingsView role={role!} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />} />
              <Route path="/grading" element={<GradingView />} />
              <Route path="/student/home" element={<StudentHomeView />} />
              <Route path="/student/schedule" element={<StudentScheduleView />} />
              <Route path="/student/ranking" element={<StudentRankingView />} />
              <Route path="/student/appointment" element={<StudentAppointmentView />} />
              <Route path="/student/homework/:homeworkId" element={<StudentHomeworkDetailView />} />
              <Route path="/student/submit-homework/:homeworkId" element={<SubmitHomeworkView />} />
              {/* Parent routes */}
              <Route path="/parent/home" element={<ParentHomeView />} />
              <Route path="/parent/child/:studentId" element={<ParentChildDetailView />} />
              <Route path="/parent/settings" element={<SettingsView role={role!} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />} />
              {/* Support Teacher routes */}
              <Route path="/support/groups" element={<SupportTeacherGroupsView />} />
              <Route path="/support/schedule" element={<SupportTeacherScheduleView />} />
              <Route path="/support/appointments" element={<SupportTeacherAppointmentsView />} />
              <Route path="/support/settings" element={<SettingsView role={role!} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />} />
              {/* Catch-all route for unknown paths */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </div>
      {/* Always show bottom nav except for login, create student/group, and student homework/submit-homework */}
      {isLoggedIn && role === UserRole.SUPERADMIN && location.pathname.startsWith('/superadmin') && (
        <SuperadminBottomNav />
      )}
      {isLoggedIn && role === UserRole.PARENT && location.pathname.startsWith('/parent') && (
        <ParentBottomNav />
      )}
      {isLoggedIn && role === UserRole.SUPPORT_TEACHER && location.pathname.startsWith('/support') && (
        <BottomNav role={role} />
      )}
      {isLoggedIn && role !== UserRole.SUPERADMIN && role !== UserRole.PARENT && role !== UserRole.SUPPORT_TEACHER && location.pathname !== '/login' && location.pathname !== '/students/create' && location.pathname !== '/groups/create' && !location.pathname.startsWith('/student/homework') && !location.pathname.startsWith('/student/submit-homework') && (
        <BottomNav role={role || undefined} />
      )}
    </div>
  );
};

/**
 * Helper component to clear localStorage and render LoginView.
 */
const LoginPageWithClearStorage: React.FC<{ onLogin: (role: UserRole) => void }> = ({ onLogin }) => {
  useEffect(() => {
    localStorage.clear();
  }, []);
  return <LoginView onLogin={onLogin} />;
};

export default App;
