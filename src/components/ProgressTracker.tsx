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
  const progressPercentage =
    totalNodes > 0 ? (currentProgress / totalNodes) * 100 : 0;

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Version simplifiée pour le SSR
    return (
      <div className="mb-6 rounded-lg bg-gray-700 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-white">Progression</span>
          <span className="font-bold text-red-400">0%</span>
        </div>
        <div className="mb-2 h-2 w-full rounded-full bg-gray-800">
          <div
            className="h-2 rounded-full bg-red-400"
            style={{ width: '0%' }}
          />
        </div>
        <div className="text-sm text-gray-300">0 / 0 scènes visitées</div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg bg-gray-700 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-white">Progression</span>
        <span className="font-bold text-red-400">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      <div className="mb-2 h-2 w-full rounded-full bg-gray-800">
        <motion.div
          className="h-2 rounded-full bg-red-400"
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
