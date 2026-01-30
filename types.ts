

export enum UserRole {
  TEACHER = 'Teacher',
  STUDENT = 'Student',
  ADMIN = 'Admin',
  SUPERADMIN = 'superadmin',
  PARENT = 'parent',
  SUPPORT_TEACHER = 'supportTeacher'
}

export type View = 
  | 'LOGIN'
  | 'DASHBOARD'
  | 'STUDENT_HOME'
  | 'STUDENT_HOMEWORK_DETAIL'
  | 'STUDENT_SUBMIT_HOMEWORK'
  | 'GROUPS'
  | 'GROUP_DETAIL'
  | 'CREATE_GROUP'
  | 'STUDENTS'
  | 'CREATE_STUDENT'
  | 'STUDENT_PROFILE'
  | 'TASKS'
  | 'TASK_DETAIL'
  | 'CREATE_TASK'
  | 'SUBMIT_HOMEWORK'
  | 'GRADING'
  | 'NOTIFICATIONS'
  | 'SETTINGS'
  | 'ADMIN_TEACHERS';

export interface Group {
  id: string;
  name: string;
  room: string;
  studentCount: number;
  startTime: string;
  endTime: string;
  days: string[];
  tag: string;
  image: string;
}

export interface Student {
  id: string;
  name: string;
  group: string;
  lastActive: string;
  online: boolean;
  avatar?: string;
}

export interface Homework {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'New' | 'Pending' | 'Submitted' | 'Graded';
  score?: number;
  totalScore?: number;
  description?: string;
  type?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'submission' | 'student' | 'system' | 'homework' | 'grade';
  unread: boolean;
  user: string;
}
