import React from 'react';
import { Goal, Completion } from '../types';
import { CATEGORY_DETAILS } from '../constants';

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  completion: Completion | null;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRevert: () => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  isOpen, onClose, goal, completion, onComplete, onEdit, onDelete, onRevert
}) => {
  if (!isOpen || !goal) return null;

  const { title, assignee, category, dueDate, dueTime, status } = goal;
  const isCompleted = status === 'completed';
  const categoryDetails = CATEGORY_DETAILS[category];

  const formattedDate = new Date(dueDate).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '시간 없음';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour % 12 || 12;
    return `${ampm} ${displayHour}:${minutes}`;
  };
  
  const completionInfo = completion ? 
    `${completion.completedBy}님이 ${new Date(completion.completedAt).toLocaleString('ko-KR')}에 완료했습니다.` : 
    "완료되었습니다.";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 md:items-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl md:rounded-2xl p-6 w-full max-w-md md:max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">목표 상세</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
            <span className="material-icons">close</span>
          </button>
        </header>
        
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span>담당자: <span className="font-semibold">{assignee}</span></span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${categoryDetails.color} ${categoryDetails.textColor}`}>{category}</span>
          </div>
          <p>마감일: <span className="font-semibold">{formattedDate} {formatTime(dueTime)}</span></p>
        </div>

        {isCompleted ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">{completionInfo}</p>
            <button onClick={onRevert} className="w-full p-3 bg-yellow-500 text-white rounded-lg font-semibold transition hover:bg-yellow-600 active:scale-95">다시 시작</button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={onComplete} className="sm:col-span-2 p-3 bg-green-500 text-white rounded-lg font-semibold transition hover:bg-green-600 active:scale-95">완료</button>
            <button onClick={onEdit} className="p-3 bg-yellow-500 text-white rounded-lg font-semibold transition hover:bg-yellow-600 active:scale-95">수정</button>
            <button onClick={onDelete} className="p-3 bg-red-500 text-white rounded-lg font-semibold transition hover:bg-red-600 active:scale-95">삭제</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalDetailModal;