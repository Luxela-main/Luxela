import React from 'react';
import { Loader } from '@/components/loader/loader';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader />
        <p className="text-gray-400 mt-4">{message}</p>
      </div>
    </div>
  );
};
