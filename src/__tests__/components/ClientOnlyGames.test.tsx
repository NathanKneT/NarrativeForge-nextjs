import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientOnlyGame } from '@/components/ClientOnlyGame';
import { useGameStore } from '@/stores/gameStore';

// Mock du store
jest.mock('@/stores/gameStore');

// Mock des composants enfants
jest.mock('@/components/StoryViewer', () => ({
  StoryViewer: ({ node, onChoiceSelect }: any) => (
    <div data-testid="story-viewer">
      <h1>{node.title}</h1>
      <p>{node.content}</p>
      {node.choices.map((choice: any) => (
        <button
          key={choice.id}
          onClick={() => onChoiceSelect(choice.id)}
          data-testid={`choice-${choice.id}`}
        >
          {choice.text}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ProgressTracker', () => ({
  ProgressTracker: ({ currentProgress, totalNodes, visitedNodes }: any) => (
    <div data-testid="progress-tracker">
      Progress: {currentProgress}/{totalNodes} ({visitedNodes} visited)
    </div>
  ),
}));

jest.mock('@/components/GameControls', () => ({
  GameControls: ({ onSave, onLoad, onRestart, onSettings, onToggleMute, isMuted }: any) => (
    <div data-testid="game-controls">
      <button onClick={onSave} data-testid="save-button">Save</button>
      <button onClick={onLoad} data-testid="load-button">Load</button>
      <button onClick={onRestart} data-testid="restart-button">Restart</button>
      <button onClick={onSettings} data-testid="settings-button">Settings</button>
      <button onClick={onToggleMute} data-testid="mute-button">
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  ),
}));

jest.mock('@/components/SaveLoadModal', () => ({
  SaveLoadModal: ({ isOpen, onClose, mode, onSave, onLoad }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid={`${mode}-modal`}>
        <input data-testid="save-name-input" placeholder="Save name" />
        <button onClick={() => mode === 'save' ? onSave('Test Save') : onLoad({ id: 'test-save', name: 'Test', gameState: {}, timestamp: new Date(), storyProgress: 1 })} data-testid={`confirm-${mode}`}>
          {mode === 'save' ? 'Save Game' : 'Load Game'}
        </button>
        <button onClick={onClose} data-testid={`cancel-${mode}`}>Cancel</button>
      </div>
    );
  },
}));

jest.mock('@/components/Navigation', () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

jest.mock('@/lib/storyLoader', () => ({
  StoryLoader: jest.fn().mockImplementation(() => ({
    getNode: jest.fn(),
    getStartNodeId: jest.fn().mockReturnValue('start'),
    getAllNodes: jest.fn().mockReturnValue([]),
    validateStory: jest.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
  })),
}));

jest.mock('@/lib/storyMigration', () => ({
  migrateStoryData: jest.fn((data) => data),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock data
jest.mock('@/data/text.json', () => [
  {
    id: 1,
    text: 'Test story content',
    options: [{ text: 'Test choice', nextText: 2 }],
  },
]);

describe('ClientOnlyGame', () => {
  const mockGameStore = {
    gameState: null,
    currentNode: null,
    isLoading: false,
    error: null,
    initializeGame: jest.fn(),
    setCurrentNode: jest.fn(),
    makeChoice: jest.fn(),
    saveGame: jest.fn(),
    loadGame: jest.fn(),
    restartGame: jest.fn(),
    setError: jest.fn(),
    clearCorruptedState: jest.fn(),
  };

  beforeEach(() => {
    (useGameStore as jest.Mock).mockReturnValue(mockGameStore);
    jest.clearAllMocks();
    
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost:3000' },
      writable: true,
    });
  });

  describe('Initial Loading States', () => {
    it('should render loading state when not hydrated', () => {
      render(<ClientOnlyGame />);
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('should render loading state when game is initializing', async () => {
      mockGameStore.currentNode = null;
      
      render(<ClientOnlyGame />);
      
      await waitFor(() => {
        expect(screen.getByText(/Initialisation de l'histoire/)).toBeInTheDocument();
      });
    });
  });

  describe('Normal Game Flow', () => {
    beforeEach(() => {
      mockGameStore.currentNode = {
        id: 'start',
        title: 'Beginning',
        content: 'The story starts here',
        choices: [
          {
            id: 'choice-1',
            text: 'Start adventure',
            nextNodeId: 'node-2',
            conditions: [],
            consequences: [],
          },
        ],
        multimedia: {},
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
      };
      
      mockGameStore.gameState = {
        currentNodeId: 'start',
        visitedNodes: new Set(['start']),
        choices: {},
        startTime: new Date(),
        playTime: 0,
        variables: {},
        inventory: [],
      };
    });

    it('should render game interface when loaded', () => {
      render(<ClientOnlyGame />);
      
      expect(screen.getByTestId('story-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
      expect(screen.getByTestId('game-controls')).toBeInTheDocument();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    it('should handle choice selection', () => {
      render(<ClientOnlyGame />);
      
      const choice = screen.getByTestId('choice-choice-1');
      fireEvent.click(choice);
      
      expect(mockGameStore.makeChoice).toHaveBeenCalledWith('choice-1', 'node-2');
    });
  });

  describe('Test Mode', () => {
    beforeEach(() => {
      const testStoryData = {
        story: [
          {
            id: 'test-start',
            title: 'Test Story',
            content: 'Test content',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        ],
        startNodeId: 'test-start',
        metadata: {
          generatedAt: new Date().toISOString(),
          editorVersion: '1.0.0',
          totalNodes: 1,
          totalChoices: 0,
        },
      };

      Object.defineProperty(window, 'location', {
        value: { 
          search: `?test=true&story=${encodeURIComponent(JSON.stringify(testStoryData))}`,
          href: 'http://localhost:3000'
        },
        writable: true,
      });
    });

    it('should handle test mode initialization', async () => {
      render(<ClientOnlyGame />);
      
      await waitFor(() => {
        expect(mockGameStore.clearCorruptedState).toHaveBeenCalled();
        expect(mockGameStore.initializeGame).toHaveBeenCalledWith('test-start');
      });
    });

    it('should display test mode indicator', async () => {
      mockGameStore.currentNode = {
        id: 'test-start',
        title: 'Test Story',
        content: 'Test content',
        choices: [],
        multimedia: {},
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
      };

      render(<ClientOnlyGame />);
      
      await waitFor(() => {
        expect(screen.getByText(/MODE TEST/)).toBeInTheDocument();
      });
    });
  });

  describe('Game Controls', () => {
    beforeEach(() => {
      mockGameStore.currentNode = {
        id: 'current',
        title: 'Current Node',
        content: 'Current content',
        choices: [],
        multimedia: {},
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
      };
    });

    it('should open save modal', () => {
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('save-button'));
      expect(screen.getByTestId('save-modal')).toBeInTheDocument();
    });

    it('should open load modal', () => {
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('load-button'));
      expect(screen.getByTestId('load-modal')).toBeInTheDocument();
    });

    it('should handle restart with confirmation', () => {
      window.confirm = jest.fn().mockReturnValue(true);
      
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('restart-button'));
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockGameStore.restartGame).toHaveBeenCalled();
    });

    it('should not restart without confirmation', () => {
      window.confirm = jest.fn().mockReturnValue(false);
      
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('restart-button'));
      
      expect(mockGameStore.restartGame).not.toHaveBeenCalled();
    });

    it('should handle mute toggle', () => {
      render(<ClientOnlyGame />);
      
      const muteButton = screen.getByTestId('mute-button');
      fireEvent.click(muteButton);
      
      // Should toggle mute state
      expect(muteButton).toBeInTheDocument();
    });
  });

  describe('Save/Load Operations', () => {
    beforeEach(() => {
      mockGameStore.currentNode = {
        id: 'current',
        title: 'Current Node',
        content: 'Current content',
        choices: [],
        multimedia: {},
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
      };
    });

    it('should handle successful save', async () => {
      mockGameStore.saveGame.mockResolvedValue('save-id-123');
      
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('save-button'));
      fireEvent.click(screen.getByTestId('confirm-save'));
      
      await waitFor(() => {
        expect(mockGameStore.saveGame).toHaveBeenCalledWith('Test Save');
      });
    });

    it('should handle successful load', async () => {
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('load-button'));
      fireEvent.click(screen.getByTestId('confirm-load'));
      
      await waitFor(() => {
        expect(mockGameStore.loadGame).toHaveBeenCalled();
      });
    });

    it('should close modals on cancel', () => {
      render(<ClientOnlyGame />);
      
      // Test save modal
      fireEvent.click(screen.getByTestId('save-button'));
      expect(screen.getByTestId('save-modal')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('cancel-save'));
      expect(screen.queryByTestId('save-modal')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      mockGameStore.error = 'Test error message';
      
      render(<ClientOnlyGame />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should handle invalid test story data', () => {
      Object.defineProperty(window, 'location', {
        value: { 
          search: '?test=true&story=invalid-json',
          href: 'http://localhost:3000'
        },
        writable: true,
      });

      render(<ClientOnlyGame />);
      
      expect(mockGameStore.setError).toHaveBeenCalled();
    });
  });

  describe('Settings Menu', () => {
    beforeEach(() => {
      mockGameStore.currentNode = {
        id: 'current',
        title: 'Current Node',
        content: 'Current content',
        choices: [],
        multimedia: {},
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
      };
    });

    it('should handle settings options', () => {
      window.prompt = jest.fn().mockReturnValue('1');
      
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('settings-button'));
      
      expect(window.prompt).toHaveBeenCalled();
    });

    it('should handle audio toggle in settings', () => {
      window.prompt = jest.fn().mockReturnValue('1');
      window.alert = jest.fn();
      
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('settings-button'));
      
      expect(window.alert).toHaveBeenCalled();
    });

    it('should handle corrupted data cleanup', () => {
      window.prompt = jest.fn().mockReturnValue('3');
      window.confirm = jest.fn().mockReturnValue(true);
      window.alert = jest.fn();
      
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('settings-button'));
      
      expect(mockGameStore.clearCorruptedState).toHaveBeenCalled();
    });

    it('should handle reset all data', () => {
      window.prompt = jest.fn().mockReturnValue('4');
      window.confirm = jest.fn().mockReturnValue(true);
      
      // Mock localStorage and window.location.reload
      const mockClear = jest.fn();
      const mockReload = jest.fn();
      
      Object.defineProperty(window, 'localStorage', {
        value: { clear: mockClear },
        writable: true,
      });
      
      Object.defineProperty(window.location, 'reload', {
        value: mockReload,
        writable: true,
      });
      
      render(<ClientOnlyGame />);
      
      fireEvent.click(screen.getByTestId('settings-button'));
      
      expect(mockClear).toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Progress Display', () => {
    it('should display correct progress information', () => {
      mockGameStore.gameState = {
        currentNodeId: 'start',
        visitedNodes: new Set(['start', 'node-1', 'node-2']),
        choices: {},
        startTime: new Date(),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      render(<ClientOnlyGame />);
      
      expect(screen.getByText(/3 visited/)).toBeInTheDocument();
    });
  });

  describe('Restart Functionality', () => {
    it('should handle restart choice (-1)', () => {
      mockGameStore.currentNode = {
        id: 'current',
        title: 'Current Node',
        content: 'Current content',
        choices: [
          {
            id: 'restart-choice',
            text: 'Restart',
            nextNodeId: '-1',
            conditions: [],
            consequences: [],
          },
        ],
        multimedia: {},
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
      };

      render(<ClientOnlyGame />);
      
      const restartChoice = screen.getByTestId('choice-restart-choice');
      fireEvent.click(restartChoice);
      
      // Should trigger restart instead of normal choice
      expect(mockGameStore.makeChoice).not.toHaveBeenCalled();
    });
  });
});