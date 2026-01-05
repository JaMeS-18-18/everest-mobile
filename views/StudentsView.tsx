
import React, { useState, useEffect } from 'react';
import { View } from '../types';
import api from '../api';

interface GroupInfo {
  _id: string;
  name: string;
}

interface Student {
  _id: string;
  fullName: string;
  phone: string;
  username: string;
  groupId: GroupInfo;
  createdAt: string;
  updatedAt: string;
}

interface StudentsViewProps {
  navigate: (view: View, studentId?: string) => void;
}

const StudentsView: React.FC<StudentsViewProps> = ({ navigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      const data = response.data;
      
      if (data.success) {
        setStudents(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone.includes(searchQuery) ||
    student.groupId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error}</p>
        <button 
          onClick={fetchStudents}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 pt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">My Students</h2>
          <span className="text-sm text-primary font-medium">{students.length} total</span>
        </div>
      </header>

      <div className="p-4">
        <div className="relative flex items-center bg-white dark:bg-slate-800 h-12 rounded-xl shadow-sm px-4 border border-slate-200 dark:border-slate-800 mb-6">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Search by name, phone or group..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light">
            <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
            <p>No students found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map(student => (
              <div 
                key={student._id} 
                onClick={() => navigate('STUDENT_PROFILE', student._id)}
                className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate capitalize">{student.fullName}</p>
                  <p className="text-sm text-slate-500 truncate mt-0.5">
                    {student.groupId?.name ? (
                      <span className="capitalize">{student.groupId.name}</span>
                    ) : (
                      <span className="text-slate-400">No group</span>
                    )}
                    {' • '}{student.phone}
                  </p>
                </div>
                <a 
                  href={`tel:${student.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 right-4 z-30">
        <button 
          onClick={() => navigate('CREATE_STUDENT')}
          className="flex items-center gap-2 bg-primary text-white pl-4 pr-5 py-3 rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-bold">Add Student</span>
        </button>
      </div>
    </div>
  );
};

export default StudentsView;
