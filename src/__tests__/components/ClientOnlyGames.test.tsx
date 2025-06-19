import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientOnlyGame } from '@/components/ClientOnlyGame';
import { useGameStore } from '@/stores/gameStore';

// Mock the game store
jest.mock('@/stores/gameStore');

// Mock dynamic story manager - Fixed hoisting issue
jest.mock('@/lib/dynamicStoryManager', () => ({
  dynamicStoryManager: {
    getStory: jest.fn(),
    deleteStory: jest.fn(),
    saveStory: jest.fn(),
    createStoryFromEditor: jest.fn(),
    toggleStoryPublication: jest.fn(),
  },
}));

// Import after mocking
import { dynamicStoryManager } from '@/lib/dynamicStoryManager';

// Mock child components
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
  GameControls: ({
    onSave,
    onLoad,
    onRestart,
    onSettings,
    onToggleMute,
    isMuted,
  }: any) => (
    <div data-testid="game-controls">
      <button onClick={onSave} data-testid="save-button">
        Save
      </button>
      <button onClick={onLoad} data-testid="load-button">
        Load
      </button>
      <button onClick={onRestart} data-testid="restart-button">
        Restart
      </button>
      <button onClick={onSettings} data-testid="settings-button">
        Settings
      </button>
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
        <button
          onClick={() =>
            mode === 'save'
              ? onSave('Test Save')
              : onLoad({
                  id: 'test-save',
                  name: 'Test',
                  gameState: {},
                  timestamp: new Date(),
                  storyProgress: 1,
                })
          }
          data-testid={`confirm-${mode}`}
        >
          {mode === 'save' ? 'Save Game' : 'Load Game'}
        </button>
        <button onClick={onClose} data-testid={`cancel-${mode}`}>
          Cancel
        </button>
      </div>
    );
  },
}));

// Mock StoryLoader
const mockStoryLoader = {
  getNode: jest.fn(),
  getStartNodeId: jest.fn().mockReturnValue('start'),
  getAllNodes: jest.fn(),
  validateStory: jest
    .fn()
    .mockReturnValue({ isValid: true, errors: [], warnings: [] }),
  getNextNode: jest.fn(),
};

jest.mock('@/lib/storyLoader', () => ({
  StoryLoader: jest.fn().mockImplementation(() => mockStoryLoader),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Silence console.log/error in tests
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

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

  const mockStoryProject = {
    metadata: {
      id: 'test-story',
      title: 'Test Story',
      author: 'Test Author',
      description: 'Test Description',
      difficulty: 'Medium' as const,
      estimatedPlayTime: '5-10 min',
      version: '1.0.0',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      tags: ['test'],
      rating: 0,
      totalNodes: 5,
      featured: false,
      published: true,
    },
    story: [
      {
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
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' as const },
      },
    ],
    startNodeId: 'start',
  };

  beforeEach(() => {
    (useGameStore as jest.Mock).mockReturnValue(mockGameStore);
    jest.clearAllMocks();

    // Reset mocks
    (dynamicStoryManager.getStory as jest.Mock).mockResolvedValue(mockStoryProject);
    mockStoryLoader.getNode.mockReturnValue(mockStoryProject.story[0]);
    mockStoryLoader.getAllNodes.mockReturnValue(mockStoryProject.story);

    // Reset window mocks
    delete (window as any).location;
    window.location = {
      search: '',
      href: 'http://localhost:3000',
      reload: jest.fn(),
    } as any;

    window.confirm = jest.fn();
    window.prompt = jest.fn();
    window.alert = jest.fn();
  });

  describe('Initial Loading States', () => {
    it('should render loading state when story is loading', () => {
      (dynamicStoryManager.getStory as jest.Mock).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(<ClientOnlyGame storyId="test-story" />);
      
      expect(screen.getByText('Loading story...')).toBeInTheDocument();
    });

    it('should render loading state when component is initializing', async () => {
      mockGameStore.currentNode = null;

      render(<ClientOnlyGame storyId="test-story" />);

      expect(screen.getByText('Loading story...')).toBeInTheDocument();
    });
  });

  describe('Normal Game Flow', () => {
    beforeEach(() => {
      mockGameStore.currentNode = mockStoryProject.story[0];
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

    it('should render game interface when loaded', async () => {
      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('story-viewer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
      expect(screen.getByTestId('game-controls')).toBeInTheDocument();
    });

    it('should handle choice selection', async () => {
      mockStoryLoader.getNextNode.mockReturnValue({
        id: 'node-2',
        title: 'Node 2',
        content: 'Content',
        choices: [],
        multimedia: {},
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
      });

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('choice-choice-1')).toBeInTheDocument();
      });

      const choice = screen.getByTestId('choice-choice-1');
      fireEvent.click(choice);

      expect(mockGameStore.makeChoice).toHaveBeenCalledWith(
        'choice-1',
        'node-2'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle story loading error', async () => {
      const errorMessage = 'Story not found';
      (dynamicStoryManager.getStory as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        render(<ClientOnlyGame storyId="invalid-story" />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load story')).toBeInTheDocument();
      });
    });

    it('should handle component initialization without crashing', () => {
      mockGameStore.error = 'Test error message';
      mockGameStore.currentNode = null;

      render(<ClientOnlyGame storyId="test-story" />);

      expect(screen.getByText('Loading story...')).toBeInTheDocument();
    });
  });

  describe('Game Controls', () => {
    beforeEach(() => {
      mockGameStore.currentNode = mockStoryProject.story[0];
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

    it('should open save modal', async () => {
      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('save-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-button'));
      expect(screen.getByTestId('save-modal')).toBeInTheDocument();
    });

    it('should open load modal', async () => {
      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('load-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('load-button'));
      expect(screen.getByTestId('load-modal')).toBeInTheDocument();
    });

    it('should handle restart with confirmation', async () => {
      window.confirm = jest.fn().mockReturnValue(true);

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('restart-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('restart-button'));

      expect(window.confirm).toHaveBeenCalled();
      expect(mockGameStore.restartGame).toHaveBeenCalled();
    });

    it('should not restart without confirmation', async () => {
      window.confirm = jest.fn().mockReturnValue(false);

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('restart-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('restart-button'));

      expect(mockGameStore.restartGame).not.toHaveBeenCalled();
    });

    it('should handle mute toggle', async () => {
      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mute-button')).toBeInTheDocument();
      });

      const muteButton = screen.getByTestId('mute-button');
      fireEvent.click(muteButton);

      expect(muteButton).toBeInTheDocument();
    });
  });

  describe('Save/Load Operations', () => {
    beforeEach(() => {
      mockGameStore.currentNode = mockStoryProject.story[0];
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

    it('should handle successful save', async () => {
      mockGameStore.saveGame.mockResolvedValue('save-id-123');

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('save-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-button'));
      fireEvent.click(screen.getByTestId('confirm-save'));

      await waitFor(() => {
        expect(mockGameStore.saveGame).toHaveBeenCalledWith('Test Save');
      });
    });

    it('should handle successful load', async () => {
      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('load-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('load-button'));
      fireEvent.click(screen.getByTestId('confirm-load'));

      await waitFor(() => {
        expect(mockGameStore.loadGame).toHaveBeenCalled();
      });
    });

    it('should close modals on cancel', async () => {
      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('save-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-button'));
      expect(screen.getByTestId('save-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('cancel-save'));
      expect(screen.queryByTestId('save-modal')).not.toBeInTheDocument();
    });
  });

  describe('Settings Menu', () => {
    beforeEach(() => {
      mockGameStore.currentNode = mockStoryProject.story[0];
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

    it('should handle settings options', async () => {
      window.prompt = jest.fn().mockReturnValue('1');
      window.alert = jest.fn();

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('settings-button'));

      expect(window.prompt).toHaveBeenCalled();
    });

    it('should handle audio toggle in settings', async () => {
      window.prompt = jest.fn().mockReturnValue('1');
      window.alert = jest.fn();

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('settings-button'));

      expect(window.alert).toHaveBeenCalled();
    });

    it('should handle corrupted data cleanup', async () => {
      window.prompt = jest.fn().mockReturnValue('3');
      window.confirm = jest.fn().mockReturnValue(true);
      window.alert = jest.fn();

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('settings-button'));

      expect(mockGameStore.clearCorruptedState).toHaveBeenCalled();
    });

    it('should handle reset all data', async () => {
      window.prompt = jest.fn().mockReturnValue('4');
      window.confirm = jest.fn().mockReturnValue(true);

      const mockClear = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { clear: mockClear },
        writable: true,
      });

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('settings-button'));

      expect(mockClear).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Progress Display', () => {
    it('should display correct progress information', async () => {
      mockGameStore.gameState = {
        currentNodeId: 'start',
        visitedNodes: new Set(['start', 'node-1', 'node-2']),
        choices: {},
        startTime: new Date(),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      mockGameStore.currentNode = mockStoryProject.story[0];

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByText(/3 visited/)).toBeInTheDocument();
      });
    });
  });

  describe('Back Button Functionality', () => {
    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = jest.fn();

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" onBack={mockOnBack} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Menu'));
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Restart Functionality', () => {
    it('should handle restart choice (-1)', async () => {
      const restartNode = {
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
        metadata: { tags: [], visitCount: 0, difficulty: 'medium' as const },
      };

      mockGameStore.currentNode = restartNode;
      mockGameStore.gameState = {
        currentNodeId: 'current',
        visitedNodes: new Set(['current']),
        choices: {},
        startTime: new Date(),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      // Mock getNextNode to return null for restart choice
      mockStoryLoader.getNextNode.mockImplementation((currentNodeId, choiceId) => {
        if (choiceId === 'restart-choice') {
          return null; // This should trigger restart logic
        }
        return null;
      });

      mockStoryLoader.getNode.mockImplementation((nodeId) => {
        if (nodeId === 'current') {
          return restartNode;
        }
        return null;
      });

      window.confirm = jest.fn().mockReturnValue(true);

      await act(async () => {
        render(<ClientOnlyGame storyId="test-story" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('choice-restart-choice')).toBeInTheDocument();
      });

      const restartChoice = screen.getByTestId('choice-restart-choice');

      await act(async () => {
        fireEvent.click(restartChoice);
      });

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(mockGameStore.restartGame).toHaveBeenCalled();
      });

      expect(mockGameStore.makeChoice).not.toHaveBeenCalled();
    });
  });
});