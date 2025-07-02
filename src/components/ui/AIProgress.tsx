'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Sparkles, Zap, Brain, Layout } from 'lucide-react';

interface AIGenerationStage {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  duration: number;
}

interface EnhancedAIProgressProps {
  currentStage: number;
  stageProgress: number;
  stages: AIGenerationStage[];
  isComplete?: boolean;
  totalNodes?: number;
  generationType?: 'single' | 'bulk';
}

export const EnhancedAIProgress: React.FC<EnhancedAIProgressProps> = ({
  currentStage,
  stageProgress,
  stages,
  isComplete = false,
  totalNodes,
  generationType = 'single'
}) => {
  const overallProgress = ((currentStage + stageProgress / 100) / stages.length) * 100;

  const defaultStages: AIGenerationStage[] = [
    {
      id: 'analyzing',
      label: 'Analyzing Requirements',
      description: 'Processing your theme and parameters...',
      icon: Brain,
      duration: 1500
    },
    {
      id: 'generating',
      label: 'AI Content Generation',
      description: `Creating ${generationType === 'bulk' ? 'story structure and' : ''} narrative content...`,
      icon: Sparkles,
      duration: generationType === 'bulk' ? 25000 : 8000
    },
    {
      id: 'organizing',
      label: 'Organizing Content',
      description: `${generationType === 'bulk' ? 'Connecting nodes and' : ''} Formatting and structuring...`,
      icon: Layout,
      duration: generationType === 'bulk' ? 3000 : 1500
    },
    {
      id: 'finalizing',
      label: 'Finalizing',
      description: 'Applying finishing touches...',
      icon: CheckCircle,
      duration: 1000
    }
  ];

  const activeStages = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          animate={{ rotate: isComplete ? 0 : 360 }}
          transition={{ duration: 2, repeat: isComplete ? 0 : Infinity, ease: "linear" }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 p-1"
        >
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            {isComplete ? (
              <CheckCircle size={32} className="text-green-400" />
            ) : (
              <Sparkles size={32} className="text-white" />
            )}
          </div>
        </motion.div>

        <h3 className="text-xl font-bold text-white">
          {isComplete 
            ? `${generationType === 'bulk' ? 'Story' : 'Content'} Generated!` 
            : `Generating ${generationType === 'bulk' ? 'Your Story' : 'Content'}...`
          }
        </h3>

        {totalNodes && (
          <p className="text-sm text-gray-400">
            {generationType === 'bulk' ? `${totalNodes} nodes with intelligent connections` : 'AI-powered content generation'}
          </p>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-gray-300">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 relative"
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            
            {/* Moving shimmer */}
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/3"
            />
          </motion.div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="space-y-3">
        {activeStages.map((stage, index) => {
          const isCurrentStage = index === currentStage;
          const isCompleted = index < currentStage;
          const isPending = index > currentStage;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
                isCurrentStage 
                  ? 'bg-blue-900/30 border-blue-600/50 shadow-lg shadow-blue-600/20' 
                  : isCompleted 
                    ? 'bg-green-900/20 border-green-600/30' 
                    : 'bg-gray-800/50 border-gray-700/50'
              }`}
            >
              {/* Stage Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' 
                  : isCurrentStage 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-gray-600 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle size={20} />
                ) : isCurrentStage ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <stage.icon size={20} />
                  </motion.div>
                ) : (
                  <stage.icon size={20} />
                )}
              </div>
              
              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${
                    isCurrentStage ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    {stage.label}
                  </h4>
                  {isCurrentStage && !isComplete && (
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1 h-1 bg-blue-400 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                <p className={`text-sm mt-1 ${
                  isCurrentStage ? 'text-blue-200' : isCompleted ? 'text-green-200' : 'text-gray-500'
                }`}>
                  {stage.description}
                </p>

                {/* Current Stage Progress Bar */}
                {isCurrentStage && !isComplete && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stageProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              {isCurrentStage && !isComplete && (
                <div className="flex-shrink-0 text-right">
                  <span className="text-sm font-medium text-blue-400">
                    {Math.round(stageProgress)}%
                  </span>
                </div>
              )}

              {/* Estimated Time */}
              {isCurrentStage && !isComplete && (
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{Math.ceil((stage.duration * (100 - stageProgress)) / 100 / 1000)}s</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Success State */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-green-900/20 border border-green-600/30 rounded-lg"
        >
          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
            <CheckCircle size={24} />
            <span className="text-lg font-semibold">Generation Complete!</span>
          </div>
          <p className="text-sm text-green-200">
            Your {generationType === 'bulk' ? 'story is ready with all nodes positioned intelligently' : 'content has been generated successfully'}.
          </p>
        </motion.div>
      )}
    </div>
  );
};