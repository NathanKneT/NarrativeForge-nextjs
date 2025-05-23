import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, StoryNode, SaveData } from '@/types/story';

interface GameStore {
  gameState: GameState | null;
  currentNode: StoryNode | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeGame: (startNodeId: string) => void;
  makeChoice: (choiceId: string, nextNodeId: string) => void;
  saveGame: (saveName: string) => void;
  loadGame: (saveData: SaveData) => void;
  restartGame: () => void;
  setCurrentNode: (node: StoryNode) => void;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      currentNode: null,
      isLoading: false,
      error: null,

      initializeGame: (startNodeId: string) => {
        const newGameState: GameState = {
          currentNodeId: startNodeId,
          visitedNodes: new Set([startNodeId]),
          choices: {},
          startTime: new Date(),
          playTime: 0,
          variables: {},
        };
        
        set({ 
          gameState: newGameState, 
          error: null,
          isLoading: false 
        });
      },

      makeChoice: (choiceId: string, nextNodeId: string) => {
        const { gameState } = get();
        if (!gameState) return;

        const updatedGameState = {
          ...gameState,
          currentNodeId: nextNodeId,
          visitedNodes: new Set([...gameState.visitedNodes, nextNodeId]),
          choices: {
            ...gameState.choices,
            [gameState.currentNodeId]: choiceId,
          },
        };

        set({ gameState: updatedGameState });
      },

      saveGame: (saveName: string) => {
        const { gameState } = get();
        if (!gameState) return;

        const saveData: SaveData = {
          id: Date.now().toString(),
          name: saveName,
          gameState,
          timestamp: new Date(),
          storyProgress: gameState.visitedNodes.size,
        };

        // Ici, vous pouvez implémenter la logique de sauvegarde
        localStorage.setItem(`asylum-save-${saveData.id}`, JSON.stringify(saveData));
      },

      loadGame: (saveData: SaveData) => {
        set({ 
          gameState: saveData.gameState,
          error: null 
        });
      },

      restartGame: () => {
        set({
          gameState: null,
          currentNode: null,
          error: null,
        });
      },

      setCurrentNode: (node: StoryNode) => {
        set({ currentNode: node });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'asylum-game-storage',
      partialize: (state) => ({ gameState: state.gameState }),
    }
  )
);