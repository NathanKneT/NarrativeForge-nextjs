import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl animate-pulse flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        Chargement...
      </div>
    </div>
  );
};

export default LoadingFallback;
