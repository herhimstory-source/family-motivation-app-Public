import React, { useState, useEffect, FormEvent } from 'react';
import { Goal, User, Category } from '../types';
import { USERS, CATEGORIES } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<Goal, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  editingGoal: Goal | null;
  currentUser: User;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, editingGoal, currentUser }) => {
  const [assignee, setAssignee] = useState<User>('가족');
  const [category, setCategory] = useState<Category>('건강');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setAssignee(editingGoal.assignee);
        setCategory(editingGoal.category);
        setTitle(editingGoal.title);
        setDueDate(editingGoal.dueDate ? new Date(editingGoal.dueDate).toISOString().split('T')[0] : '');
        setDueTime(editingGoal.dueTime || '');
      } else {
        // Reset form for new goal
        const today = new Date().toISOString().split('T')[0];
        setAssignee(currentUser === '모두' ? '가족' : currentUser);
        setCategory('건강');
        setTitle('');
        setDueDate(today);
        setDueTime('');
      }
    }
  }, [isOpen, editingGoal, currentUser]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignee || !category || !dueDate) {
        alert("Please fill all required fields.");
        return;
    }
    setIsSaving(true);
    try {
      await onSave({ title, assignee, category, dueDate, dueTime });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-0 md:items-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl md:rounded-2xl w-full max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <header className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {editingGoal ? '목표 수정' : '새 목표 추가'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
              <span className="material-icons">close</span>
            </button>
          </header>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="form-group">
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">담당자</label>
                <select value={assignee} onChange={e => setAssignee(e.target.value as User)} className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg text-base bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                  {USERS.filter(u => u !== '모두').map(user => <option key={user} value={user}>{user}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">카테고리</label>
                <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg text-base bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">할 일</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="목표를 입력하세요" className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg text-base bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">마감일</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg text-base bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
                <div className="form-group">
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">시간 (선택)</label>
                  <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg text-base bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="w-full mt-8 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-base h-16 flex items-center justify-center transition hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? <LoadingSpinner size="sm"/> : (editingGoal ? '수정' : 'START')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
