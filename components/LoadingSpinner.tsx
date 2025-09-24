
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        border-slate-200 dark:border-slate-600 
        border-t-blue-500 dark:border-t-blue-400 
        rounded-full animate-spin 
        ${className}
      `}
      role="status"
      aria-label="Loading"
    ></div>
  );
};

export default LoadingSpinner;
