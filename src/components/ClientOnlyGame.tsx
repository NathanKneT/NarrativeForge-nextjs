'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { StoryViewer } from '@/components/StoryViewer';
import { ProgressTracker } from '@/components/ProgressTracker';
import { GameControls } from '@/components/GameControls';
import { SaveLoadModal } from '@/components/SaveLoadModal';
import { useGameStore } from '@/stores/gameStore';
import { StoryLoader } from '@/lib/storyLoader';
import { dynamicStoryManager, StoryProject } from '@/lib/dynamicStoryManager';
import { SaveData, StoryNode } from '@/types/story';
import { ArrowLeft } from 'lucide-react';

interface ClientOnlyGameProps {
  storyId: string;
  onBack?: () => void;
}

export function ClientOnlyGame({ storyId, onBack }: ClientOnlyGameProps) {
  const [storyLoader, setStoryLoader] = useState<StoryLoader | null>(null);
  const [storyProject, setStoryProject] = useState<StoryProject | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  const {
    gameState,
    currentNode,
    initializeGame,
    makeChoice,
    saveGame,
    loadGame,
    restartGame,
    setCurrentNode,
    setError: setGameError,
    clearCorruptedState,
  } = useGameStore();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    setHasHydrated(true);
  }, []);

  // Load story data from dynamic story manager
  useEffect(() => {
    if (!hasHydrated || !isClient || !storyId) return;

    const loadStoryData = async () => {
      try {
        setLoadingMessage('Loading story...');
        setError(null);
        
        const loadedStoryProject = await dynamicStoryManager.getStory(storyId);
        
        if (!loadedStoryProject) {
          throw new Error(`Story not found: ${storyId}`);
        }

        setLoadingMessage('Validating story...');
        
        // Validate the story structure
        if (!loadedStoryProject.story || loadedStoryProject.story.length === 0) {
          throw new Error('Story contains no content');
        }

        if (!loadedStoryProject.startNodeId) {
          throw new Error('Story has no starting point');
        }

        setLoadingMessage('Initializing game engine...');
        
        // Create story loader
        const loader = new StoryLoader(loadedStoryProject.story);
        
        // Validate story integrity
        const validation = loader.validateStory();
        if (!validation.isValid) {
          console.warn('Story validation warnings:', validation.warnings);
          if (validation.errors.length > 0) {
            throw new Error('Story validation failed: ' + validation.errors.join(', '));
          }
        }

        setStoryLoader(loader);
        setStoryProject(loadedStoryProject);

        // Check if existing game state is valid for this story
        if (gameState && !isGameStateValid(gameState, loader)) {
          console.log('🧹 Game state invalid for this story, resetting...');
          clearCorruptedState();
        }

        // Initialize game if needed
        if (!gameState || !isGameStateValid(gameState, loader)) {
          console.log('🚀 Initializing new game with node:', loadedStoryProject.startNodeId);
          initializeGame(loadedStoryProject.startNodeId);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to load story:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load story';
        setError(errorMessage);
        setGameError(errorMessage);
        setIsLoading(false);
      }
    };

    loadStoryData();
  }, [hasHydrated, isClient, storyId, gameState, initializeGame, setGameError, clearCorruptedState]);

  // Validate game state against current story
  const isGameStateValid = useCallback((gameState: any, storyLoader: StoryLoader | null): boolean => {
    if (!gameState || !storyLoader) return false;

    const currentNodeExists = storyLoader.getNode(gameState.currentNodeId);
    if (!currentNodeExists) {
      console.warn('⚠️ Current node not found in story:', gameState.currentNodeId);
      return false;
    }

    return true;
  }, []);

  // Load current node
  useEffect(() => {
    if (storyLoader && gameState && hasHydrated && isClient && !isLoading) {
      if (currentNode?.id === gameState.currentNodeId) {
        return;
      }

      const node = storyLoader.getNode(gameState.currentNodeId);
      if (node) {
        console.log('📖 Loading node:', node.id, node.title);
        setCurrentNode(node);
      } else {
        console.error('❌ Node not found:', gameState.currentNodeId);
        setError('Story node not found');
        setGameError('Story node not found');
      }
    }
  }, [storyLoader, gameState?.currentNodeId, hasHydrated, isClient, isLoading, setCurrentNode, setGameError, currentNode?.id]);

  // Handle choice selection
  const handleChoiceSelect = useCallback((choiceId: string) => {
    if (!storyLoader || !gameState) return;

    console.log('🎮 Choice selected:', choiceId);
    const nextNode = storyLoader.getNextNode(gameState.currentNodeId, choiceId);

    if (nextNode) {
      makeChoice(choiceId, nextNode.id);
    } else {
      // Check for restart
      const currentNode = storyLoader.getNode(gameState.currentNodeId);
      const choice = currentNode?.choices.find(c => c.id === choiceId);

      if (choice && choice.nextNodeId === '-1') {
        console.log('🔄 Restarting story...');
        handleRestart();
      } else {
        console.error('❌ Cannot navigate to next node');
        setError('Navigation failed - destination node not found');
        setGameError('Navigation failed - destination node not found');
      }
    }
  }, [storyLoader, gameState, makeChoice, setGameError]);

  // Game control handlers
  const handleSave = useCallback(() => {
    setSaveModalOpen(true);
  }, []);

  const handleLoad = useCallback(() => {
    setLoadModalOpen(true);
  }, []);

  const handleSaveConfirm = useCallback(async (saveName: string) => {
    try {
      await saveGame(saveName);
      setSaveModalOpen(false);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Game saved successfully!', {
          body: `Save "${saveName}" created`,
          icon: '/favicon.ico',
        });
      } else {
        alert('Game saved successfully!');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save game');
    }
  }, [saveGame]);

  const handleLoadConfirm = useCallback((saveData: SaveData) => {
    try {
      if (storyLoader && !isGameStateValid(saveData.gameState, storyLoader)) {
        const shouldContinue = confirm(
          'This save seems incompatible with the current story. This may cause issues. Continue anyway?'
        );
        if (!shouldContinue) return;
      }

      loadGame(saveData);
      setLoadModalOpen(false);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Game loaded successfully!', {
          body: `Save "${saveData.name}" loaded`,
          icon: '/favicon.ico',
        });
      } else {
        alert('Game loaded successfully!');
      }
    } catch (error) {
      console.error('Load error:', error);
      alert('Failed to load game');
    }
  }, [loadGame, storyLoader, isGameStateValid]);

  const handleRestart = useCallback(() => {
    if (!confirm('Restart the story? You will lose current progress.')) return;

    console.log('🔄 Restart requested');
    restartGame();

    if (storyLoader && storyProject) {
      console.log('🚀 Restarting with node:', storyProject.startNodeId);
      initializeGame(storyProject.startNodeId);
    }
  }, [restartGame, storyLoader, storyProject, initializeGame]);

  const handleSettings = useCallback(() => {
    const options = [
      'Audio Settings',
      'Display Settings',
      'Clear Corrupted Data',
      'Reset All Data',
      'About',
    ];

    const choice = prompt(
      'Available Settings:\n' +
        options.map((opt, i) => `${i + 1}. ${opt}`).join('\n') +
        '\n\nEnter your choice number:'
    );

    const optionIndex = parseInt(choice || '') - 1;

    switch (optionIndex) {
      case 0:
        setIsMuted(!isMuted);
        alert(`Audio ${isMuted ? 'enabled' : 'disabled'}`);
        break;
      case 1:
        alert('Display settings to be implemented');
        break;
      case 2:
        if (confirm('Clean corrupted game data? This will remove your current progress but preserve saves.')) {
          clearCorruptedState();
          if (storyProject) {
            initializeGame(storyProject.startNodeId);
          }
          alert('✅ Data cleaned! Game restarted.');
        }
        break;
      case 3:
        if (confirm('Reset all data? This action is irreversible.')) {
          localStorage.clear();
          window.location.reload();
        }
        break;
      case 4:
        alert(
          `Interactive Story Platform\nVersion 1.0.0\n\n${storyProject ? `Story: ${storyProject.metadata.title}\nBy: ${storyProject.metadata.author}` : 'No story loaded'}\n\nBuilt with Next.js, React Flow and TypeScript`
        );
        break;
      default:
        break;
    }
  }, [isMuted, clearCorruptedState, storyProject, initializeGame]);

  // Loading screen
  if (!isClient || !hasHydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-blue-500 border-t-transparent mx-auto"></div>
          <div className="mb-4 text-xl text-white">{loadingMessage}</div>
          {storyProject && (
            <div className="text-sm text-gray-400">
              Loading: {storyProject.metadata.title}
            </div>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Back to Menu
            </button>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentNode || !storyLoader || !storyProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl text-red-400">⚠️</div>
          <div className="mb-4 text-xl text-red-400">Failed to load story</div>
          <div className="mb-4 text-sm text-gray-400">
            {error || 'Unknown error occurred'}
          </div>
          {storyProject && (
            <div className="mb-4 text-sm text-gray-500">
              Story: {storyProject.metadata.title}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Back to Menu
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalNodes = storyLoader.getAllNodes().length;
  const visitedNodes = gameState?.visitedNodes.size || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      {/* Header with back button and story info */}
      <header className="border-b border-gray-700 bg-gray-800 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-2 text-white transition-colors hover:bg-gray-700"
                title="Back to Menu"
              >
                <ArrowLeft size={16} />
                Menu
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{storyProject.metadata.title}</h1>
              <p className="text-sm text-gray-400">by {storyProject.metadata.author}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Difficulty: {storyProject.metadata.difficulty}</span>
            <span>Est. Time: {storyProject.metadata.estimatedPlayTime}</span>
            {storyProject.metadata.version && (
              <span>v{storyProject.metadata.version}</span>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <ProgressTracker
            currentProgress={visitedNodes}
            totalNodes={totalNodes}
            visitedNodes={visitedNodes}
          />

          <GameControls
            onSave={handleSave}
            onLoad={handleLoad}
            onRestart={handleRestart}
            onSettings={handleSettings}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />

          <StoryViewer node={currentNode} onChoiceSelect={handleChoiceSelect} />

          {/* Save/Load Modals */}
          <SaveLoadModal
            isOpen={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            mode="save"
            onSave={handleSaveConfirm}
            onLoad={() => {}}
            currentProgress={visitedNodes}
          />

          <SaveLoadModal
            isOpen={loadModalOpen}
            onClose={() => setLoadModalOpen(false)}
            mode="load"
            onSave={() => {}}
            onLoad={handleLoadConfirm}
          />

          {/* Debug info in development */}
          {isClient && process.env.NODE_ENV === 'development' && (
            <div className="mt-8 rounded bg-gray-800 p-4 text-sm text-white">
              <h3 className="mb-2 font-bold">Debug Info:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>Story ID: {storyProject.metadata.id}</p>
                  <p>Current Node: {currentNode.id}</p>
                  <p>Visited Nodes: {visitedNodes}</p>
                  <p>Total Nodes: {totalNodes}</p>
                </div>
                <div>
                  <p>Available Choices: {currentNode.choices.length}</p>
                  <p>Start Node: {storyLoader.getStartNodeId()}</p>
                  <p>Hydrated: {hasHydrated ? 'Yes' : 'No'}</p>
                  <p>Client: {isClient ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div className="mt-2 border-t border-gray-600 pt-2">
                <p className="text-blue-400">Story Metadata:</p>
                <p className="text-xs">Created: {new Date(storyProject.metadata.createdAt).toLocaleDateString()}</p>
                <p className="text-xs">Updated: {new Date(storyProject.metadata.updatedAt).toLocaleDateString()}</p>
                <p className="text-xs">Tags: {storyProject.metadata.tags.join(', ') || 'None'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}