import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="flex animate-pulse items-center gap-3 text-xl text-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
        Chargement...
      </div>
    </div>
  );
};

export default LoadingFallback;
