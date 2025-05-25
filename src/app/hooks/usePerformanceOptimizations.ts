// hooks/usePerformanceOptimizations.ts
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

/**
 * Hook pour optimiser les re-renders avec React.memo et useMemo
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    deps
  );
};

/**
 * Hook pour debouncer les opérations coûteuses
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay, ...deps]
  );
  
  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);
  
  return debouncedCallback as T;
};

/**
 * Hook pour throttler les mises à jour fréquentes
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay, ...deps]
  );
  
  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);
  
  return throttledCallback as T;
};

/**
 * Hook pour monitoring des performances
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[PERF] ${componentName} - Render #${renderCount.current} - ${renderTime.toFixed(2)}ms`
      );
    }
    
    startTime.current = performance.now();
  });
  
  return {
    renderCount: renderCount.current,
    markStart: () => { startTime.current = performance.now(); },
    markEnd: (operation: string) => {
      const duration = performance.now() - startTime.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${componentName}.${operation} - ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
  };
};

// components/optimized/MemoizedStoryNode.tsx
import React, { memo } from 'react';
import { EditorNode } from '@/types/editor';
import { StoryNodeComponent } from '@/components/editor/StoryNodeComponent';

interface MemoizedStoryNodeProps {
  data: EditorNode['data'];
  selected: boolean;
  id: string;
}

export const MemoizedStoryNode = memo<MemoizedStoryNodeProps>(
  ({ data, selected, id }) => {
    return <StoryNodeComponent data={data} selected={selected} />;
  },
  (prevProps, nextProps) => {
    // Custom comparaison pour éviter re-renders inutiles
    return (
      prevProps.selected === nextProps.selected &&
      prevProps.id === nextProps.id &&
      prevProps.data.storyNode.title === nextProps.data.storyNode.title &&
      prevProps.data.storyNode.content === nextProps.data.storyNode.content &&
      prevProps.data.storyNode.choices.length === nextProps.data.storyNode.choices.length
    );
  }
);

MemoizedStoryNode.displayName = 'MemoizedStoryNode';

// utils/performanceUtils.ts
export class PerformanceUtils {
  private static measurements = new Map<string, number>();
  
  /**
   * Marque le début d'une mesure de performance
   */
  static mark(name: string): void {
    this.measurements.set(name, performance.now());
  }
  
  /**
   * Mesure le temps écoulé depuis le mark
   */
  static measure(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`Performance mark "${name}" not found`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.measurements.delete(name);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  /**
   * Exécute une fonction et mesure son temps d'exécution
   */
  static async time<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    this.mark(name);
    try {
      const result = await fn();
      this.measure(name);
      return result;
    } catch (error) {
      this.measure(name);
      throw error;
    }
  }
  
  /**
   * Batch les mises à jour pour éviter les re-renders multiples
   */
  static batchUpdates<T>(updates: (() => void)[]): void {
    // Utilise React's automatic batching en React 18
    updates.forEach(update => update());
  }
  
  /**
   * Crée un observateur d'intersection pour le lazy loading
   */
  static createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    return new IntersectionObserver(callback, defaultOptions);
  }
}

// stores/optimizedGameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GameState, StoryNode, SaveData } from '@/types/story';

interface OptimizedGameStore {
  gameState: GameState | null;
  currentNode: StoryNode | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  
  // Actions optimisées
  initializeGame: (startNodeId: string) => void;
  makeChoice: (choiceId: string, nextNodeId: string) => void;
  saveGame: (saveName: string) => Promise<void>;
  loadGame: (saveData: SaveData) => void;
  restartGame: () => void;
  setCurrentNode: (node: StoryNode) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
  
  // Selectors optimisés
  getVisitedNodesCount: () => number;
  getCurrentNodeChoicesCount: () => number;
  getGameProgress: () => number;
}

export const useOptimizedGameStore = create<OptimizedGameStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      gameState: null,
      currentNode: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => {
        set((state) => {
          state.hasHydrated = hydrated;
        });
      },

      initializeGame: (startNodeId: string) => {
        set((state) => {
          state.gameState = {
            currentNodeId: startNodeId,
            visitedNodes: new Set([startNodeId]),
            choices: {},
            startTime: new Date(),
            playTime: 0,
            variables: {},
            inventory: [],
          };
          state.error = null;
          state.isLoading = false;
        });
      },

      makeChoice: (choiceId: string, nextNodeId: string) => {
        set((state) => {
          if (!state.gameState) return;
          
          state.gameState.currentNodeId = nextNodeId;
          state.gameState.visitedNodes.add(nextNodeId);
          state.gameState.choices[state.gameState.currentNodeId] = choiceId;
        });
      },

      saveGame: async (saveName: string) => {
        const { gameState } = get();
        if (!gameState) return;

        try {
          const { SaveManager } = await import('@/lib/saveManager');
          await SaveManager.saveGame(saveName, gameState);
        } catch (error) {
          set((state) => {
            state.error = 'Erreur lors de la sauvegarde';
          });
          throw error;
        }
      },

      loadGame: (saveData: SaveData) => {
        set((state) => {
          state.gameState = saveData.gameState;
          state.error = null;
        });
      },

      restartGame: () => {
        set((state) => {
          state.gameState = null;
          state.currentNode = null;
          state.error = null;
        });
      },

      setCurrentNode: (node: StoryNode) => {
        set((state) => {
          state.currentNode = node;
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },

      // Selectors optimisés avec memoization
      getVisitedNodesCount: () => {
        const { gameState } = get();
        return gameState?.visitedNodes.size ?? 0;
      },

      getCurrentNodeChoicesCount: () => {
        const { currentNode } = get();
        return currentNode?.choices.length ?? 0;
      },

      getGameProgress: () => {
        const { gameState } = get();
        if (!gameState) return 0;
        // Calcul de progression basé sur les nœuds visités
        // Cette valeur devrait être calculée par rapport au total des nœuds
        return gameState.visitedNodes.size;
      },
    }))
  )
);

// Selectors externes pour éviter les re-renders
export const selectGameState = (state: OptimizedGameStore) => state.gameState;
export const selectCurrentNode = (state: OptimizedGameStore) => state.currentNode;
export const selectIsLoading = (state: OptimizedGameStore) => state.isLoading;
export const selectError = (state: OptimizedGameStore) => state.error;
export const selectVisitedNodesCount = (state: OptimizedGameStore) => 
  state.gameState?.visitedNodes.size ?? 0;

// components/LazyStoryEditor.tsx
import { lazy, Suspense } from 'react';

const StoryEditorLazy = lazy(() => 
  import('@/components/StoryEditor').then(module => ({
    default: module.StoryEditor
  }))
);

const LoadingSpinner = () => (
  <div className="h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-white text-xl animate-pulse">
      Chargement de l'éditeur...
    </div>
  </div>
);

export const LazyStoryEditor = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <StoryEditorLazy {...props} />
  </Suspense>
);

// middleware/performanceMiddleware.ts
export const performanceMiddleware = (config: any) => (set: any, get: any, api: any) =>
  config(
    (...args: any[]) => {
      const start = performance.now();
      set(...args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development' && end - start > 16) {
        console.warn(
          `[PERF WARNING] Store update took ${(end - start).toFixed(2)}ms (>16ms)`
        );
      }
    },
    get,
    api
  );

export default {
  useStableCallback,
  useDebouncedCallback,
  useThrottledCallback,
  usePerformanceMonitor,
  MemoizedStoryNode,
  PerformanceUtils,
  useOptimizedGameStore,
  LazyStoryEditor,
  performanceMiddleware
};