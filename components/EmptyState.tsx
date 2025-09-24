
import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => {
  return (
    <div className="text-center p-12 text-slate-500 dark:text-slate-400">
      <div className="text-6xl text-blue-500 dark:text-blue-400 opacity-60 mb-4">
        <span className="material-icons text-6xl">{icon}</span>
      </div>
      <h3 className="text-base font-medium text-slate-600 dark:text-slate-300 mb-2">{title}</h3>
      {subtitle && <p className="text-sm leading-relaxed">{subtitle}</p>}
    </div>
  );
};

export default EmptyState;
