// src/components/editor/BulkStoryGeneratorModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, AlertCircle, Zap, Eye, Settings } from 'lucide-react';

interface BulkGenerationParams {
  theme: string;
  genre: 'fantasy' | 'sci-fi' | 'horror' | 'mystery' | 'romance' | 'adventure' | 'thriller';
  tone: 'neutral' | 'dark' | 'humorous';
  complexity: 'simple' | 'medium' | 'complex';
  nodeCount: number;
  branchingFactor: number; // How many choices per node on average
  description: string;
}

interface BulkStoryGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (storyStructure: GeneratedStoryStructure) => void;
}

interface GeneratedNode {
  id: string;
  type: 'start' | 'story' | 'end';
  title: string;
  content: string;
  choices: Array<{
    id: string;
    text: string;
    nextNodeId: string;
  }>;
  position: { x: number; y: number };
}

interface GeneratedStoryStructure {
  nodes: GeneratedNode[];
  metadata: {
    title: string;
    description: string;
    theme: string;
    genre: string;
    estimatedPlayTime: string;
    totalNodes: number;
    totalChoices: number;
  };
}

export const BulkStoryGeneratorModal: React.FC<BulkStoryGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [params, setParams] = useState<BulkGenerationParams>({
    theme: '',
    genre: 'fantasy',
    tone: 'neutral',
    complexity: 'medium',
    nodeCount: 15,
    branchingFactor: 2,
    description: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    stage: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setParams({
        theme: '',
        genre: 'fantasy',
        tone: 'neutral',
        complexity: 'medium',
        nodeCount: 15,
        branchingFactor: 2,
        description: '',
      });
      setError(null);
      setGenerationProgress({ current: 0, total: 0, stage: '' });
      setShowAdvanced(false);
    }
  }, [isOpen]);

  const genreOptions = [
    { value: 'fantasy', label: 'Fantasy', description: 'Magic, mythical creatures, epic quests' },
    { value: 'sci-fi', label: 'Sci-Fi', description: 'Future technology, space, aliens' },
    { value: 'horror', label: 'Horror', description: 'Supernatural, scary, suspenseful' },
    { value: 'mystery', label: 'Mystery', description: 'Puzzles, investigation, secrets' },
    { value: 'romance', label: 'Romance', description: 'Love stories, relationships' },
    { value: 'adventure', label: 'Adventure', description: 'Action, exploration, heroics' },
    { value: 'thriller', label: 'Thriller', description: 'High stakes, tension, danger' },
  ] as const;

  const toneOptions = [
    { value: 'neutral', label: 'Neutral', description: 'Balanced and accessible' },
    { value: 'dark', label: 'Dark', description: 'Serious, intense, mature themes' },
    { value: 'humorous', label: 'Humorous', description: 'Light-hearted, funny, entertaining' },
  ] as const;

  const complexityOptions = [
    { 
      value: 'simple', 
      label: 'Simple', 
      description: 'Linear story with minimal branching',
      nodes: '8-12',
      branches: '1-2 per node'
    },
    { 
      value: 'medium', 
      label: 'Medium', 
      description: 'Moderate branching with multiple paths',
      nodes: '12-20',
      branches: '2-3 per node'
    },
    { 
      value: 'complex', 
      label: 'Complex', 
      description: 'Heavy branching with many endings',
      nodes: '20-30',
      branches: '3-4 per node'
    },
  ] as const;

  const generateBulkStory = async () => {
    if (!params.theme.trim()) {
      setError('Please provide a story theme.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Calculate actual parameters based on complexity
      const actualNodeCount = params.complexity === 'simple' ? 
        Math.min(params.nodeCount, 12) : 
        params.complexity === 'medium' ? 
        Math.min(params.nodeCount, 20) : 
        params.nodeCount;

      const actualBranchingFactor = params.complexity === 'simple' ? 
        Math.min(params.branchingFactor, 2) : 
        params.complexity === 'medium' ? 
        Math.min(params.branchingFactor, 3) : 
        params.branchingFactor;

      setGenerationProgress({
        current: 0,
        total: actualNodeCount,
        stage: 'Planning story structure...',
      });

      // Generate story structure using OpenAI
      const response = await fetch('/api/ai/generate-bulk-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: params.theme,
          genre: params.genre,
          tone: params.tone,
          complexity: params.complexity,
          nodeCount: actualNodeCount,
          branchingFactor: actualBranchingFactor,
          description: params.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Process the generated story structure
      const storyStructure: GeneratedStoryStructure = data.storyStructure;
      
      setGenerationProgress({
        current: actualNodeCount,
        total: actualNodeCount,
        stage: 'Story generated successfully!',
      });

      console.log('✅ Bulk story generated:', {
        title: storyStructure.metadata.title,
        nodes: storyStructure.nodes.length,
        choices: storyStructure.metadata.totalChoices,
      });

      // Brief delay to show completion
      setTimeout(() => {
        onGenerate(storyStructure);
        onClose();
      }, 1000);

    } catch (err) {
      console.error('❌ Bulk generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate story. Please try again.';
      
      // Show specific error messages for common issues
      if (errorMessage.includes('API key')) {
        setError('OpenAI API key is missing or invalid. Please check your configuration.');
      } else if (errorMessage.includes('rate limit')) {
        setError('Rate limit exceeded. Please wait a moment before trying again.');
      } else if (errorMessage.includes('quota')) {
        setError('OpenAI quota exceeded. Please check your account billing.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getEstimatedStats = () => {
    const nodeCount = params.complexity === 'simple' ? 
      Math.min(params.nodeCount, 12) : 
      params.complexity === 'medium' ? 
      Math.min(params.nodeCount, 20) : 
      params.nodeCount;

    const totalChoices = Math.floor(nodeCount * params.branchingFactor * 0.7); // Rough estimate
    const playTime = Math.ceil(nodeCount * 1.5); // ~1.5 minutes per node

    return {
      nodeCount,
      totalChoices,
      playTime: `${playTime}-${playTime + 5} minutes`,
    };
  };

  if (!isOpen) return null;

  const stats = getEstimatedStats();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-600 p-2">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Bulk Story Generator
                  </h2>
                  <p className="text-sm text-gray-400">
                    Generate a complete interactive story in one go
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isGenerating ? (
              /* Generation Progress */
              <div className="space-y-6 text-center">
                <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                <div>
                  <h3 className="mb-2 text-lg font-medium text-white">
                    Generating Your Story...
                  </h3>
                  <p className="text-gray-400">{generationProgress.stage}</p>
                  
                  {generationProgress.total > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-sm text-gray-400">
                        <span>Progress</span>
                        <span>{generationProgress.current}/{generationProgress.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700">
                        <div 
                          className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                          style={{ 
                            width: `${(generationProgress.current / generationProgress.total) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="rounded-lg border border-blue-600 bg-blue-900/20 p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
                    <div className="text-sm text-blue-200">
                      <div className="mb-1 font-medium">AI is crafting your story...</div>
                      <div>This may take 30-60 seconds depending on story complexity.</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Configuration Form */
              <div className="space-y-6">
                {/* Basic Parameters */}
                <div className="space-y-4">
                  {/* Story Theme */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Story Theme *
                    </label>
                    <input
                      type="text"
                      value={params.theme}
                      onChange={(e) => setParams({ ...params, theme: e.target.value })}
                      placeholder="e.g., A magical academy where students learn forbidden spells"
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white transition-colors focus:border-purple-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Genre
                    </label>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {genreOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setParams({ ...params, genre: option.value })}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            params.genre === option.value
                              ? 'border-purple-500 bg-purple-900/50'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium text-white">{option.label}</div>
                          <div className="text-xs text-gray-400">{option.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Tone
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {toneOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setParams({ ...params, tone: option.value })}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            params.tone === option.value
                              ? 'border-purple-500 bg-purple-900/50'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium text-white">{option.label}</div>
                          <div className="text-xs text-gray-400">{option.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Complexity */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Story Complexity
                    </label>
                    <div className="space-y-2">
                      {complexityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setParams({ ...params, complexity: option.value })}
                          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                            params.complexity === option.value
                              ? 'border-purple-500 bg-purple-900/50'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{option.label}</div>
                              <div className="text-sm text-gray-400">{option.description}</div>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              <div>{option.nodes} nodes</div>
                              <div>{option.branches}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                    >
                      <Settings size={16} />
                      Advanced Settings
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-4 space-y-4 rounded-lg border border-gray-600 bg-gray-750 p-4">
                        {/* Node Count */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            Target Node Count: {params.nodeCount}
                          </label>
                          <input
                            type="range"
                            min="8"
                            max="30"
                            step="1"
                            value={params.nodeCount}
                            onChange={(e) => setParams({ ...params, nodeCount: parseInt(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                          <div className="mt-1 flex justify-between text-xs text-gray-400">
                            <span>8 nodes</span>
                            <span>30 nodes</span>
                          </div>
                        </div>

                        {/* Branching Factor */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            Branching Factor: {params.branchingFactor}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="4"
                            step="1"
                            value={params.branchingFactor}
                            onChange={(e) => setParams({ ...params, branchingFactor: parseInt(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                          <div className="mt-1 flex justify-between text-xs text-gray-400">
                            <span>Linear (1)</span>
                            <span>Complex (4)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={params.description}
                      onChange={(e) => setParams({ ...params, description: e.target.value })}
                      placeholder="Specific characters, plot points, or style requirements..."
                      className="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white transition-colors focus:border-purple-500 focus:outline-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="rounded-lg border border-red-600 bg-red-900/50 p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-400" />
                      <span className="text-red-300">{error}</span>
                    </div>
                  </div>
                )}

                {/* Estimated Stats */}
                <div className="rounded-lg border border-green-600 bg-green-900/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Eye size={16} className="text-green-400" />
                    <h3 className="font-medium text-green-400">Estimated Story Stats</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Nodes</div>
                      <div className="font-medium text-white">{stats.nodeCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Choices</div>
                      <div className="font-medium text-white">~{stats.totalChoices}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Play Time</div>
                      <div className="font-medium text-white">{stats.playTime}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!isGenerating && (
            <div className="border-t border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  This will create a complete story with nodes and connections
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateBulkStory}
                    disabled={!params.theme.trim()}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-white transition-colors hover:bg-purple-700 disabled:bg-gray-600"
                  >
                    <Zap size={16} />
                    Generate Complete Story
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};