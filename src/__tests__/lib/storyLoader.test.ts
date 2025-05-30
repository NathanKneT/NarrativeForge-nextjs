import { StoryLoader } from '@/lib/storyLoader';
import type { StoryNode } from '@/types/story';

// Helper to create mock story nodes
const createMockStoryNode = (overrides: Partial<StoryNode> = {}): StoryNode => ({
  id: 'test-node-1',
  title: 'Test Node',
  content: 'Test content',
  choices: [],
  multimedia: {},
  metadata: {
    tags: ['test'],
    visitCount: 0,
    difficulty: 'medium',
  },
  ...overrides,
});

describe('StoryLoader', () => {
  let storyLoader: StoryLoader;

  beforeEach(() => {
    storyLoader = new StoryLoader();
  });

  describe('Constructor', () => {
    it('should create empty instance without data', () => {
      expect(storyLoader.getAllNodes()).toHaveLength(0);
      expect(storyLoader.getStartNodeId()).toBe('');
    });

    it('should initialize with story data', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'start', metadata: { tags: ['début'], visitCount: 0, difficulty: 'medium' } }),
        createMockStoryNode({ id: 'node-2' }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getAllNodes()).toHaveLength(2);
      expect(loader.getStartNodeId()).toBe('start');
    });
  });

  describe('Finding Start Node', () => {
    it('should find start node by ID "1"', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: '2' }),
        createMockStoryNode({ id: '1' }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getStartNodeId()).toBe('1');
    });

    it('should find start node by "début" tag', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'node-1' }),
        createMockStoryNode({ 
          id: 'start-node', 
          metadata: { tags: ['début'], visitCount: 0, difficulty: 'medium' } 
        }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getStartNodeId()).toBe('start-node');
    });

    it('should find start node as unreferenced node', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start-node',
          choices: [
            {
              id: 'choice-1',
              text: 'Go to node 2',
              nextNodeId: 'node-2',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({ id: 'node-2' }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getStartNodeId()).toBe('start-node');
    });

    it('should handle multiple unreferenced nodes', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'orphan-1' }),
        createMockStoryNode({ id: 'orphan-2' }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getStartNodeId()).toBe('orphan-1'); // First one
    });

    it('should use first node as fallback', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'node-1',
          choices: [
            {
              id: 'choice-1',
              text: 'Go to node 2',
              nextNodeId: 'node-2',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({
          id: 'node-2',
          choices: [
            {
              id: 'choice-2',
              text: 'Go to node 1',
              nextNodeId: 'node-1',
              conditions: [],
              consequences: [],
            },
          ],
        }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getStartNodeId()).toBe('node-1');
    });
  });

  describe('Node Operations', () => {
    beforeEach(() => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'start', title: 'Start Node' }),
        createMockStoryNode({ id: 'middle', title: 'Middle Node' }),
        createMockStoryNode({ id: 'end', title: 'End Node' }),
      ];
      storyLoader = new StoryLoader(mockNodes);
    });

    it('should get existing node', () => {
      const node = storyLoader.getNode('start');
      expect(node).not.toBeNull();
      expect(node?.id).toBe('start');
      expect(node?.title).toBe('Start Node');
    });

    it('should return null for non-existent node', () => {
      const node = storyLoader.getNode('non-existent');
      expect(node).toBeNull();
    });

    it('should return null for empty string', () => {
      const node = storyLoader.getNode('');
      expect(node).toBeNull();
    });

    it('should get start node', () => {
      const startNode = storyLoader.getStartNode();
      expect(startNode).not.toBeNull();
      expect(startNode?.id).toBe('start');
    });

    it('should get all nodes', () => {
      const nodes = storyLoader.getAllNodes();
      expect(nodes).toHaveLength(3);
      expect(nodes.map(n => n.id)).toEqual(['start', 'middle', 'end']);
    });

    it('should return immutable node list', () => {
      const nodes1 = storyLoader.getAllNodes();
      const nodes2 = storyLoader.getAllNodes();
      
      expect(nodes1).toEqual(nodes2);
      expect(nodes1).not.toBe(nodes2); // Different references
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices: [
            {
              id: 'choice-1',
              text: 'Go to middle',
              nextNodeId: 'middle',
              conditions: [],
              consequences: [],
            },
            {
              id: 'choice-restart',
              text: 'Restart',
              nextNodeId: '-1',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({ id: 'middle' }),
      ];
      storyLoader = new StoryLoader(mockNodes);
    });

    it('should get next node from choice', () => {
      const nextNode = storyLoader.getNextNode('start', 'choice-1');
      expect(nextNode).not.toBeNull();
      expect(nextNode?.id).toBe('middle');
    });

    it('should return null for restart choice', () => {
      const nextNode = storyLoader.getNextNode('start', 'choice-restart');
      expect(nextNode).toBeNull();
    });

    it('should return null for invalid choice', () => {
      const nextNode = storyLoader.getNextNode('start', 'invalid-choice');
      expect(nextNode).toBeNull();
    });

    it('should return null for invalid current node', () => {
      const nextNode = storyLoader.getNextNode('invalid-node', 'choice-1');
      expect(nextNode).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate empty story', () => {
      const result = storyLoader.validateStory();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Aucun nœud trouvé dans l\'histoire');
    });

    it('should validate story without start node', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'node-1' }),
      ];
      const loader = new StoryLoader(mockNodes);
      
      // Force empty start node ID for testing
      (loader as any).startNodeId = '';
      
      const result = loader.validateStory();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Aucun nœud de départ trouvé');
    });

    it('should validate missing start node reference', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'node-1' }),
      ];
      const loader = new StoryLoader(mockNodes);
      
      // Force invalid start node ID
      (loader as any).startNodeId = 'missing-start';
      
      const result = loader.validateStory();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nœud de départ "missing-start" introuvable');
    });

    it('should validate node structure', () => {
      const invalidNodes: any[] = [
        {
          id: 'invalid-1',
          // Missing title
          content: 'Content',
          choices: [],
          multimedia: {},
          metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
        },
        {
          id: 'invalid-2',
          title: 'Title',
          // Missing content
          choices: [],
          multimedia: {},
          metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
        },
        {
          id: 'invalid-3',
          title: 'Title',
          content: 'Content',
          // Invalid choices
          choices: 'not-an-array',
          multimedia: {},
          metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
        },
      ];

      const loader = new StoryLoader(invalidNodes);
      const result = loader.validateStory();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate broken choice links', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices: [
            {
              id: 'choice-1',
              text: 'Go to missing node',
              nextNodeId: 'missing-node',
              conditions: [],
              consequences: [],
            },
          ],
        }),
      ];

      const loader = new StoryLoader(mockNodes);
      const result = loader.validateStory();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('missing-node'))).toBe(true);
    });

    it('should detect orphaned nodes', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'start' }),
        createMockStoryNode({ id: 'orphan' }), // Not connected
      ];

      const loader = new StoryLoader(mockNodes);
      const result = loader.validateStory();
      
      expect(result.warnings.some(warning => warning.includes('orphan'))).toBe(true);
    });

    it('should validate choice structure', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices: [
            {
              id: 'choice-1',
              text: '', // Empty text
              nextNodeId: 'start',
              conditions: [],
              consequences: [],
            },
          ],
        }),
      ];

      const loader = new StoryLoader(mockNodes);
      const result = loader.validateStory();
      
      expect(result.warnings.some(warning => warning.includes('choix sans texte'))).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should return zero stats for empty story', () => {
      const stats = storyLoader.getStats();
      expect(stats.totalNodes).toBe(0);
      expect(stats.totalChoices).toBe(0);
      expect(stats.averageChoicesPerNode).toBe(0);
      expect(stats.maxDepth).toBe(0);
    });

    it('should calculate correct statistics', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices: [
            {
              id: 'choice-1',
              text: 'Choice 1',
              nextNodeId: 'middle',
              conditions: [],
              consequences: [],
            },
            {
              id: 'choice-2',
              text: 'Choice 2',
              nextNodeId: 'end',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({
          id: 'middle',
          choices: [
            {
              id: 'choice-3',
              text: 'Choice 3',
              nextNodeId: 'end',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({ id: 'end' }),
      ];

      const loader = new StoryLoader(mockNodes);
      const stats = loader.getStats();
      
      expect(stats.totalNodes).toBe(3);
      expect(stats.totalChoices).toBe(3);
      expect(stats.averageChoicesPerNode).toBe(1); // 3 choices / 3 nodes
      expect(stats.maxDepth).toBe(2); // start -> middle -> end
    });

    it('should calculate max depth for linear story', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'node-1',
          choices: [
            {
              id: 'choice-1',
              text: 'Next',
              nextNodeId: 'node-2',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({
          id: 'node-2',
          choices: [
            {
              id: 'choice-2',
              text: 'Next',
              nextNodeId: 'node-3',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({ id: 'node-3' }),
      ];

      const loader = new StoryLoader(mockNodes);
      const stats = loader.getStats();
      expect(stats.maxDepth).toBe(2);
    });

    it('should handle circular references in depth calculation', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'node-1',
          choices: [
            {
              id: 'choice-1',
              text: 'Go to node 2',
              nextNodeId: 'node-2',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({
          id: 'node-2',
          choices: [
            {
              id: 'choice-2',
              text: 'Go back to node 1',
              nextNodeId: 'node-1',
              conditions: [],
              consequences: [],
            },
          ],
        }),
      ];

      const loader = new StoryLoader(mockNodes);
      const stats = loader.getStats();
      expect(stats.maxDepth).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid node data', () => {
      expect(() => {
        new StoryLoader([
          {
            // Missing id
            title: 'Invalid Node',
            content: 'Content',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          } as any,
        ]);
      }).toThrow();
    });

    it('should handle duplicate node IDs', () => {
      expect(() => {
        new StoryLoader([
          createMockStoryNode({ id: 'duplicate' }),
          createMockStoryNode({ id: 'duplicate' }),
        ]);
      }).not.toThrow(); // Second one overwrites first
    });

    it('should handle empty node ID', () => {
      expect(() => {
        new StoryLoader([
          createMockStoryNode({ id: '' }),
        ]);
      }).toThrow();
    });

    it('should handle null/undefined nodes', () => {
      expect(() => {
        new StoryLoader([null as any]);
      }).toThrow();
    });
  });

  describe('Complex Story Structures', () => {
    it('should handle branching and converging paths', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices: [
            {
              id: 'choice-1',
              text: 'Path A',
              nextNodeId: 'path-a',
              conditions: [],
              consequences: [],
            },
            {
              id: 'choice-2',
              text: 'Path B',
              nextNodeId: 'path-b',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({
          id: 'path-a',
          choices: [
            {
              id: 'choice-3',
              text: 'Converge',
              nextNodeId: 'convergence',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({
          id: 'path-b',
          choices: [
            {
              id: 'choice-4',
              text: 'Converge',
              nextNodeId: 'convergence',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({ id: 'convergence' }),
      ];

      const loader = new StoryLoader(mockNodes);
      const result = loader.validateStory();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple endings', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices: [
            {
              id: 'choice-1',
              text: 'Good path',
              nextNodeId: 'good-end',
              conditions: [],
              consequences: [],
            },
            {
              id: 'choice-2',
              text: 'Bad path',
              nextNodeId: 'bad-end',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({ id: 'good-end' }),
        createMockStoryNode({ id: 'bad-end' }),
      ];

      const loader = new StoryLoader(mockNodes);
      const result = loader.validateStory();
      
      expect(result.isValid).toBe(true);
    });

    it('should handle restart choices', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices: [
            {
              id: 'choice-1',
              text: 'Continue',
              nextNodeId: 'end',
              conditions: [],
              consequences: [],
            },
          ],
        }),
        createMockStoryNode({
          id: 'end',
          choices: [
            {
              id: 'choice-restart',
              text: 'Restart',
              nextNodeId: '-1',
              conditions: [],
              consequences: [],
            },
          ],
        }),
      ];

      const loader = new StoryLoader(mockNodes);
      const result = loader.validateStory();
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Disposal', () => {
    it('should clean up resources', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'start' }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getAllNodes()).toHaveLength(1);
      
      loader.dispose();
      
      expect(loader.getAllNodes()).toHaveLength(0);
      expect(loader.getStartNodeId()).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle story with only one node', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({ id: 'only-node' }),
      ];

      const loader = new StoryLoader(mockNodes);
      expect(loader.getStartNodeId()).toBe('only-node');
      expect(loader.getAllNodes()).toHaveLength(1);
    });

    it('should handle nodes with many choices', () => {
      const choices = Array.from({ length: 50 }, (_, i) => ({
        id: `choice-${i}`,
        text: `Choice ${i}`,
        nextNodeId: `node-${i}`,
        conditions: [],
        consequences: [],
      }));

      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'start',
          choices,
        }),
        ...Array.from({ length: 50 }, (_, i) =>
          createMockStoryNode({ id: `node-${i}` })
        ),
      ];

      const loader = new StoryLoader(mockNodes);
      const stats = loader.getStats();
      
      expect(stats.totalChoices).toBe(50);
      expect(loader.getNode('start')?.choices).toHaveLength(50);
    });

    it('should handle deeply nested story', () => {
      const depth = 20;
      const mockNodes: StoryNode[] = [];

      for (let i = 0; i < depth; i++) {
        const nextNodeId = i < depth - 1 ? `node-${i + 1}` : undefined;
        const choices = nextNodeId
          ? [
              {
                id: `choice-${i}`,
                text: 'Continue',
                nextNodeId,
                conditions: [],
                consequences: [],
              },
            ]
          : [];

        mockNodes.push(
          createMockStoryNode({
            id: i === 0 ? 'start' : `node-${i}`,
            choices,
          })
        );
      }

      const loader = new StoryLoader(mockNodes);
      const stats = loader.getStats();
      
      expect(stats.maxDepth).toBe(depth - 1);
    });

    it('should handle nodes with complex metadata', () => {
      const mockNodes: StoryNode[] = [
        createMockStoryNode({
          id: 'complex-node',
          metadata: {
            tags: ['tag1', 'tag2', 'tag3', 'special-tag'],
            visitCount: 5,
            difficulty: 'hard',
            lastVisited: new Date('2024-01-01'),
          },
        }),
      ];

      const loader = new StoryLoader(mockNodes);
      const node = loader.getNode('complex-node');
      
      expect(node?.metadata.tags).toHaveLength(4);
      expect(node?.metadata.difficulty).toBe('hard');
      expect(node?.metadata.visitCount).toBe(5);
    });
  });
});