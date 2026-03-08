import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserRole } from '../types';
import TeacherLayout from './TeacherLayout';

interface TeacherLayoutGuardProps {
  role: UserRole | null;
  onLogout?: () => void;
  teacherMobileMenuOpen?: boolean;
  setTeacherMobileMenuOpen?: (open: boolean) => void;
}

/**
 * On desktop (md+) teachers see TeacherLayout with sidebar.
 * On mobile: sidebar ochiladi navbar hamburger orqali (pastki menu yo'q).
 */
const TeacherLayoutGuard: React.FC<TeacherLayoutGuardProps> = ({ role, onLogout, teacherMobileMenuOpen = false, setTeacherMobileMenuOpen }) => {
  if (role === UserRole.TEACHER) {
    return (
      <TeacherLayout
        onLogout={onLogout}
        mobileMenuOpen={teacherMobileMenuOpen}
        setMobileMenuOpen={setTeacherMobileMenuOpen || (() => {})}
      />
    );
  }
  return <Outlet />;
};

export default TeacherLayoutGuard;
