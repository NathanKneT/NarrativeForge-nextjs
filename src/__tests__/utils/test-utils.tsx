import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { StoryNode, Choice } from '@/types/story';
import { EditorNode, EditorEdge, StoryProject } from '@/types/editor';

// Interface pour les providers de test
interface TestProvidersProps {
  children: ReactNode;
}

// Wrapper avec tous les providers nécessaires pour les tests
const TestProviders: React.FC<TestProvidersProps> = ({ children }) => {
  return (
    <ReactFlowProvider>
      {children}
    </ReactFlowProvider>
  );
};

// Fonction de rendu personnalisée avec providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: TestProviders, ...options });

// Utilitaires pour créer des données de test

/**
 * Crée un StoryNode de test avec des valeurs par défaut
 */
export function createMockStoryNode(overrides: Partial<StoryNode> = {}): StoryNode {
  return {
    id: 'test-node-1',
    title: 'Test Node',
    content: 'Test content for the story node',
    choices: [],
    multimedia: {},
    metadata: {
      tags: ['test'],
      visitCount: 0,
      difficulty: 'medium',
    },
    ...overrides,
  };
}

/**
 * Crée un Choice de test avec des valeurs par défaut
 */
export function createMockChoice(overrides: Partial<Choice> = {}): Choice {
  return {
    id: 'test-choice-1',
    text: 'Test Choice',
    nextNodeId: 'test-node-2',
    conditions: [],
    consequences: [],
    ...overrides,
  };
}

/**
 * Crée un EditorNode de test avec des valeurs par défaut
 */
export function createMockEditorNode(overrides: Partial<EditorNode> = {}): EditorNode {
  const defaultStoryNode = createMockStoryNode();
  
  return {
    id: 'editor-node-1',
    type: 'storyNode',
    position: { x: 100, y: 100 },
    data: {
      storyNode: defaultStoryNode,
      nodeType: 'story',
      isStartNode: false,
      isEndNode: false,
    },
    ...overrides,
  };
}

/**
 * Crée un EditorEdge de test avec des valeurs par défaut
 */
export function createMockEditorEdge(overrides: Partial<EditorEdge> = {}): EditorEdge {
  const defaultChoice = createMockChoice();
  
  return {
    id: 'editor-edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
    data: {
      choice: defaultChoice,
    },
    ...overrides,
  };
}

/**
 * Crée un StoryProject de test avec des valeurs par défaut
 */
export function createMockStoryProject(overrides: Partial<StoryProject> = {}): StoryProject {
  return {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test story project',
    nodes: [],
    edges: [],
    metadata: {
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      version: '1.0.0',
      author: 'Test Author',
    },
    ...overrides,
  };
}

/**
 * Crée une histoire complète de test avec plusieurs nœuds connectés
 */
export function createMockStoryFlow(): {
  nodes: EditorNode[];
  edges: EditorEdge[];
  project: StoryProject;
} {
  const startNode = createMockEditorNode({
    id: 'start-node',
    type: 'startNode',
    data: {
      storyNode: createMockStoryNode({
        id: 'start-node',
        title: 'Début de l\'histoire',
        content: 'Vous vous réveillez dans une forêt mystérieuse...',
        choices: [
          createMockChoice({
            id: 'choice-1',
            text: 'Explorer vers le nord',
            nextNodeId: 'story-node-1',
          }),
          createMockChoice({
            id: 'choice-2',
            text: 'Explorer vers le sud',
            nextNodeId: 'story-node-2',
          }),
        ],
      }),
      nodeType: 'start',
      isStartNode: true,
      isEndNode: false,
    },
  });

  const storyNode1 = createMockEditorNode({
    id: 'story-node-1',
    type: 'storyNode',
    position: { x: 50, y: 200 },
    data: {
      storyNode: createMockStoryNode({
        id: 'story-node-1',
        title: 'Chemin du Nord',
        content: 'Vous découvrez un village abandonné...',
        choices: [
          createMockChoice({
            id: 'choice-3',
            text: 'Entrer dans le village',
            nextNodeId: 'end-node-1',
          }),
        ],
      }),
      nodeType: 'story',
      isStartNode: false,
      isEndNode: false,
    },
  });

  const storyNode2 = createMockEditorNode({
    id: 'story-node-2',
    type: 'storyNode',
    position: { x: 250, y: 200 },
    data: {
      storyNode: createMockStoryNode({
        id: 'story-node-2',
        title: 'Chemin du Sud',
        content: 'Vous trouvez une rivière cristalline...',
        choices: [
          createMockChoice({
            id: 'choice-4',
            text: 'Suivre la rivière',
            nextNodeId: 'end-node-2',
          }),
        ],
      }),
      nodeType: 'story',
      isStartNode: false,
      isEndNode: false,
    },
  });

  const endNode1 = createMockEditorNode({
    id: 'end-node-1',
    type: 'endNode',
    position: { x: 50, y: 300 },
    data: {
      storyNode: createMockStoryNode({
        id: 'end-node-1',
        title: 'Fin - Village',
        content: 'Vous découvrez les secrets du village...',
        choices: [
          createMockChoice({
            id: 'restart-1',
            text: 'Recommencer',
            nextNodeId: '-1',
          }),
        ],
      }),
      nodeType: 'end',
      isStartNode: false,
      isEndNode: true,
    },
  });

  const endNode2 = createMockEditorNode({
    id: 'end-node-2',
    type: 'endNode',
    position: { x: 250, y: 300 },
    data: {
      storyNode: createMockStoryNode({
        id: 'end-node-2',
        title: 'Fin - Rivière',
        content: 'La rivière vous mène vers la liberté...',
        choices: [
          createMockChoice({
            id: 'restart-2',
            text: 'Recommencer',
            nextNodeId: '-1',
          }),
        ],
      }),
      nodeType: 'end',
      isStartNode: false,
      isEndNode: true,
    },
  });

  const nodes = [startNode, storyNode1, storyNode2, endNode1, endNode2];

  const edges = [
    createMockEditorEdge({
      id: 'edge-1',
      source: 'start-node',
      target: 'story-node-1',
      sourceHandle: 'choice-1',
      data: {
        choice: startNode.data.storyNode.choices[0],
      },
    }),
    createMockEditorEdge({
      id: 'edge-2',
      source: 'start-node',
      target: 'story-node-2',
      sourceHandle: 'choice-2',
      data: {
        choice: startNode.data.storyNode.choices[1],
      },
    }),
    createMockEditorEdge({
      id: 'edge-3',
      source: 'story-node-1',
      target: 'end-node-1',
      sourceHandle: 'choice-3',
      data: {
        choice: storyNode1.data.storyNode.choices[0],
      },
    }),
    createMockEditorEdge({
      id: 'edge-4',
      source: 'story-node-2',
      target: 'end-node-2',
      sourceHandle: 'choice-4',
      data: {
        choice: storyNode2.data.storyNode.choices[0],
      },
    }),
  ];

  const project = createMockStoryProject({
    id: 'mock-story-flow',
    name: 'Histoire de Test',
    description: 'Une histoire de test avec plusieurs chemins',
    nodes,
    edges,
  });

  return { nodes, edges, project };
}

/**
 * Simule localStorage pour les tests
 */
export function createMockLocalStorage(): Storage {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(store).length;
    },
  };
}

/**
 * Mock pour l'API Notification
 */
export function mockNotificationAPI(): void {
  // Mock Notification constructor
  (global as any).Notification = class MockNotification {
    static permission: NotificationPermission = 'granted';
    
    static requestPermission(): Promise<NotificationPermission> {
      return Promise.resolve('granted');
    }
    
    constructor(public title: string, public options?: NotificationOptions) {
      // Mock notification
    }
    
    close(): void {
      // Mock close
    }
  };
}

/**
 * Utilitaires pour les tests d'accessibilité
 */
export function createAccessibilityTestWrapper(component: ReactElement): ReactElement {
  return (
    <div role="application" aria-label="Story Editor Test">
      {component}
    </div>
  );
}

/**
 * Mock pour les tests de performance
 */
export function mockPerformanceAPI(): void {
  if (typeof global.performance === 'undefined') {
    (global as any).performance = {
      now: (): number => Date.now(),
      mark: (): void => {},
      measure: (): void => {},
      getEntriesByType: (): any[] => [],
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
    };
  }
}

/**
 * Matchers Jest personnalisés pour les tests
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidStoryNode(): R;
      toBeValidChoice(): R;
      toBeValidEditorNode(): R;
    }
  }
}

// Matcher pour valider un StoryNode
expect.extend({
  toBeValidStoryNode(received: unknown) {
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => 'Expected value to be a StoryNode object',
        pass: false,
      };
    }

    const node = received as any;
    
    const hasValidId = typeof node.id === 'string' && node.id.length > 0;
    const hasValidTitle = typeof node.title === 'string' && node.title.length > 0;
    const hasValidContent = typeof node.content === 'string';
    const hasValidChoices = Array.isArray(node.choices);
    const hasValidMetadata = typeof node.metadata === 'object' && node.metadata !== null;

    const isValid = hasValidId && hasValidTitle && hasValidContent && hasValidChoices && hasValidMetadata;

    return {
      message: () => isValid 
        ? `Expected ${JSON.stringify(received)} not to be a valid StoryNode`
        : `Expected ${JSON.stringify(received)} to be a valid StoryNode with id, title, content, choices array, and metadata`,
      pass: isValid,
    };
  },

  toBeValidChoice(received: unknown) {
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => 'Expected value to be a Choice object',
        pass: false,
      };
    }

    const choice = received as any;
    
    const hasValidId = typeof choice.id === 'string' && choice.id.length > 0;
    const hasValidText = typeof choice.text === 'string' && choice.text.length > 0;
    const hasValidNextNodeId = typeof choice.nextNodeId === 'string';
    const hasValidConditions = Array.isArray(choice.conditions);
    const hasValidConsequences = Array.isArray(choice.consequences);

    const isValid = hasValidId && hasValidText && hasValidNextNodeId && hasValidConditions && hasValidConsequences;

    return {
      message: () => isValid
        ? `Expected ${JSON.stringify(received)} not to be a valid Choice`
        : `Expected ${JSON.stringify(received)} to be a valid Choice with id, text, nextNodeId, conditions array, and consequences array`,
      pass: isValid,
    };
  },

  toBeValidEditorNode(received: unknown) {
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => 'Expected value to be an EditorNode object',
        pass: false,
      };
    }

    const node = received as any;
    
    const hasValidId = typeof node.id === 'string' && node.id.length > 0;
    const hasValidType = typeof node.type === 'string';
    const hasValidPosition = typeof node.position === 'object' && 
                           typeof node.position.x === 'number' && 
                           typeof node.position.y === 'number';
    const hasValidData = typeof node.data === 'object' && node.data !== null;
    const hasValidStoryNode = node.data.storyNode && typeof node.data.storyNode === 'object';

    const isValid = hasValidId && hasValidType && hasValidPosition && hasValidData && hasValidStoryNode;

    return {
      message: () => isValid
        ? `Expected ${JSON.stringify(received)} not to be a valid EditorNode`
        : `Expected ${JSON.stringify(received)} to be a valid EditorNode with id, type, position, and data.storyNode`,
      pass: isValid,
    };
  },
});

/**
 * Utilitaires pour les tests d'intégration
 */
export function waitForReactFlow(): Promise<void> {
  return new Promise(resolve => {
    // Attendre que React Flow soit initialisé
    setTimeout(resolve, 100);
  });
}

/**
 * Helper pour tester les erreurs TypeScript au runtime
 */
export function expectTypeError<T>(fn: () => T): void {
  try {
    fn();
    throw new Error('Expected function to throw a type error');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Expected function to throw')) {
      throw error;
    }
    // C'est l'erreur attendue
  }
}

// Re-export tout ce dont on a besoin
export * from '@testing-library/react';
import '@testing-library/jest-dom';
export { customRender as render };
export { TestProviders };