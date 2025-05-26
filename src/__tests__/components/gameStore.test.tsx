import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { useGameStore } from '@/stores/gameStore';
import { createMockStoryNode, createMockLocalStorage } from '../utils/test-utils';
import { SaveData } from '@/types/story';

// Mock du SaveManager
jest.mock('@/lib/saveManager', () => ({
  SaveManager: {
    saveGame: jest.fn<void, []>().mockResolvedValue('mock-save-id'),
    getAllSaves: jest.fn<void, []>().mockReturnValue([]),
    loadSaveById: jest.fn<void, []>().mockReturnValue(null),
    deleteSave: jest.fn<void, []>().mockReturnValue(true),
  },
}));

describe('GameStore', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    // Reset le store avant chaque test
    useGameStore.setState({
      gameState: null,
      currentNode: null,
      isLoading: false,
      error: null,
      hasHydrated: false,
    });

    // Mock localStorage
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeGame', () => {
    it('should initialize game with correct state', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.initializeGame('start-node');
      });

      const gameState = result.current.gameState;
      expect(gameState).not.toBeNull();
      expect(gameState?.currentNodeId).toBe('start-node');
      expect(gameState?.visitedNodes.has('start-node')).toBe(true);
      expect(gameState?.choices).toEqual({});
      expect(gameState?.startTime).toBeInstanceOf(Date);
      expect(result.current.error).toBeNull();
    });

    it('should reset error state when initializing', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.initializeGame('start-node');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('makeChoice', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useGameStore());
      act(() => {
        result.current.initializeGame('node-1');
      });
    });

    it('should update game state when making a choice', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.makeChoice('choice-1', 'node-2');
      });

      const gameState = result.current.gameState;
      expect(gameState?.currentNodeId).toBe('node-2');
      expect(gameState?.visitedNodes.has('node-2')).toBe(true);
      expect(gameState?.choices['node-1']).toBe('choice-1');
    });

    it('should handle multiple choices correctly', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.makeChoice('choice-1', 'node-2');
      });

      act(() => {
        result.current.makeChoice('choice-2', 'node-3');
      });

      const gameState = result.current.gameState;
      expect(gameState?.currentNodeId).toBe('node-3');
      expect(gameState?.visitedNodes.size).toBe(3); // start + node-2 + node-3
      expect(gameState?.choices['node-1']).toBe('choice-1');
      expect(gameState?.choices['node-2']).toBe('choice-2');
    });

    it('should not crash when gameState is null', () => {
      const { result } = renderHook(() => useGameStore());

      // Forcer gameState à null
      act(() => {
        useGameStore.setState({ gameState: null });
      });

      expect(() => {
        act(() => {
          result.current.makeChoice('choice-1', 'node-2');
        });
      }).not.toThrow();
    });
  });

  describe('saveGame', () => {
    it('should call SaveManager.saveGame with correct parameters', async () => {
      const { SaveManager } = await import('@/lib/saveManager');
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.initializeGame('start-node');
      });

      await act(async () => {
        await result.current.saveGame('Test Save');
      });

      expect(SaveManager.saveGame).toHaveBeenCalledWith(
        'Test Save',
        expect.objectContaining({
          currentNodeId: 'start-node',
          visitedNodes: expect.any(Set),
        })
      );
    });

    it('should handle save errors gracefully', async () => {
      const { SaveManager } = await import('@/lib/saveManager');
      (SaveManager.saveGame as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.initializeGame('start-node');
      });

      await expect(
        act(async () => {
          await result.current.saveGame('Test Save');
        })
      ).rejects.toThrow('Save failed');
    });

    it('should not save when gameState is null', async () => {
      const { SaveManager } = await import('@/lib/saveManager');
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.saveGame('Test Save');
      });

      expect(SaveManager.saveGame).not.toHaveBeenCalled();
    });
  });

  describe('loadGame', () => {
    it('should load saved game state correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      const mockSaveData: SaveData = {
        id: 'save-1',
        name: 'Test Save',
        gameState: {
          currentNodeId: 'loaded-node',
          visitedNodes: new Set(['start', 'loaded-node']),
          choices: { start: 'choice-1' },
          startTime: new Date('2024-01-01'),
          playTime: 0,
          variables: {},
          inventory: [],
        },
        timestamp: new Date(),
        storyProgress: 2,
      };

      act(() => {
        result.current.loadGame(mockSaveData);
      });

      expect(result.current.gameState).toEqual(mockSaveData.gameState);
      expect(result.current.error).toBeNull();
    });
  });

  describe('restartGame', () => {
    it('should reset all game state', () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize game first
      act(() => {
        result.current.initializeGame('start-node');
        result.current.setCurrentNode(createMockStoryNode());
        result.current.setError('Some error');
      });

      // Restart
      act(() => {
        result.current.restartGame();
      });

      expect(result.current.gameState).toBeNull();
      expect(result.current.currentNode).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('setCurrentNode', () => {
    it('should update current node', () => {
      const { result } = renderHook(() => useGameStore());
      const mockNode = createMockStoryNode({ id: 'test-node' });

      act(() => {
        result.current.setCurrentNode(mockNode);
      });

      expect(result.current.currentNode).toEqual(mockNode);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');
    });

    it('should clear error when null is passed', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setError('Test error');
      });

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setHasHydrated', () => {
    it('should update hydration status', () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.hasHydrated).toBe(false);

      act(() => {
        result.current.setHasHydrated(true);
      });

      expect(result.current.hasHydrated).toBe(true);
    });
  });
});