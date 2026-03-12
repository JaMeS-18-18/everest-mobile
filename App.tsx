import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from './types';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import AdminTeachersView from './views/AdminTeachersView';
import AdminDashboardView from './views/AdminDashboardView';
import AdminTeacherDetailView from './views/AdminTeacherDetailView';
import AdminStudentsView from './views/AdminStudentsView';
import AdminAssistantTeachersView from './views/AdminAssistantTeachersView';
import AdminParentsView from './views/AdminParentsView';
import AdminGroupsView from './views/AdminGroupsView';
import AdminLayout from './components/AdminLayout';
import TeacherLayoutGuard from './components/TeacherLayoutGuard';
import GroupsView from './views/GroupsView';
import GroupDetailView from './views/GroupDetailView';
import StudentsView from './views/StudentsView';
import StudentProfileView from './views/StudentProfileView';
import TasksView from './views/TasksView';
import TaskDetailView from './views/TaskDetailView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SuperadminLayout from './components/SuperadminLayout';
import SuperadminDashboardView from './views/SuperadminDashboardView';
import SuperadminOrgDetailView from './views/SuperadminOrgDetailView';
import ParentHomeView from './views/ParentHomeView';
import ParentChildDetailView from './views/ParentChildDetailView';
import ParentBottomNav from './components/ParentBottomNav';
import SupportTeacherGroupsView from './views/SupportTeacherGroupsView';
import SupportTeacherScheduleView from './views/SupportTeacherScheduleView';
import StudentAppointmentView from './views/StudentAppointmentView';
import SupportTeacherAppointmentsView from './views/SupportTeacherAppointmentsView';
import AppHeader from './components/AppHeader';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });
  const [teacherMobileMenuOpen, setTeacherMobileMenuOpen] = useState(false);

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
      navigate('/admin/dashboard', { replace: true });
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
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden ${role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.TEACHER ? 'max-w-none w-full bg-[#f0f9fc] dark:bg-background-dark' : 'w-full max-w-full sm:max-w-md sm:mx-auto bg-background-light dark:bg-background-dark'}`}>
      {isLoggedIn && role !== UserRole.STUDENT && role !== UserRole.PARENT && (
        <AppHeader
          role={role}
          onOpenTeacherMenu={() => setTeacherMobileMenuOpen(true)}
          teacherMobileMenuOpen={teacherMobileMenuOpen}
        />
      )}
      <div className={`flex-1 ${isLoggedIn && role !== UserRole.STUDENT && role !== UserRole.PARENT ? 'md:pt-14' : ''}`}>
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
              <Route path="/superadmin" element={<SuperadminLayout onLogout={handleLogout} />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SuperadminDashboardView />} />
              <Route path="organizations/:orgId" element={<SuperadminOrgDetailView />} />
              <Route path="admins" element={<SuperadminAdminsView />} />
              <Route path="settings" element={<SettingsView role={role!} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />} />
              </Route>
              <Route path="/admin" element={<AdminLayout onLogout={handleLogout} />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardView />} />
              <Route path="students" element={<AdminStudentsView />} />
              <Route path="assistant-teachers" element={<AdminAssistantTeachersView />} />
              <Route path="parents" element={<AdminParentsView />} />
              <Route path="groups" element={<AdminGroupsView />} />
              <Route path="teachers" element={<AdminTeachersView />} />
              <Route path="teacher/:teacherId" element={<AdminTeacherDetailView />} />
              <Route path="teacher/:teacherId/group/:groupId" element={<GroupDetailView />} />
              <Route path="teacher/:teacherId/group/:groupId/student/:studentId" element={<StudentProfileView />} />
              <Route path="settings" element={<SettingsView role={role!} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />} />
              </Route>
              {/* Teacher: desktop = sidebar, mobile = hamburger in navbar (bottom nav olib tashlangan) */}
              <Route element={<TeacherLayoutGuard role={role} onLogout={handleLogout} teacherMobileMenuOpen={teacherMobileMenuOpen} setTeacherMobileMenuOpen={setTeacherMobileMenuOpen} />}>
                <Route path="/groups" element={<GroupsView />} />
                <Route path="/groups/:groupId" element={<GroupDetailView />} />
                <Route path="/students" element={<StudentsView />} />
                <Route path="/students/:studentId" element={<StudentProfileView />} />
                <Route path="/tasks" element={<TasksView />} />
                <Route path="/tasks/:taskId" element={<TaskDetailView />} />
                <Route path="/teacher/schedule" element={<TeacherScheduleView />} />
                <Route path="/notifications" element={<NotificationsView />} />
                <Route path="/settings" element={<SettingsView role={role!} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} onBack={() => navigate(role === UserRole.STUDENT ? '/student/home' : '/groups')} />} />
                <Route path="/grading" element={<GradingView />} />
              </Route>
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
      {/* Superadmin uses desktop layout with sidebar, no bottom nav */}
      {isLoggedIn && role === UserRole.PARENT && location.pathname.startsWith('/parent') && (
        <ParentBottomNav />
      )}
      {isLoggedIn && role === UserRole.SUPPORT_TEACHER && location.pathname.startsWith('/support') && (
        <BottomNav role={role} />
      )}
      {/* O'qituvchi: pastki menu yo'q; o'quvchi va boshqalar: bottom nav */}
      {isLoggedIn && role !== UserRole.SUPERADMIN && role !== UserRole.PARENT && role !== UserRole.SUPPORT_TEACHER && role !== UserRole.TEACHER && location.pathname !== '/login' && !location.pathname.startsWith('/student/homework') && !location.pathname.startsWith('/student/submit-homework') && (
        <BottomNav role={role || undefined} />
      )}
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="light" aria-label="Notifications" />
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
