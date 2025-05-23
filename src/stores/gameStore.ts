import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, StoryNode, SaveData } from '@/types/story';

interface GameStore {
  gameState: GameState | null;
  currentNode: StoryNode | null;
  isLoading: boolean;
  error: string | null;
  
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
          inventory: [],
        };
        
        console.log('🚀 Jeu initialisé:', { startNodeId, gameState: newGameState });
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

        console.log('🎮 Choix effectué:', { choiceId, nextNodeId, visitedCount: updatedGameState.visitedNodes.size });
        set({ gameState: updatedGameState });
      },

      saveGame: (saveName: string) => {
        const { gameState } = get();
        if (!gameState) return;

        // Convertir Set en Array pour la sérialisation
        const saveData: SaveData = {
          id: Date.now().toString(),
          name: saveName,
          gameState: {
            ...gameState,
            visitedNodes: new Set(gameState.visitedNodes), // S'assurer que c'est bien un Set
          },
          timestamp: new Date(),
          storyProgress: gameState.visitedNodes.size,
        };

        localStorage.setItem(`asylum-save-${saveData.id}`, JSON.stringify({
          ...saveData,
          gameState: {
            ...saveData.gameState,
            visitedNodes: Array.from(saveData.gameState.visitedNodes), // Convertir en Array
          }
        }));
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
        console.log('📄 Noeud actuel:', { id: node.id, title: node.title, choicesCount: node.choices.length });
        set({ currentNode: node });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'asylum-game-storage',
      partialize: (state) => ({ 
        gameState: state.gameState ? {
          ...state.gameState,
          visitedNodes: Array.from(state.gameState.visitedNodes), // Sérialiser Set comme Array
        } : null 
      }),
      onRehydrateStorage: () => (state) => {
        // Reconvertir Array en Set après hydration
        if (state?.gameState?.visitedNodes && Array.isArray(state.gameState.visitedNodes)) {
          state.gameState.visitedNodes = new Set(state.gameState.visitedNodes as string[]);
        }
      },
    }
  )
);