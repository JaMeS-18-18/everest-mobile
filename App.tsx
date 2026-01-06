import React, { useState, useEffect } from 'react';
import { UserRole, View } from './types';
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
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = localStorage.getItem('currentView');
    return saved ? (saved as View) : 'LOGIN';
  });
  // Dark mode state from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedGroupId');
    return saved || null;
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedStudentId');
    return saved || null;
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedTaskId');
    return saved || null;
  });
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedHomeworkId');
    return saved || null;
  });

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        let userRole: UserRole = UserRole.STUDENT;
        if (userData.role === 'teacher') userRole = UserRole.TEACHER;
        if (userData.role === 'admin') userRole = UserRole.ADMIN;
        setRole(userRole);
        setCurrentView((prev) => {
          if (prev === 'LOGIN') {
            if (userRole === UserRole.TEACHER) return 'GROUPS';
            if (userRole === UserRole.ADMIN) return 'ADMIN_TEACHERS';
            return 'STUDENT_HOME';
          }
          return prev;
        });
        // Restore selected IDs for detail views
        const savedView = localStorage.getItem('currentView');
        if (savedView === 'GROUP_DETAIL') {
          const savedGroupId = localStorage.getItem('selectedGroupId');
          if (savedGroupId) setSelectedGroupId(savedGroupId);
        }
        if (savedView === 'STUDENT_PROFILE') {
          const savedStudentId = localStorage.getItem('selectedStudentId');
          if (savedStudentId) setSelectedStudentId(savedStudentId);
        }
        if (savedView === 'TASK_DETAIL') {
          const savedTaskId = localStorage.getItem('selectedTaskId');
          if (savedTaskId) setSelectedTaskId(savedTaskId);
        }
        if (savedView === 'STUDENT_HOMEWORK_DETAIL') {
          const savedHomeworkId = localStorage.getItem('selectedHomeworkId');
          if (savedHomeworkId) setSelectedHomeworkId(savedHomeworkId);
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Persist dark mode to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navigate = (view: View, id?: string) => {
    if (view === 'GROUP_DETAIL' && id) {
      setSelectedGroupId(id);
      localStorage.setItem('selectedGroupId', id);
    }
    if (view === 'STUDENT_PROFILE' && id) {
      setSelectedStudentId(id);
      localStorage.setItem('selectedStudentId', id);
    }
    if (view === 'TASK_DETAIL' && id) {
      setSelectedTaskId(id);
      localStorage.setItem('selectedTaskId', id);
    }
    if (view === 'STUDENT_HOMEWORK_DETAIL' && id) {
      setSelectedHomeworkId(id);
      localStorage.setItem('selectedHomeworkId', id);
    }
    if (view === 'STUDENT_SUBMIT_HOMEWORK' && id) {
      setSelectedHomeworkId(id);
      localStorage.setItem('selectedHomeworkId', id);
    }
    setCurrentView(view);
    localStorage.setItem('currentView', view);
    window.scrollTo(0, 0);
  };

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    // Teacher goes to GROUPS, Student goes to STUDENT_HOME, Admin goes to ADMIN_TEACHERS
    if (selectedRole === UserRole.TEACHER) navigate('GROUPS');
    else if (selectedRole === UserRole.ADMIN) navigate('ADMIN_TEACHERS');
    else navigate('STUDENT_HOME');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setRole(null);
    navigate('LOGIN');
  };

  const renderView = () => {
    switch (currentView) {
            case 'ADMIN_TEACHERS':
              return <AdminTeachersView />;
      case 'LOGIN':
        return <LoginView onLogin={handleLogin} />;
      case 'DASHBOARD':
        return <DashboardView role={role!} navigate={navigate} />;
      case 'STUDENT_HOME':
        return <StudentHomeView navigate={navigate} />;
      case 'STUDENT_HOMEWORK_DETAIL':
        return <StudentHomeworkDetailView homeworkId={selectedHomeworkId!} navigate={navigate} onBack={() => navigate('STUDENT_HOME')} />;
      case 'STUDENT_SUBMIT_HOMEWORK':
        return <SubmitHomeworkView homeworkId={selectedHomeworkId!} onBack={() => navigate('STUDENT_HOMEWORK_DETAIL', selectedHomeworkId!)} onSuccess={() => navigate('STUDENT_HOMEWORK_DETAIL', selectedHomeworkId!)} />;
      case 'GROUPS':
        return <GroupsView navigate={navigate} />;
      case 'GROUP_DETAIL':
        return <GroupDetailView groupId={selectedGroupId!} navigate={navigate} onBack={() => navigate('GROUPS')} />;
      case 'CREATE_GROUP':
        return <CreateGroupView onBack={() => navigate('GROUPS')} />;
      case 'STUDENTS':
        return <StudentsView navigate={navigate} />;
      case 'CREATE_STUDENT':
        return <CreateStudentView onBack={() => navigate('STUDENTS')} />;
      case 'STUDENT_PROFILE':
        return <StudentProfileView studentId={selectedStudentId!} onBack={() => navigate('STUDENTS')} navigate={navigate} />;
      case 'TASKS':
        return <TasksView navigate={navigate} />;
      case 'TASK_DETAIL':
        return <TaskDetailView taskId={selectedTaskId!} navigate={navigate} onBack={() => navigate('TASKS')} />;
      case 'SUBMIT_HOMEWORK':
        return <SubmitHomeworkView onBack={() => navigate('DASHBOARD')} />;
      case 'GRADING':
        return <GradingView onBack={() => navigate('STUDENT_PROFILE')} />;
      case 'NOTIFICATIONS':
        return <NotificationsView role={role!} onBack={() => navigate('DASHBOARD')} />;
      case 'SETTINGS':
        return (
          <SettingsView 
            role={role!} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            onLogout={handleLogout} 
            onBack={() => navigate('DASHBOARD')} 
          />
        );
      default:
        return <DashboardView role={role!} navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex-1">
        {renderView()}
      </div>
      {currentView !== 'LOGIN' && currentView !== 'CREATE_STUDENT' && currentView !== 'CREATE_GROUP' && currentView !== 'STUDENT_HOMEWORK_DETAIL' && currentView !== 'STUDENT_SUBMIT_HOMEWORK' && (
        <BottomNav role={role!} currentView={currentView} navigate={navigate} />
      )}
    </div>
  );
};

export default App;
