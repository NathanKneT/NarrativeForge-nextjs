// __tests__/setup.ts
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Global test setup
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock performance
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

// __tests__/utils/testUtils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';

// Custom render function with providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReactFlowProvider>
      {children}
    </ReactFlowProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockStoryNode = (overrides = {}) => ({
  id: 'test-node-1',
  title: 'Test Node',
  content: 'Test content',
  choices: [],
  multimedia: {},
  metadata: {
    tags: [],
    visitCount: 0,
    difficulty: 'medium' as const,
  },
  ...overrides,
});

export const createMockEditorNode = (overrides = {}) => ({
  id: 'editor-node-1',
  type: 'storyNode',
  position: { x: 0, y: 0 },
  data: {
    storyNode: createMockStoryNode(),
    nodeType: 'story' as const,
    isStartNode: false,
    isEndNode: false,
  },
  dragHandle: '.drag-handle',
  ...overrides,
});

export const createMockGameState = (overrides = {}) => ({
  currentNodeId: 'node-1',
  visitedNodes: new Set(['node-1']),
  choices: {},
  startTime: new Date(),
  playTime: 0,
  variables: {},
  inventory: [],
  ...overrides,
});

// __tests__/lib/storyLoader.test.ts
import { StoryLoader } from '@/lib/storyLoader';
import { StoryNode } from '@/types/story';

describe('StoryLoader', () => {
  const mockStoryData: StoryNode[] = [
    {
      id: '1',
      title: 'Start',
      content: 'Beginning of story',
      choices: [
        {
          id: 'choice-1',
          text: 'Go left',
          nextNodeId: '2',
          conditions: [],
          consequences: [],
        },
      ],
      multimedia: {},
      metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
    },
    {
      id: '2',
      title: 'Left Path',
      content: 'You went left',
      choices: [],
      multimedia: {},
      metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
    },
  ];

  let storyLoader: StoryLoader;

  beforeEach(() => {
    storyLoader = new StoryLoader(mockStoryData);
  });

  describe('Constructor', () => {
    it('should load story data correctly', () => {
      expect(storyLoader.getAllNodes()).toHaveLength(2);
      expect(storyLoader.getStartNodeId()).toBe('1');
    });

    it('should handle empty story data', () => {
      const emptyLoader = new StoryLoader([]);
      expect(emptyLoader.getAllNodes()).toHaveLength(0);
      expect(emptyLoader.getStartNodeId()).toBe('');
    });
  });

  describe('getNode', () => {
    it('should return correct node for valid ID', () => {
      const node = storyLoader.getNode('1');
      expect(node).toBeDefined();
      expect(node?.id).toBe('1');
      expect(node?.title).toBe('Start');
    });

    it('should return null for invalid ID', () => {
      const node = storyLoader.getNode('999');
      expect(node).toBeNull();
    });

    it('should return null for empty string ID', () => {
      const node = storyLoader.getNode('');
      expect(node).toBeNull();
    });
  });

  describe('getNextNode', () => {
    it('should return correct next node', () => {
      const nextNode = storyLoader.getNextNode('1', 'choice-1');
      expect(nextNode).toBeDefined();
      expect(nextNode?.id).toBe('2');
    });

    it('should return null for restart choice', () => {
      const mockDataWithRestart: StoryNode[] = [
        {
          ...mockStoryData[0],
          choices: [
            {
              id: 'restart-choice',
              text: 'Restart',
              nextNodeId: '-1',
              conditions: [],
              consequences: [],
            },
          ],
        },
      ];
      const loaderWithRestart = new StoryLoader(mockDataWithRestart);
      const nextNode = loaderWithRestart.getNextNode('1', 'restart-choice');
      expect(nextNode).toBeNull();
    });

    it('should return null for invalid choice', () => {
      const nextNode = storyLoader.getNextNode('1', 'invalid-choice');
      expect(nextNode).toBeNull();
    });
  });

  describe('validateStory', () => {
    it('should validate valid story successfully', () => {
      const validation = storyLoader.validateStory();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid node references', () => {
      const invalidStoryData: StoryNode[] = [
        {
          id: '1',
          title: 'Start',
          content: 'Beginning',
          choices: [
            {
              id: 'choice-1',
              text: 'Go to invalid node',
              nextNodeId: '999', // Invalid reference
              conditions: [],
              consequences: [],
            },
          ],
          multimedia: {},
          metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
        },
      ];
      
      const invalidLoader = new StoryLoader(invalidStoryData);
      const validation = invalidLoader.validateStory();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});

// __tests__/lib/graphToStoryConverter.test.ts
import { GraphToStoryConverter } from '@/lib/graphToStoryConverter';
import { EditorNode, EditorEdge } from '@/types/editor';
import { createMockEditorNode } from '../utils/testUtils';

describe('GraphToStoryConverter', () => {
  describe('convert', () => {
    it('should convert simple graph correctly', () => {
      const nodes: EditorNode[] = [
        createMockEditorNode({
          id: 'story-1',
          data: {
            storyNode: {
              id: 'story-1',
              title: 'Story Node',
              content: 'Story content',
              choices: [],
              multimedia: {},
              metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
            },
            nodeType: 'story',
          },
        }),
      ];

      const edges: EditorEdge[] = [
        {
          id: 'edge-1',
          source: 'start-1',
          target: 'story-1',
          label: 'Continue',
        },
      ];

      const result = GraphToStoryConverter.convert(nodes, edges);
      
      expect(result.errors).toHaveLength(0);
      expect(result.story).toHaveLength(2);
      expect(result.startNodeId).toBe('start-1');
    });

    it('should detect missing start node', () => {
      const nodes: EditorNode[] = [
        createMockEditorNode({
          data: { ...createMockEditorNode().data, nodeType: 'story' },
        }),
      ];

      const result = GraphToStoryConverter.convert(nodes, []);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('nœud de départ');
    });

    it('should detect multiple start nodes', () => {
      const nodes: EditorNode[] = [
        createMockEditorNode({
          id: 'start-1',
          data: { ...createMockEditorNode().data, nodeType: 'start' },
        }),
        createMockEditorNode({
          id: 'start-2',
          data: { ...createMockEditorNode().data, nodeType: 'start' },
        }),
      ];

      const result = GraphToStoryConverter.convert(nodes, []);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('un seul nœud de départ');
    });
  });

  describe('generateStats', () => {
    it('should generate correct statistics', () => {
      const mockResult = {
        story: [
          { id: '1', choices: [{ id: 'c1' }, { id: 'c2' }] },
          { id: '2', choices: [] },
        ] as any,
        startNodeId: '1',
        errors: [],
        warnings: [],
      };

      const stats = GraphToStoryConverter.generateStats(mockResult);
      
      expect(stats.totalNodes).toBe(2);
      expect(stats.totalChoices).toBe(2);
      expect(stats.endNodes).toBe(1);
      expect(stats.averageChoicesPerNode).toBe('1.00');
    });
  });
});

// __tests__/stores/gameStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '@/stores/gameStore';
import { createMockGameState, createMockStoryNode } from '../utils/testUtils';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store state
    useGameStore.getState().restartGame();
  });

  describe('initializeGame', () => {
    it('should initialize game with start node', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.initializeGame('start-node');
      });

      const gameState = result.current.gameState;
      expect(gameState).toBeDefined();
      expect(gameState?.currentNodeId).toBe('start-node');
      expect(gameState?.visitedNodes.has('start-node')).toBe(true);
    });
  });

  describe('makeChoice', () => {
    it('should update game state when making choice', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.initializeGame('start-node');
      });

      act(() => {
        result.current.makeChoice('choice-1', 'next-node');
      });

      const gameState = result.current.gameState;
      expect(gameState?.currentNodeId).toBe('next-node');
      expect(gameState?.visitedNodes.has('next-node')).toBe(true);
      expect(gameState?.choices['start-node']).toBe('choice-1');
    });
  });

  describe('restartGame', () => {
    it('should reset game state', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.initializeGame('start-node');
        result.current.makeChoice('choice-1', 'next-node');
      });

      act(() => {
        result.current.restartGame();
      });

      expect(result.current.gameState).toBeNull();
      expect(result.current.currentNode).toBeNull();
    });
  });
});

// __tests__/components/StoryViewer.test.tsx
import { render, screen, fireEvent } from '../utils/testUtils';
import { StoryViewer } from '@/components/StoryViewer';
import { createMockStoryNode } from '../utils/testUtils';

describe('StoryViewer', () => {
  const mockOnChoiceSelect = jest.fn();

  beforeEach(() => {
    mockOnChoiceSelect.mockClear();
  });

  it('should render story node content', () => {
    const node = createMockStoryNode({
      title: 'Test Title',
      content: 'Test content',
    });

    render(
      <StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render choices as buttons', () => {
    const node = createMockStoryNode({
      choices: [
        {
          id: 'choice-1',
          text: 'Choice 1',
          nextNodeId: 'next-1',
          conditions: [],
          consequences: [],
        },
        {
          id: 'choice-2',
          text: 'Choice 2',
          nextNodeId: 'next-2',
          conditions: [],
          consequences: [],
        },
      ],
    });

    render(
      <StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />
    );

    expect(screen.getByText('Choice 1')).toBeInTheDocument();
    expect(screen.getByText('Choice 2')).toBeInTheDocument();
  });

  it('should call onChoiceSelect when choice is clicked', () => {
    const node = createMockStoryNode({
      choices: [
        {
          id: 'choice-1',
          text: 'Choice 1',
          nextNodeId: 'next-1',
          conditions: [],
          consequences: [],
        },
      ],
    });

    render(
      <StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />
    );

    fireEvent.click(screen.getByText('Choice 1'));
    expect(mockOnChoiceSelect).toHaveBeenCalledWith('choice-1');
  });

  it('should handle HTML content correctly', () => {
    const node = createMockStoryNode({
      content: '<p>Test <strong>bold</strong> content</p>',
    });

    render(
      <StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />
    );

    expect(screen.getByText('bold')).toBeInTheDocument();
  });
});

// __tests__/components/editor/StoryNodeComponent.test.tsx
import { render, screen } from '../../utils/testUtils';
import { StoryNodeComponent } from '@/components/editor/StoryNodeComponent';
import { createMockStoryNode } from '../../utils/testUtils';

describe('StoryNodeComponent', () => {
  it('should render node title and content', () => {
    const data = {
      storyNode: createMockStoryNode({
        title: 'Test Node',
        content: 'Test content for node',
      }),
      nodeType: 'story' as const,
    };

    render(<StoryNodeComponent data={data} />);

    expect(screen.getByText('Test Node')).toBeInTheDocument();
    expect(screen.getByText('Test content for node')).toBeInTheDocument();
  });

  it('should truncate long content', () => {
    const longContent = 'A'.repeat(150);
    const data = {
      storyNode: createMockStoryNode({
        content: longContent,
      }),
      nodeType: 'story' as const,
    };

    render(<StoryNodeComponent data={data} />);

    const displayedContent = screen.getByText(/A+\.\.\./);
    expect(displayedContent).toBeInTheDocument();
  });

  it('should display correct number of choices', () => {
    const data = {
      storyNode: createMockStoryNode({
        choices: [
          { id: '1', text: 'Choice 1', nextNodeId: '2', conditions: [], consequences: [] },
          { id: '2', text: 'Choice 2', nextNodeId: '3', conditions: [], consequences: [] },
        ],
      }),
      nodeType: 'story' as const,
    };

    render(<StoryNodeComponent data={data} />);

    expect(screen.getByText('2 choix')).toBeInTheDocument();
  });

  it('should render difficulty indicator', () => {
    const data = {
      storyNode: createMockStoryNode({
        metadata: {
          tags: [],
          visitCount: 0,
          difficulty: 'hard',
        },
      }),
      nodeType: 'story' as const,
    };

    render(<StoryNodeComponent data={data} />);

    expect(screen.getByText('Difficile')).toBeInTheDocument();
  });
});

// __tests__/integration/storyFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import { StoryViewer } from '@/components/StoryViewer';
import { useGameStore } from '@/stores/gameStore';
import { StoryLoader } from '@/lib/storyLoader';
import { createMockStoryNode } from '../utils/testUtils';

describe('Story Flow Integration', () => {
  it('should navigate through story correctly', async () => {
    const storyData = [
      createMockStoryNode({
        id: '1',
        title: 'Start',
        content: 'Beginning of story',
        choices: [
          {
            id: 'choice-1',
            text: 'Continue',
            nextNodeId: '2',
            conditions: [],
            consequences: [],
          },
        ],
      }),
      createMockStoryNode({
        id: '2',
        title: 'Middle',
        content: 'Middle of story',
        choices: [],
      }),
    ];

    const storyLoader = new StoryLoader(storyData);
    
    // Mock implementation for full integration test
    const TestComponent = () => {
      const { gameState, currentNode, initializeGame, makeChoice, setCurrentNode } = useGameStore();
      
      React.useEffect(() => {
        initializeGame('1');
        setCurrentNode(storyLoader.getNode('1')!);
      }, []);

      const handleChoice = (choiceId: string) => {
        const nextNode = storyLoader.getNextNode(gameState!.currentNodeId, choiceId);
        if (nextNode) {
          makeChoice(choiceId, nextNode.id);
          setCurrentNode(nextNode);
        }
      };

      if (!currentNode) return <div>Loading...</div>;

      return <StoryViewer node={currentNode} onChoiceSelect={handleChoice} />;
    };

    render(<TestComponent />);

    // Should start with first node
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Beginning of story')).toBeInTheDocument();

    // Click choice to navigate
    fireEvent.click(screen.getByText('Continue'));

    // Should navigate to second node
    await waitFor(() => {
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('Middle of story')).toBeInTheDocument();
    });
  });
});

// __tests__/performance/performanceOptimizations.test.ts
import { renderHook } from '@testing-library/react';
import { useStableCallback, useDebouncedCallback, usePerformanceMonitor } from '@/hooks/usePerformanceOptimizations';

describe('Performance Optimizations', () => {
  describe('useStableCallback', () => {
    it('should return stable callback reference', () => {
      const mockFn = jest.fn();
      const { result, rerender } = renderHook(
        ({ value }) => useStableCallback(() => mockFn(value), [value]),
        { initialProps: { value: 1 } }
      );

      const callback1 = result.current;
      
      rerender({ value: 1 });
      const callback2 = result.current;
      
      expect(callback1).toBe(callback2);
    });

    it('should update callback when dependencies change', () => {
      const mockFn = jest.fn();
      const { result, rerender } = renderHook(
        ({ value }) => useStableCallback(() => mockFn(value), [value]),
        { initialProps: { value: 1 } }
      );

      const callback1 = result.current;
      
      rerender({ value: 2 });
      const callback2 = result.current;
      
      expect(callback1).not.toBe(callback2);
    });
  });

  describe('useDebouncedCallback', () => {
    jest.useFakeTimers();

    it('should debounce callback execution', () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(mockFn, 100, [])
      );

      result.current();
      result.current();
      result.current();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('usePerformanceMonitor', () => {
    it('should track render count', () => {
      const { result, rerender } = renderHook(() => 
        usePerformanceMonitor('TestComponent')
      );

      expect(result.current.renderCount).toBe(1);

      rerender();
      expect(result.current.renderCount).toBe(2);
    });
  });
});

// jest.config.js
module.exports = {
  preset: 'next/jest',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapping: {
    '^@/(.*)Node({
          id: 'start-1',
          data: {
            storyNode: {
              id: 'start-1',
              title: 'Start',
              content: 'Beginning',
              choices: [],
              multimedia: {},
              metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
            },
            nodeType: 'start',
            isStartNode: true,
          },
        }),
        createMockEditor: '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)Node({
          id: 'start-1',
          data: {
            storyNode: {
              id: 'start-1',
              title: 'Start',
              content: 'Beginning',
              choices: [],
              multimedia: {},
              metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
            },
            nodeType: 'start',
            isStartNode: true,
          },
        }),
        createMockEditor: ['babel-jest', { presets: ['next/babel'] }],
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(reactflow|@reactflow)/)',
  ],
};

// package.json scripts addition
/*
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit"
  }
}
*/Node({
          id: 'start-1',
          data: {
            storyNode: {
              id: 'start-1',
              title: 'Start',
              content: 'Beginning',
              choices: [],
              multimedia: {},
              metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
            },
            nodeType: 'start',
            isStartNode: true,
          },
        }),
        createMockEditor