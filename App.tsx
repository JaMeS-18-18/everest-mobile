
import React, { useState, useEffect } from 'react';
import { UserRole, View } from './types';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
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
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentView, setCurrentView] = useState<View>('LOGIN');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        const userRole = userData.role === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT;
        setRole(userRole);
        setCurrentView(userRole === UserRole.TEACHER ? 'GROUPS' : 'DASHBOARD');
      } catch (e) {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navigate = (view: View, id?: string) => {
    if (view === 'GROUP_DETAIL' && id) {
      setSelectedGroupId(id);
    }
    if (view === 'STUDENT_PROFILE' && id) {
      setSelectedStudentId(id);
    }
    if (view === 'TASK_DETAIL' && id) {
      setSelectedTaskId(id);
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    // Teacher goes to GROUPS, Student goes to DASHBOARD
    navigate(selectedRole === UserRole.TEACHER ? 'GROUPS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setRole(null);
    navigate('LOGIN');
  };

  const renderView = () => {
    switch (currentView) {
      case 'LOGIN':
        return <LoginView onLogin={handleLogin} />;
      case 'DASHBOARD':
        return <DashboardView role={role!} navigate={navigate} />;
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
      <div className="flex-1 pb-20">
        {renderView()}
      </div>
      {currentView !== 'LOGIN' && (
        <BottomNav role={role!} currentView={currentView} navigate={navigate} />
      )}
    </div>
  );
};

export default App;
