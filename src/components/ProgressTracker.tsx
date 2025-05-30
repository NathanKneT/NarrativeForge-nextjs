'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProgressTrackerProps {
  currentProgress: number;
  totalNodes: number;
  visitedNodes: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentProgress,
  totalNodes,
  visitedNodes,
}) => {
  const [isClient, setIsClient] = useState(false);
  const progressPercentage = totalNodes > 0 ? (currentProgress / totalNodes) * 100 : 0;

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Version simplifiée pour le SSR
    return (
      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-medium">Progression</span>
          <span className="text-red-400 font-bold">0%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
          <div className="bg-red-400 h-2 rounded-full" style={{ width: '0%' }} />
        </div>
        <div className="text-sm text-gray-300">
          0 / 0 scènes visitées
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-medium">Progression</span>
        <span className="text-red-400 font-bold">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
        <motion.div
          className="bg-red-400 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="text-sm text-gray-300">
        {visitedNodes} / {totalNodes} scènes visitées
      </div>
    </div>
  );
};