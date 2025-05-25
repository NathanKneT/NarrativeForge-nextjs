import { create } from 'zustand';
import { GameState, StoryNode, SaveData } from '@/types/story';

interface GameStore {
  gameState: GameState | null;
  currentNode: StoryNode | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  
  initializeGame: (startNodeId: string) => void;
  makeChoice: (choiceId: string, nextNodeId: string) => void;
  saveGame: (saveName: string) => void;
  loadGame: (saveData: SaveData) => void;
  restartGame: () => void;
  setCurrentNode: (node: StoryNode) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  gameState: null,
  currentNode: null,
  isLoading: false,
  error: null,
  hasHydrated: false,

  setHasHydrated: (hydrated: boolean) => {
    set({ hasHydrated: hydrated });
  },

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
    
    console.log('🚀 Jeu initialisé:', { startNodeId });
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

    console.log('🎮 Choix effectué:', { 
      from: gameState.currentNodeId, 
      to: nextNodeId, 
      choice: choiceId,
      totalVisited: updatedGameState.visitedNodes.size 
    });
    set({ gameState: updatedGameState });
  },

  saveGame: async (saveName: string) => {
    const { gameState } = get();
    if (!gameState) return;

    // Utiliser le SaveManager
    try {
      const { SaveManager } = await import('@/lib/saveManager');
      await SaveManager.saveGame(saveName, gameState);
      console.log('💾 Sauvegarde réussie:', saveName);
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
      throw error;
    }
  },

  loadGame: (saveData: SaveData) => {
    set({ 
      gameState: saveData.gameState,
      error: null 
    });
  },

  restartGame: () => {
    console.log('🔄 Redémarrage du jeu');
    set({
      gameState: null,
      currentNode: null,
      error: null,
    });
  },

  setCurrentNode: (node: StoryNode) => {
    console.log('📄 Noeud actuel mis à jour:', { id: node.id, choicesCount: node.choices.length });
    set({ currentNode: node });
  },

  setError: (error: string | null) => {
    if (error) console.error('❌ Erreur:', error);
    set({ error });
  },
}));