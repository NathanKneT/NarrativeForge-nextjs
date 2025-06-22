'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, AlertCircle, Zap, Eye, Settings, CheckCircle, Clock } from 'lucide-react';

interface BulkGenerationParams {
  theme: string;
  genre: 'fantasy' | 'sci-fi' | 'horror' | 'mystery' | 'romance' | 'adventure' | 'thriller';
  tone: 'neutral' | 'dark' | 'humorous';
  complexity: 'simple' | 'medium' | 'complex';
  nodeCount: number;
  branchingFactor: number;
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

// Enhanced loading stages for better user feedback
const GENERATION_STAGES = [
  { id: 'planning', label: 'Planning story structure...', duration: 2000 },
  { id: 'generating', label: 'AI is crafting your story...', duration: 25000 },
  { id: 'organizing', label: 'Organizing nodes and connections...', duration: 3000 },
  { id: 'positioning', label: 'Arranging intelligent layout...', duration: 2000 },
  { id: 'finalizing', label: 'Finalizing story structure...', duration: 1000 },
];

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
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStoryStructure | null>(null);

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
      setCurrentStage(0);
      setStageProgress(0);
      setShowAdvanced(false);
      setGeneratedStory(null);
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

  // Enhanced stage progression with realistic timing
  const progressThroughStages = async () => {
    for (let i = 0; i < GENERATION_STAGES.length; i++) {
      setCurrentStage(i);
      setStageProgress(0);
      
      const stage = GENERATION_STAGES[i];
      const startTime = Date.now();
      
      // Smooth progress animation for each stage
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / stage.duration) * 100, 100);
        setStageProgress(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 50);
      
      // Wait for stage duration
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      clearInterval(progressInterval);
      setStageProgress(100);
    }
  };

  // IMPROVED: Smart node positioning with much better spacing
  const organizeNodesIntelligently = (nodes: any[], metadata: any) => {
    const startNode = nodes.find(n => n.type === 'start');
    const endNodes = nodes.filter(n => n.type === 'end');
    const storyNodes = nodes.filter(n => n.type === 'story');
    
    const organizedNodes = [];
    
    // Enhanced spacing constants
    const HORIZONTAL_SPACING = 400; // Increased from 300
    const VERTICAL_SPACING = 250;   // Increased from 150
    const CANVAS_WIDTH = 1200;      // Wider canvas
    const MIN_X = 100;
    const START_Y = 80;
    
    // 1. Position start node at top center
    if (startNode) {
      organizedNodes.push({
        ...startNode,
        position: { x: CANVAS_WIDTH / 2, y: START_Y }
      });
    }
    
    // 2. Create intelligent layers based on story complexity
    const maxNodesPerLayer = Math.min(4, Math.max(2, Math.floor(Math.sqrt(storyNodes.length))));
    const layers = Math.ceil(storyNodes.length / maxNodesPerLayer);
    
    console.log('🎯 Positioning strategy:', {
      totalStoryNodes: storyNodes.length,
      maxNodesPerLayer,
      layers,
      horizontalSpacing: HORIZONTAL_SPACING,
      verticalSpacing: VERTICAL_SPACING
    });
    
    // 3. Position story nodes in organized, well-spaced layers
    storyNodes.forEach((node, index) => {
      const layer = Math.floor(index / maxNodesPerLayer);
      const positionInLayer = index % maxNodesPerLayer;
      const nodesInThisLayer = Math.min(maxNodesPerLayer, storyNodes.length - layer * maxNodesPerLayer);
      
      // Calculate X position with proper centering and spacing
      let x;
      if (nodesInThisLayer === 1) {
        x = CANVAS_WIDTH / 2; // Center single nodes
      } else {
        const totalLayerWidth = (nodesInThisLayer - 1) * HORIZONTAL_SPACING;
        const startX = (CANVAS_WIDTH - totalLayerWidth) / 2;
        x = startX + (positionInLayer * HORIZONTAL_SPACING);
      }
      
      // Ensure minimum spacing from edges
      x = Math.max(MIN_X, Math.min(x, CANVAS_WIDTH - MIN_X));
      
      const y = START_Y + (layer + 1) * VERTICAL_SPACING;
      
      organizedNodes.push({
        ...node,
        position: { x, y }
      });
      
      console.log(`📍 Node ${index + 1}:`, {
        layer: layer + 1,
        positionInLayer: positionInLayer + 1,
        nodesInThisLayer,
        position: { x, y }
      });
    });
    
    // 4. Position end nodes at bottom with generous spacing
    const endNodeY = START_Y + (layers + 1) * VERTICAL_SPACING + 100; // Extra space before end nodes
    endNodes.forEach((node, index) => {
      let x;
      if (endNodes.length === 1) {
        x = CANVAS_WIDTH / 2;
      } else {
        const totalEndWidth = (endNodes.length - 1) * HORIZONTAL_SPACING;
        const startX = (CANVAS_WIDTH - totalEndWidth) / 2;
        x = startX + (index * HORIZONTAL_SPACING);
      }
      
      x = Math.max(MIN_X, Math.min(x, CANVAS_WIDTH - MIN_X));
      
      organizedNodes.push({
        ...node,
        position: { x, y: endNodeY }
      });
      
      console.log(`🏁 End node ${index + 1}:`, { position: { x, y: endNodeY } });
    });
    
    console.log('✅ Final positioning:', {
      totalNodes: organizedNodes.length,
      canvasSize: { width: CANVAS_WIDTH, height: endNodeY + 100 },
      spacing: { horizontal: HORIZONTAL_SPACING, vertical: VERTICAL_SPACING }
    });
    
    return organizedNodes;
  };

  const generateBulkStory = async () => {
    if (!params.theme.trim()) {
      setError('Please provide a story theme.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentStage(0);
    setStageProgress(0);

    try {
      // Start progress animation
      const progressPromise = progressThroughStages();
      
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

      console.log('🚀 Generating with parameters:', {
        theme: params.theme,
        genre: params.genre,
        tone: params.tone,
        complexity: params.complexity,
        nodeCount: actualNodeCount,
        branchingFactor: actualBranchingFactor
      });

      // Make API call
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

      // Wait for progress animation to complete
      await progressPromise;
      
      // Apply intelligent node positioning with improved spacing
      const organizedNodes = organizeNodesIntelligently(
        data.storyStructure.nodes, 
        data.storyStructure.metadata
      );
      
      const finalStoryStructure = {
        ...data.storyStructure,
        nodes: organizedNodes
      };

      setGeneratedStory(finalStoryStructure);

      console.log('✅ Story generated with intelligent positioning:', {
        title: finalStoryStructure.metadata.title,
        nodes: finalStoryStructure.nodes.length,
        choices: finalStoryStructure.metadata.totalChoices,
      });

      // Brief delay to show completion
      setTimeout(() => {
        onGenerate(finalStoryStructure);
        onClose();
      }, 1500);

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

    const totalChoices = Math.floor(nodeCount * params.branchingFactor * 0.7);
    const playTime = Math.ceil(nodeCount * 1.5);

    return {
      nodeCount,
      totalChoices,
      playTime: `${playTime}-${playTime + 5} minutes`,
    };
  };

  if (!isOpen) return null;

  const stats = getEstimatedStats();
  const currentStageInfo = GENERATION_STAGES[currentStage];

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
                    {isGenerating ? 'Generating your interactive story...' : 'Generate a complete interactive story in one go'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-50"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isGenerating ? (
              /* Enhanced Generation Progress */
              <div className="space-y-6 text-center">
                {/* Main Progress Indicator */}
                <div className="relative mx-auto h-24 w-24">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-600/20"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"
                    style={{
                      animation: 'spin 2s linear infinite'
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={32} className="text-purple-400" />
                  </div>
                </div>

                {/* Stage Information */}
                <div>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    {generatedStory ? 'Story Generated Successfully!' : 'Creating Your Story...'}
                  </h3>
                  
                  {!generatedStory && (
                    <>
                      <p className="mb-4 text-lg text-purple-300">
                        {currentStageInfo?.label || 'Processing...'}
                      </p>
                      
                      {/* Stage Progress Bar */}
                      <div className="mx-auto mb-6 max-w-md">
                        <div className="mb-2 flex justify-between text-sm text-gray-400">
                          <span>Stage {currentStage + 1} of {GENERATION_STAGES.length}</span>
                          <span>{Math.round(stageProgress)}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-700">
                          <div 
                            className="h-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-out"
                            style={{ width: `${stageProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Overall Progress */}
                      <div className="mx-auto max-w-md">
                        <div className="mb-2 text-sm text-gray-400">Overall Progress</div>
                        <div className="h-2 rounded-full bg-gray-700">
                          <div 
                            className="h-2 rounded-full bg-purple-600 transition-all duration-500"
                            style={{ 
                              width: `${((currentStage + (stageProgress / 100)) / GENERATION_STAGES.length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {generatedStory && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle size={24} />
                        <span className="text-lg font-medium">Complete!</span>
                      </div>
                      <div className="rounded-lg bg-green-900/30 border border-green-600/50 p-4">
                        <h4 className="font-bold text-green-300 mb-2">
                          "{generatedStory.metadata.title}"
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm text-green-200">
                          <div>
                            <div className="text-green-400">Nodes</div>
                            <div className="font-medium">{generatedStory.metadata.totalNodes}</div>
                          </div>
                          <div>
                            <div className="text-green-400">Choices</div>
                            <div className="font-medium">{generatedStory.metadata.totalChoices}</div>
                          </div>
                          <div>
                            <div className="text-green-400">Play Time</div>
                            <div className="font-medium">{generatedStory.metadata.estimatedPlayTime}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Process Information */}
                {!generatedStory && (
                  <div className="rounded-lg border border-blue-600 bg-blue-900/20 p-4">
                    <div className="flex items-start gap-3">
                      <Clock size={20} className="mt-0.5 flex-shrink-0 text-blue-400" />
                      <div className="text-sm text-blue-200">
                        <div className="mb-2 font-medium">What's happening:</div>
                        <ul className="space-y-1 text-left text-blue-300">
                          <li>• AI is analyzing your theme and requirements</li>
                          <li>• Creating interconnected story nodes and choices</li>
                          <li>• Organizing nodes with intelligent spacing</li>
                          <li>• This typically takes 30-60 seconds</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Configuration Form - COMPLETE with all parameters */
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

                  {/* Genre Grid */}
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
                  This will create a complete story with intelligently organized nodes
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
                  