import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoryNode, GameState, SaveData } from '@/types/story';
import { SaveManager } from '@/lib/saveManager';

interface GameStore {
  // État du jeu
  gameState: GameState | null;
  currentNode: StoryNode | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeGame: (startNodeId: string) => void;
  setCurrentNode: (node: StoryNode) => void;
  makeChoice: (choiceId: string, nextNodeId: string) => void;
  restartGame: () => void;
  saveGame: (saveName: string) => Promise<void>;
  loadGame: (saveData: SaveData) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // ✅ NEW: Action pour nettoyer un état corrompu
  clearCorruptedState: () => void;

  // Utilitaires
  getVisitedNodesCount: () => number;
  hasVisitedNode: (nodeId: string) => boolean;
  addVisitedNode: (nodeId: string) => void;
}

// ✅ FIX: Fonction pour valider l'état persisté
const validatePersistedState = (state: any): boolean => {
  if (!state?.gameState) return true; // État vide = valide

  const gameState = state.gameState;
  
  // Vérifier que les propriétés essentielles existent
  if (!gameState.currentNodeId || typeof gameState.currentNodeId !== 'string') {
    console.warn('🧹 État persisté invalide: currentNodeId manquant ou invalide');
    return false;
  }

  if (!gameState.visitedNodes) {
    console.warn('🧹 État persisté invalide: visitedNodes manquant');
    return false;
  }

  if (!gameState.startTime) {
    console.warn('🧹 État persisté invalide: startTime manquant');
    return false;
  }

  return true;
};

// ✅ FIX: Fonction de sérialisation sécurisée
const serializeState = (state: any) => {
  try {
    const serialized = {
      ...state,
      state: {
        ...state.state,
        gameState: state.state.gameState ? {
          ...state.state.gameState,
          visitedNodes: Array.from(state.state.gameState.visitedNodes),
          startTime: state.state.gameState.startTime.toISOString(),
        } : null,
      },
    };
    
    console.log('💾 Sérialisation de l\'état:', {
      hasGameState: !!serialized.state.gameState,
      currentNodeId: serialized.state.gameState?.currentNodeId,
      visitedNodes: serialized.state.gameState?.visitedNodes?.length || 0
    });
    
    return JSON.stringify(serialized);
  } catch (error) {
    console.error('❌ Erreur de sérialisation:', error);
    return JSON.stringify({ state: { gameState: null } });
  }
};

// ✅ FIX: Fonction de désérialisation sécurisée
const deserializeState = (str: string) => {
  try {
    const parsed = JSON.parse(str);
    
    // Valider l'état avant de le restaurer
    if (!validatePersistedState(parsed)) {
      console.warn('🧹 État persisté corrompu, réinitialisation...');
      return { state: { gameState: null } };
    }
    
    if (parsed.state?.gameState) {
      parsed.state.gameState = {
        ...parsed.state.gameState,
        visitedNodes: new Set(parsed.state.gameState.visitedNodes || []),
        startTime: new Date(parsed.state.gameState.startTime),
      };
      
      console.log('📂 Désérialisation réussie:', {
        currentNodeId: parsed.state.gameState.currentNodeId,
        visitedNodes: parsed.state.gameState.visitedNodes.size
      });
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Erreur de désérialisation:', error);
    return { state: { gameState: null } };
  }
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // État initial
      gameState: null,
      currentNode: null,
      isLoading: false,
      error: null,

      // Initialiser le jeu
      initializeGame: (startNodeId: string) => {
        console.log('🎮 Initialisation du jeu avec nœud:', startNodeId);
        
        const newGameState: GameState = {
          currentNodeId: startNodeId,
          visitedNodes: new Set([startNodeId]),
          choices: {},
          startTime: new Date(),
          playTime: 0,
          variables: {},
          inventory: [],
        };

        set({
          gameState: newGameState,
          error: null,
          isLoading: false,
        });

        console.log('✅ Jeu initialisé avec succès');
      },

      // Définir le nœud actuel sans modification des métadonnées
      setCurrentNode: (node: StoryNode) => {
        const state = get();
        if (!state.gameState) return;

        // Vérifier si c'est déjà le nœud actuel pour éviter les mises à jour inutiles
        if (state.currentNode?.id === node.id) {
          return;
        }

        // Marquer le nœud comme visité seulement s'il n'était pas déjà visité
        const wasAlreadyVisited = state.gameState.visitedNodes.has(node.id);
        const newVisitedNodes = new Set(state.gameState.visitedNodes);
        newVisitedNodes.add(node.id);

        set({
          currentNode: node,
          gameState: {
            ...state.gameState,
            currentNodeId: node.id,
            visitedNodes: newVisitedNodes,
          },
        });

        if (!wasAlreadyVisited) {
          console.log('📖 Nouveau nœud visité:', node.id, node.title);
        }
      },

      // Faire un choix
      makeChoice: (choiceId: string, nextNodeId: string) => {
        const state = get();
        if (!state.gameState) return;

        const newChoices = {
          ...state.gameState.choices,
          [state.gameState.currentNodeId]: choiceId,
        };

        set({
          gameState: {
            ...state.gameState,
            currentNodeId: nextNodeId,
            choices: newChoices,
          },
        });

        console.log('🎯 Choix effectué:', choiceId, '→', nextNodeId);
      },

      // Redémarrer le jeu
      restartGame: () => {
        console.log('🔄 Redémarrage du jeu');
        set({
          gameState: null,
          currentNode: null,
          error: null,
          isLoading: false,
        });
      },

      // ✅ NEW: Nettoyer un état corrompu
      clearCorruptedState: () => {
        console.log('🧹 Nettoyage de l\'état corrompu');
        set({
          gameState: null,
          currentNode: null,
          error: null,
          isLoading: false,
        });
        
        // Nettoyer le localStorage
        try {
          localStorage.removeItem('asylum-game-storage');
          console.log('🧹 Storage nettoyé');
        } catch (error) {
          console.warn('⚠️ Impossible de nettoyer le storage:', error);
        }
      },

      // Sauvegarder le jeu
      saveGame: async (saveName: string) => {
        const state = get();
        if (!state.gameState) {
          throw new Error('Aucun état de jeu à sauvegarder');
        }

        try {
          set({ isLoading: true });
          const saveId = await SaveManager.saveGame(saveName, state.gameState);
          set({ isLoading: false, error: null });
          console.log('💾 Jeu sauvegardé:', saveId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur de sauvegarde';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      // Charger le jeu
      loadGame: (saveData: SaveData) => {
        try {
          set({
            gameState: saveData.gameState,
            error: null,
            isLoading: false,
            currentNode: null,
          });
          console.log('📂 Jeu chargé:', saveData.name);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement';
          set({ error: errorMessage });
          throw error;
        }
      },

      // Définir une erreur
      setError: (error: string | null) => {
        set({ error });
        if (error) {
          console.error('❌ Erreur de jeu:', error);
        }
      },

      // Définir l'état de chargement
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Obtenir le nombre de nœuds visités
      getVisitedNodesCount: () => {
        const state = get();
        return state.gameState?.visitedNodes.size || 0;
      },

      // Vérifier si un nœud a été visité
      hasVisitedNode: (nodeId: string) => {
        const state = get();
        return state.gameState?.visitedNodes.has(nodeId) || false;
      },

      // Ajouter un nœud visité
      addVisitedNode: (nodeId: string) => {
        const state = get();
        if (!state.gameState) return;

        const newVisitedNodes = new Set(state.gameState.visitedNodes);
        newVisitedNodes.add(nodeId);

        set({
          gameState: {
            ...state.gameState,
            visitedNodes: newVisitedNodes,
          },
        });
      },
    }),
    {
      name: 'asylum-game-storage',
      // ✅ FIX: Utilisation de la nouvelle API storage avec validation
      storage: {
        getItem: (name: string) => {
          try {
            const item = localStorage.getItem(name);
            if (!item) return null;
            
            const parsed = deserializeState(item);
            return parsed;
          } catch (error) {
            console.error('❌ Erreur de lecture du storage:', error);
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          try {
            const serialized = serializeState(value);
            localStorage.setItem(name, serialized);
          } catch (error) {
            console.error('❌ Erreur d\'écriture du storage:', error);
          }
        },
        removeItem: (name: string) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('❌ Erreur de suppression du storage:', error);
          }
        },
      },
      // ✅ FIX: Persister seulement l'état du jeu, pas le nœud actuel
      partialize: (state) => ({
        gameState: state.gameState,
      }),
      // ✅ FIX: Version pour forcer la réinitialisation si nécessaire
      version: 1,
      // ✅ FIX: Migration pour nettoyer les anciens états
      migrate: (persistedState: any, version: number) => {
        console.log('🔄 Migration du store depuis version', version);
        
        if (version === 0) {
          // Nettoyer les anciens états corrompus
          console.log('🧹 Migration v0→v1: nettoyage des anciens états');
          return { gameState: null };
        }
        
        return persistedState;
      },
    }
  )
);