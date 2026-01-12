import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

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

interface Homework {
  _id: string;
  description: string;
  deadline: string;
  category: string;
  link?: string;
  teacherId: TeacherInfo;
  assignmentType: 'group' | 'individual';
  assignments: Assignment[];
  canSubmit: boolean;
  submission?: any;
}

interface TaskAnswer {
  assignmentId: string;
  text: string;
  files: File[];
  completed: boolean;
}

import { useParams, useNavigate } from 'react-router-dom';
import Loader from '@/components/Loader';

const SubmitHomeworkView: React.FC = () => {
  const { homeworkId } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskAnswers, setTaskAnswers] = useState<TaskAnswer[]>([]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<{[key: string]: string[]}>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchHomework();
  }, [homeworkId]);

  // Prefill from localStorage if present, else from homework
  // Helper: dataURL to File
  function dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
  }

  useEffect(() => {
    if (homework && homework.assignments.length > 0) {
      const saved = localStorage.getItem(`homework_answers_${homework._id}`);
      const savedPreviews = localStorage.getItem(`homework_previews_${homework._id}`);
      let previewsObj = {};
      if (savedPreviews) {
        try {
          previewsObj = JSON.parse(savedPreviews);
        } catch {}
      }
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === homework.assignments.length) {
            // If previews exist, convert to File[]
            const answersWithFiles = parsed.map((a: any) => {
              const previews = previewsObj[a.assignmentId] || [];
              const files = previews.map((url: string, idx: number) => dataURLtoFile(url, `image_${idx}.png`));
              return { ...a, files };
            });
            setTaskAnswers(answersWithFiles);
            setPreviewImages(previewsObj);
            return;
          }
        } catch {}
      }
      setTaskAnswers(
        homework.assignments.map(a => ({
          assignmentId: a._id,
          text: '',
          files: [],
          completed: false
        }))
      );
      setPreviewImages({});
    }
  }, [homework]);

  const fetchHomework = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/homework/${homeworkId}`);
      const data = response.data;
      
      if (data.success) {
        // Check if submission is allowed
        if (!data.data.canSubmit) {
          if (data.data.submission) {
            setError('You have already submitted this homework');
          } else {
            setError('The deadline for this homework has passed');
          }
          return;
        }
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

  const handleSubmitAll = async () => {
    // Only include answers that have content (text or files)
    const answersWithContent = taskAnswers.filter(a => a.text.trim() || a.files.length > 0);
    
    if (answersWithContent.length === 0) {
      alert('Please answer at least one task');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Only send answers that have actual content
      answersWithContent.forEach((answer, index) => {
        formData.append(`answers[${index}][assignmentId]`, answer.assignmentId);
        formData.append(`answers[${index}][textContent]`, answer.text);
        answer.files.forEach(file => {
          formData.append(`answers[${index}][files]`, file);
        });
      });

      const response = await api.post(`/homework/${homeworkId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Remove localStorage data after successful submit
        localStorage.removeItem(`homework_answers_${homeworkId}`);
        localStorage.removeItem(`homework_previews_${homeworkId}`);
        navigate(-1); // Go back to previous page or use navigate('/some-path') if you want a specific route
      } else {
        throw new Error(response.data.message || 'Failed to submit homework');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTaskAnswer = (assignmentId: string, field: 'text' | 'files', value: string | File[]) => {
    setTaskAnswers(prev => prev.map(a => 
      a.assignmentId === assignmentId 
        ? { ...a, [field]: value }
        : a
    ));
  };

  // Helper to convert File to data URL
  const fileToDataURL = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const markTaskComplete = async (index: number) => {
    const answer = taskAnswers[index];
    if (answer.text.trim() || answer.files.length > 0) {
      const updated = taskAnswers.map((a, i) => i === index ? { ...a, completed: true } : a);
      setTaskAnswers(updated);
      // Save to localStorage (without files)
      localStorage.setItem(`homework_answers_${homework?._id}`, JSON.stringify(updated.map(({ files, ...rest }) => rest)));

      // Save previews (images) to localStorage
      const previewsToSave = { ...previewImages };
      const assignmentId = answer.assignmentId;
      if (answer.files.length > 0) {
        // Only update for this assignment
        previewsToSave[assignmentId] = await Promise.all(answer.files.map(file => fileToDataURL(file)));
      }
      localStorage.setItem(`homework_previews_${homework?._id}`, JSON.stringify(previewsToSave));

      setSelectedTaskIndex(null);
    } else {
      alert('Please write an answer or upload a file');
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files || selectedTaskIndex === null) return;
    const assignmentId = taskAnswers[selectedTaskIndex].assignmentId;
    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    let errorMsg = '';

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        errorMsg = 'Only image files are allowed!';
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        errorMsg = 'The image size must not exceed 4MB!';
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    setPreviewImages(prev => ({
      ...prev,
      [assignmentId]: [...(prev[assignmentId] || []), ...newPreviews]
    }));

    setTaskAnswers(prev => prev.map(a =>
      a.assignmentId === assignmentId
        ? { ...a, files: [...a.files, ...validFiles] }
        : a
    ));
  };

  const removeFile = (fileIndex: number) => {
    if (selectedTaskIndex === null) return;
    const assignmentId = taskAnswers[selectedTaskIndex].assignmentId;
    
    // Revoke old preview URL
    const oldPreviews = previewImages[assignmentId] || [];
    if (oldPreviews[fileIndex]) {
      URL.revokeObjectURL(oldPreviews[fileIndex]);
    }
    
    setPreviewImages(prev => ({
      ...prev,
      [assignmentId]: (prev[assignmentId] || []).filter((_, i) => i !== fileIndex)
    }));
    
    setTaskAnswers(prev => prev.map(a =>
      a.assignmentId === assignmentId
        ? { ...a, files: a.files.filter((_, i) => i !== fileIndex) }
        : a
    ));
  };

  const getImagePreview = (file: File, index: number): string => {
    if (selectedTaskIndex === null) return '';
    const assignmentId = taskAnswers[selectedTaskIndex]?.assignmentId;
    const previews = previewImages[assignmentId] || [];
    return previews[index] || URL.createObjectURL(file);
  };

  const getCompletedCount = () => taskAnswers.filter(a => a.completed).length;
  const getTotalTasks = () => homework?.assignments.length || 0;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // fallback to raw string if invalid
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

  if (isLoading) {
    return <Loader />;
  }

  const onBack = () => navigate(-1);

  if (error || !homework) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <p className="text-red-500 text-center">{error || 'Homework not found'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Orqaga
        </button>
      </div>
    );
  }

  const selectedTask = selectedTaskIndex !== null ? homework.assignments[selectedTaskIndex] : null;
  const selectedAnswer = selectedTaskIndex !== null ? taskAnswers[selectedTaskIndex] : null;

  return (
    <div className="flex flex-col h-full min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background-light dark:bg-background-dark p-4 pt-12 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">Submit Homework</h1>
          <div className="w-10"></div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(getCompletedCount() / getTotalTasks()) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-primary">
            {getCompletedCount()}/{getTotalTasks()}
          </span>
        </div>
      </div>

      {/* Task Selection View (when no task selected) */}
      {selectedTaskIndex === null && (
        <div className="flex-1 px-4 pb-32 overflow-y-auto">
          {/* Homework Info */}
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 mt-4 mb-4 border border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-lg mb-2">{homework.description}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Deadline: {formatDate(homework.deadline)}</span>
            </div>
          </div>

          {/* Task List Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">Tasks</h3>
            <span className="text-sm text-slate-500">{getTotalTasks()} tasks</span>
          </div>

          {/* Numbered Task Grid */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {homework.assignments.map((assignment, index) => {
              const answer = taskAnswers[index];
              const hasAnswer = answer?.text.trim() || (answer?.files.length || 0) > 0;
              const isComplete = answer?.completed || hasAnswer;
              const imageCount = answer?.files.filter(f => f.type.startsWith('image/')).length || 0;
              
              return (
                <button
                  key={assignment._id}
                  onClick={() => setSelectedTaskIndex(index)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${
                    isComplete
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700'
                      : 'bg-card-light dark:bg-card-dark border-2 border-slate-200 dark:border-slate-700 hover:border-primary'
                  }`}
                >
                  <span className={`text-2xl font-bold ${isComplete ? 'text-green-600' : ''}`}>
                    {index + 1}
                  </span>
                  {isComplete && (
                    <span className="material-symbols-outlined text-[16px] text-green-500 mt-1">check_circle</span>
                  )}
                  {imageCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {imageCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Task List Details */}
          <div className="space-y-3">
            {homework.assignments.map((assignment, index) => {
              const answer = taskAnswers[index];
              const hasAnswer = answer?.text.trim() || (answer?.files.length || 0) > 0;
              const isComplete = answer?.completed || hasAnswer;
              const imageCount = answer?.files.filter(f => f.type.startsWith('image/')).length || 0;
              
              return (
                <button
                  key={assignment._id}
                  onClick={() => setSelectedTaskIndex(index)}
                  className={`w-full text-left bg-card-light dark:bg-card-dark rounded-xl p-4 border-2 transition-all ${
                    isComplete
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1">{assignment.name}</h4>
                      <div className="flex items-center flex-wrap gap-2 text-sm text-slate-500">
                        {assignment.images.length > 0 && (
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs">
                            <span className="material-symbols-outlined text-[14px]">image</span>
                            {assignment.images.length} attached
                          </span>
                        )}
                        {imageCount > 0 && (
                          <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                            <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                            {imageCount} uploaded
                          </span>
                        )}
                        {isComplete ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Completed
                          </span>
                        ) : (
                          <span className="text-orange-500">Pending</span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Detail View (when task selected) */}
      {selectedTaskIndex !== null && selectedTask && selectedAnswer && (
        <div className="flex-1 px-4 pb-32 overflow-y-auto">
          {/* Task Navigation */}
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => setSelectedTaskIndex(selectedTaskIndex > 0 ? selectedTaskIndex - 1 : null)}
              disabled={selectedTaskIndex === 0}
              className="flex items-center gap-1 text-primary disabled:text-slate-300"
            >
              <span className="material-symbols-outlined">chevron_left</span>
              <span className="text-sm font-medium">Previous</span>
            </button>
            
            <span className="text-lg font-bold">Task {selectedTaskIndex + 1}</span>
            
            <button
              onClick={() => setSelectedTaskIndex(selectedTaskIndex < getTotalTasks() - 1 ? selectedTaskIndex + 1 : null)}
              disabled={selectedTaskIndex >= getTotalTasks() - 1}
              className="flex items-center gap-1 text-primary disabled:text-slate-300"
            >
              <span className="text-sm font-medium">Next</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Task Info Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 mb-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {selectedTaskIndex + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{selectedTask.name}</h3>
                <p className="text-sm text-slate-500">
                  {selectedTask.images.length > 0 
                    ? `${selectedTask.images.length} images attached`
                    : 'No additional materials'
                  }
                </p>
              </div>
            </div>

            {/* Teacher's images */}
            {selectedTask.images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-slate-600">Teacher's images:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTask.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
                    >
                      <img 
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Answer Section */}
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Your answer
            </h4>

            {/* Text Answer */}
            <textarea
              value={selectedAnswer.text}
              onChange={(e) => updateTaskAnswer(selectedAnswer.assignmentId, 'text', e.target.value)}
              placeholder="Write your answer here..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[120px]"
            />

            {/* Image Upload Section */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">photo_library</span>
                Images ({selectedAnswer.files.filter(f => f.type.startsWith('image/')).length})
              </p>

              {/* Image Grid */}
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Uploaded Images */}
                {/* Show previewImages if files are empty (after reload) */}
                {(selectedAnswer.files.length > 0
                  ? selectedAnswer.files.map((file, fileIdx) => (
                      file.type.startsWith('image/') && (
                        <div key={fileIdx} className="relative w-16 h-16 group">
                          <img 
                            src={getImagePreview(file, fileIdx)}
                            alt="" 
                            className="w-16 h-16 object-cover rounded-lg"
                            onClick={() => setSelectedImage(getImagePreview(file, fileIdx))}
                          />
                          <button
                            onClick={() => removeFile(fileIdx)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <span className="material-symbols-outlined text-[12px]">close</span>
                          </button>
                          <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/50 rounded text-[9px] text-white">
                            {(file.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      )
                    ))
                  : (previewImages[selectedAnswer.assignmentId] || []).map((url, fileIdx) => (
                      <div key={fileIdx} className="relative w-16 h-16 group">
                        <img 
                          src={url}
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg"
                          onClick={() => setSelectedImage(url)}
                        />
                      </div>
                    ))
                )}
                
                {/* Add Image Buttons */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl text-slate-400">add_photo_alternate</span>
                  <span className="text-[9px] text-slate-400">Gallery</span>
                </button>
                
                {/* <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-primary/50 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl text-primary">photo_camera</span>
                  <span className="text-[10px] text-primary">Kamera</span>
                </button> */}
              </div>

              {/* Hidden File Inputs */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
                accept="image/*"
              />
              
              <input
                type="file"
                ref={cameraInputRef}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
                accept="image/*"
                capture="environment"
              />
            </div>

            {/* Non-image files (should never show, but kept for safety) */}
            {selectedAnswer.files.filter(f => !f.type.startsWith('image/')).length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-red-600">Faqat rasm fayllar yuklanadi. Boshqa fayllar avtomatik olib tashlanadi.</p>
              </div>
            )}

            {/* Add Document Button */}
            {/* <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.doc,.docx';
                input.multiple = true;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  addFiles(target.files);
                };
                input.click();
              }}
              className="mt-3 w-full py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
              Hujjat biriktirish (PDF, DOC)
            </button> */}
          </div>

          {/* Complete Task Button */}
          <button
            onClick={() => markTaskComplete(selectedTaskIndex)}
            disabled={!selectedAnswer.text.trim() && selectedAnswer.files.length === 0}
            className="w-full mt-4 py-4 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">check_circle</span>
            Complete Task
          </button>
        </div>
      )}

      {/* Submit All Button (fixed at bottom) */}
      {selectedTaskIndex === null && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent pt-8">
          <button
            onClick={handleSubmitAll}
            disabled={isSubmitting || getCompletedCount() !== getTotalTasks()}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                Submitting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">send</span>
                Submit All ({getCompletedCount()}/{getTotalTasks()})
              </>
            )}
          </button>
        </div>
      )}

      {/* Back to tasks button when editing */}
      {selectedTaskIndex !== null && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent pt-8">
          <button
            onClick={() => setSelectedTaskIndex(null)}
            className="w-full py-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">grid_view</span>
            View All Tasks
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

export default SubmitHomeworkView;
