'use client';

import React from 'react';
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
  const progressPercentage = (currentProgress / totalNodes) * 100;

  return (
    <div className="bg-asylum-medium p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-medium">Progression</span>
        <span className="text-asylum-accent font-bold">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <div className="w-full bg-asylum-dark rounded-full h-2 mb-2">
        <motion.div
          className="bg-asylum-accent h-2 rounded-full"
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