
import { Group, Student, Homework, NotificationItem } from './types';

export const MOCK_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Math 101',
    room: 'Room 304',
    studentCount: 28,
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    days: ['Mon', 'Wed', 'Fri'],
    tag: 'Advanced',
    image: 'https://picsum.photos/seed/math1/400/500'
  },
  {
    id: '2',
    name: 'Geometry',
    room: 'Room 102',
    studentCount: 32,
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    days: ['Tue', 'Thu'],
    tag: 'Period 2',
    image: 'https://picsum.photos/seed/geo1/400/500'
  },
  {
    id: '3',
    name: 'Calculus',
    room: 'Room 210',
    studentCount: 18,
    startTime: '01:00 PM',
    endTime: '02:30 PM',
    days: ['Mon', 'Wed', 'Fri'],
    tag: 'AP Class',
    image: 'https://picsum.photos/seed/calc1/400/500'
  },
  {
    id: '4',
    name: 'Physics II',
    room: 'Lab B',
    studentCount: 24,
    startTime: '03:00 PM',
    endTime: '04:30 PM',
    days: ['Tue', 'Thu'],
    tag: 'Lab',
    image: 'https://picsum.photos/seed/phys1/400/500'
  }
];

export const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Ivanov Ivan Ivanovich', group: '10A', lastActive: '2m ago', online: true, avatar: 'https://picsum.photos/seed/ivan/100/100' },
  { id: '2', name: 'Petrov Petr Petrovich', group: '10B', lastActive: '1h ago', online: false, avatar: 'https://picsum.photos/seed/petr/100/100' },
  { id: '3', name: 'Sidorova Elena Sergeevna', group: '11A', lastActive: 'yesterday', online: false, avatar: 'https://picsum.photos/seed/elena/100/100' },
  { id: '4', name: 'Alexeev Sergey', group: '10A', lastActive: 'Invited', online: false },
  { id: '5', name: 'Kuznetsov Maxim', group: '11B', lastActive: '3h ago', online: false, avatar: 'https://picsum.photos/seed/maxim/100/100' }
];

export const MOCK_HOMEWORK: Homework[] = [
  { id: '1', title: 'Linear Equations Worksheet', subject: 'Math', dueDate: 'Due Tomorrow', status: 'New', description: 'Complete the attached worksheet on linear equations.', type: 'Assignment' },
  { id: '2', title: 'Photosynthesis Essay', subject: 'Biology', dueDate: 'In 3 days', status: 'Pending', description: 'Write a 500-word essay on the process of photosynthesis.', type: 'Essay' },
  { id: '3', title: 'Read Chapter 4-5 of To Kill a Mockingbird', subject: 'English', dueDate: 'In 5 days', status: 'Pending', description: 'Read and take notes for our discussion next week.', type: 'Reading' },
  { id: '4', title: 'History of Rome Quiz', subject: 'History', dueDate: 'Done Yesterday', status: 'Graded', score: 92, totalScore: 100, type: 'Quiz' }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'Algebra 101 Submission', description: 'uploaded a new assignment file for review.', time: '10m ago', type: 'submission', unread: true, user: 'Alice B.' },
  { id: '2', title: 'New Student Joined', description: 'has joined "Science 5A" group.', time: '1h ago', type: 'student', unread: true, user: 'Michael T.' },
  { id: '3', title: 'Maintenance Scheduled', description: 'System will be down for maintenance tonight from 2 AM to 4 AM.', time: '4h ago', type: 'system', unread: false, user: 'Admin' },
  { id: '4', title: 'Group Archived', description: 'Class "History 3B" was archived automatically due to inactivity.', time: 'Yesterday', type: 'system', unread: false, user: 'System' }
];
