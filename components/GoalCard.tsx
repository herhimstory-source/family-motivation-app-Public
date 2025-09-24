
import React from 'react';
import { Goal } from '../types';
import { USER_DETAILS, CATEGORY_DETAILS } from '../constants';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const { title, assignee, category, dueDate, dueTime, status } = goal;
  const isCompleted = status === 'completed';

  const assigneeDetails = USER_DETAILS[assignee] || USER_DETAILS['가족'];
  const categoryDetails = CATEGORY_DETAILS[category] || CATEGORY_DETAILS['기타'];

  const formattedDate = new Date(dueDate).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour % 12 || 12;
    return `${ampm} ${displayHour}:${minutes}`;
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4.5 mb-3 cursor-pointer
        relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-slate-900/50
        transition-all duration-300 ease-in-out active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-700/50
        ${isCompleted ? 'bg-slate-50 dark:bg-slate-800/50 opacity-80' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className={`
            font-medium text-slate-800 dark:text-slate-100 mb-2 leading-tight break-words
            ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}
          `}>
            {title}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${categoryDetails.color} ${categoryDetails.textColor}`}>
              {category}
            </span>
            <div className="flex items-center gap-1">
              <span className="material-icons text-sm">schedule</span>
              <span>{formattedDate} {formatTime(dueTime)}</span>
            </div>
          </div>
        </div>
        <div className={`
          w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white
          bg-gradient-to-br ${assigneeDetails.color} shadow-sm
        `}>
          {assignee.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default GoalCard;
