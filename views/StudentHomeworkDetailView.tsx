
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { View } from '@/types';

// Helper to get correct image URL (Cloudinary or legacy)
function getImageUrl(img: { path?: string; url?: string }) {
  if (img.path && img.path.startsWith('http')) return img.path;
  if (img.url && img.url.startsWith('http')) return img.url;
  if (img.path) return img.path;
  if (img.url) return img.url;
  return '';
}

interface ImageFile {
  filename: string;
  url: string;
  mimetype?: string;
  size?: number;
}

interface Assignment {
  _id: string;
  name: string;
  images: ImageFile[];
}

interface TeacherInfo {
  _id: string;
  fullName: string;
}

interface SubmissionAnswer {
  assignmentId: string;
  assignmentName?: string;
  textContent?: string;
  files: ImageFile[];
}

interface Submission {
  _id: string;
  answers: SubmissionAnswer[];
  submittedAt: string;
  status?: 'pending' | 'Worse' | 'Bad' | 'Good' | 'Better' | 'Perfect';
  teacherComment?: string;
  reviewedAt?: string;
}

interface Homework {
  _id: string;
  description: string;
  deadline: string;
  category: string;
  link?: string;
  teacherId: TeacherInfo;
  assignmentType: 'group' | 'individual';
  assignments: Assignment[];
  submission: Submission | null;
  canSubmit: boolean;
}


const StudentHomeworkDetailView: React.FC = () => {
  const { homeworkId } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const onBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchHomework();
  }, [homeworkId]);

  const fetchHomework = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/homework/${homeworkId}`);
      const data = response.data;

      if (data.success) {
        setHomework(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch homework');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch homework');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PHOTO':
        return 'photo_library';
      case 'VIDEO':
        return 'videocam';
      case 'AUDIO':
        return 'mic';
      case 'DOCUMENT':
        return 'description';
      default:
        return 'assignment';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error || 'Homework not found'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isSubmitted = homework.submission !== null;
  const overdue = !isSubmitted && isOverdue(homework.deadline);
  const totalImages = homework.assignments.reduce((acc, a) => acc + a.images.length, 0);

  // Calculate statusConfig once so it's available for both status banner and teacher comment
  const submissionStatus = homework.submission?.status;
  const isWorse = submissionStatus === 'Worse';
  const isBad = submissionStatus === 'Bad';
  const isGood = submissionStatus === 'Good';
  const isBetter = submissionStatus === 'Better';
  const isPerfect = submissionStatus === 'Perfect';
  const isPendingReview = isSubmitted && !isWorse && !isBad && !isGood && !isBetter && !isPerfect;

  let statusConfig = {
    bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600',
    textColor: 'text-orange-700',
    subTextColor: 'text-orange-600',
    icon: 'pending',
    title: 'Pending',
    subtitle: `Deadline: ${formatDate(homework.deadline)}`
  };

  if (isWorse) {
    statusConfig = {
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      subTextColor: 'text-red-600',
      icon: 'sentiment_very_dissatisfied',
      title: 'Worse',
      subtitle: homework.submission?.reviewedAt ? `Reviewed: ${formatDate(homework.submission.reviewedAt)}` : ''
    };
  } else if (isBad) {
    statusConfig = {
      bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700',
      subTextColor: 'text-orange-600',
      icon: 'sentiment_dissatisfied',
      title: 'Bad',
      subtitle: homework.submission?.reviewedAt ? `Reviewed: ${formatDate(homework.submission.reviewedAt)}` : ''
    };
  } else if (isGood) {
    statusConfig = {
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
      subTextColor: 'text-blue-600',
      icon: 'sentiment_satisfied',
      title: 'Good',
      subtitle: homework.submission?.reviewedAt ? `Reviewed: ${formatDate(homework.submission.reviewedAt)}` : ''
    };
  } else if (isBetter) {
    statusConfig = {
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
      subTextColor: 'text-green-600',
      icon: 'sentiment_very_satisfied',
      title: 'Better',
      subtitle: homework.submission?.reviewedAt ? `Reviewed: ${formatDate(homework.submission.reviewedAt)}` : ''
    };
  } else if (isPerfect) {
    statusConfig = {
      bg: 'bg-yellow-50 dark:bg-yellow-300/20 border-yellow-200 dark:border-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-300/40',
      iconColor: 'text-yellow-700',
      textColor: 'text-yellow-700',
      subTextColor: 'text-yellow-700',
      icon: 'star',
      title: 'Perfect',
      subtitle: homework.submission?.reviewedAt ? `Reviewed: ${formatDate(homework.submission.reviewedAt)}` : ''
    };
  } else if (isPendingReview) {
    statusConfig = {
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
      subTextColor: 'text-blue-600',
      icon: 'hourglass_top',
      title: 'Under Review',
      subtitle: `Submitted: ${formatDate(homework.submission?.submittedAt || '')}`
    };
  } else if (overdue) {
    statusConfig = {
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      subTextColor: 'text-red-600',
      icon: 'warning',
      title: 'Overdue',
      subtitle: `Deadline: ${formatDate(homework.deadline)}`
    };
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background-light dark:bg-background-dark p-4 pt-12">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">Homework Details</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-32 overflow-y-auto">
        {/* Status Banner */}
        <div className={`rounded-2xl p-4 mb-4 border ${statusConfig.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig.iconBg}`}>
              <span className={`material-symbols-outlined text-2xl ${statusConfig.iconColor}`}>
                {statusConfig.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className={`font-bold ${statusConfig.textColor}`}>{statusConfig.title}</p>
              <p className={`text-sm ${statusConfig.subTextColor}`}>{statusConfig.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Teacher Feedback */}
        {homework.submission?.teacherComment && (
          <div className={`rounded-2xl p-4 mb-4 border ${statusConfig.bg}`}>
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined text-xl ${statusConfig.iconColor}`}>
                comment
              </span>
              <div>
                <p className={`font-semibold text-sm mb-1 ${statusConfig.textColor}`}>
                  Teacher's Comment:
                </p>
                <p className={`text-sm ${statusConfig.textColor}`}>
                  {homework.submission.teacherComment}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Info */}
        <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">{getCategoryIcon(homework.category)}</span>
            </div>
            <div className="flex-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 mb-2 inline-block">
                {homework.category}
              </span>
              <h2 className="text-lg font-bold">{homework.description}</h2>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-[20px] text-slate-400">person</span>
              <span className="text-slate-600 dark:text-slate-400">Teacher:</span>
              <span className="font-medium">{homework.teacherId?.fullName || 'Unknown'}</span>
            </div>
            {/* <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-[20px] text-slate-400">event</span>
              <span className="text-slate-600 dark:text-slate-400">Deadline:</span>
              <span className={`font-medium ${overdue && !isSubmitted ? 'text-red-500' : ''}`}>
                {formatDate(homework.deadline)}
              </span>
            </div> */}
            {homework.link && (
              <a
                href={homework.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[20px]">link</span>
                <span className="truncate">{homework.link}</span>
              </a>
            )}
          </div>
        </div>

        {/* My Submission */}
        {isSubmitted && homework.submission && (
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              My Submission
            </h3>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 mb-3">
                Submitted on {formatDate(homework.submission.submittedAt)}
              </p>
              {homework.submission.answers && homework.submission.answers.length > 0 && (
                <div className="space-y-3">
                  {homework.submission.answers.map((answer, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">Task {idx + 1}</p>
                      {answer.textContent && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{answer.textContent}</p>
                      )}
                      {answer.files && answer.files.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {answer.files.map((file, fileIdx) => (
                            <button
                              key={fileIdx}
                              onClick={() => setSelectedImage(getImageUrl(file))}
                              className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700"
                            >
                              <img
                                src={getImageUrl(file)}
                                alt=""
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignments from Teacher */}
        {homework.assignments.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-3">Tasks ({homework.assignments.length})</h3>
            <div className="space-y-3">
              {homework.assignments.map((assignment, index) => (
                <div
                  key={assignment._id}
                  className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold flex-1">{assignment.name}</h4>
                  </div>
                  {assignment.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {assignment.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(getImageUrl(img))}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
                        >
                          <img
                            src={getImageUrl(img)}
                            alt=""
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {homework.canSubmit && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent pt-8">
          <button
            onClick={() => navigate(`/student/submit-homework/${homeworkId}`)}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">upload_file</span>
            Submit Homework ({homework.assignments.length} tasks)
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img
            src={selectedImage}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default StudentHomeworkDetailView;
