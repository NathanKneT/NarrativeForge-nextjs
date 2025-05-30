import { StoryExporter } from '@/lib/storyExporter';
import { GraphToStoryConverter } from '@/lib/graphToStoryConverter';
import type { EditorNode, EditorEdge } from '@/types/editor';

// Mock GraphToStoryConverter
jest.mock('@/lib/graphToStoryConverter');

const createMockEditorNode = (overrides: Partial<EditorNode> = {}): EditorNode => ({
  id: 'test-node',
  type: 'storyNode',
  position: { x: 100, y: 100 },
  data: {
    storyNode: {
      id: 'test-node',
      title: 'Test Node',
      content: 'Test content',
      choices: [],
      multimedia: {},
      metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
    },
    nodeType: 'story',
    isStartNode: false,
    isEndNode: false,
  },
  ...overrides,
});

const createMockEditorEdge = (overrides: Partial<EditorEdge> = {}): EditorEdge => ({
  id: 'test-edge',
  source: 'node-1',
  target: 'node-2',
  type: 'smoothstep',
  data: {
    choice: {
      id: 'choice-1',
      text: 'Test choice',
      nextNodeId: 'node-2',
      conditions: [],
      consequences: [],
    }
  },
  ...overrides,
});

describe('StoryExporter', () => {
  const mockConvert = GraphToStoryConverter.convert as jest.MockedFunction<typeof GraphToStoryConverter.convert>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConvert.mockReturnValue({
      story: [
        {
          id: 'start',
          title: 'Start',
          content: 'Beginning',
          choices: [{
            id: 'choice-1',
            text: 'Continue',
            nextNodeId: 'end',
            conditions: [],
            consequences: [],
          }],
          multimedia: {},
          metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
        },
        {
          id: 'end',
          title: 'End',
          content: 'The end',
          choices: [],
          multimedia: {},
          metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
        },
      ],
      startNodeId: 'start',
      errors: [],
      warnings: [],
    });
  });

  describe('exportStory', () => {
    it('should export story in asylum-json format', async () => {
      const nodes = [createMockEditorNode()];
      const edges = [createMockEditorEdge()];
      const options = {
        format: 'asylum-json' as const,
        includeMetadata: true,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toMatch(/asylum-story-.*\.json/);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalNodes).toBe(1);
    });

    it('should export story in JSON format', async () => {
      const nodes = [createMockEditorNode()];
      const edges = [createMockEditorEdge()];
      const options = {
        format: 'json' as const,
        includeMetadata: true,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toMatch(/interactive-story-.*\.json/);
    });

    it('should export story in Twine format', async () => {
      const nodes = [createMockEditorNode()];
      const edges = [createMockEditorEdge()];
      const options = {
        format: 'twine' as const,
        includeMetadata: true,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toMatch(/story-.*\.twee/);
      expect(typeof result.data).toBe('string');
    });

    it('should handle validation errors', async () => {
      const nodes: EditorNode[] = [];
      const edges: EditorEdge[] = [];
      const options = {
        format: 'json' as const,
        includeMetadata: false,
        minify: false,
        validateBeforeExport: true,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle conversion errors', async () => {
      mockConvert.mockReturnValue({
        story: [],
        startNodeId: '',
        errors: ['Conversion failed'],
        warnings: [],
      });

      const nodes = [createMockEditorNode()];
      const edges = [createMockEditorEdge()];
      const options = {
        format: 'json' as const,
        includeMetadata: false,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Conversion failed'))).toBe(true);
    });

    it('should handle unsupported format', async () => {
      const nodes = [createMockEditorNode()];
      const edges = [createMockEditorEdge()];
      const options = {
        format: 'unsupported' as any,
        includeMetadata: false,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('non supporté'))).toBe(true);
    });

    it('should calculate correct statistics', async () => {
      const nodes = [
        createMockEditorNode({ id: 'node-1' }),
        createMockEditorNode({ id: 'node-2' }),
      ];
      const edges = [createMockEditorEdge()];
      const options = {
        format: 'json' as const,
        includeMetadata: false,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(true);
      expect(result.stats.totalNodes).toBe(2);
      expect(result.stats.totalChoices).toBe(0);
      expect(result.stats.fileSize).toBeGreaterThan(0);
    });

    it('should handle minified export', async () => {
      const nodes = [createMockEditorNode()];
      const edges = [createMockEditorEdge()];
      const options = {
        format: 'json' as const,
        includeMetadata: false,
        minify: true,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory(nodes, edges, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Minified JSON should not contain line breaks or extra spaces
      expect(result.data?.includes('\n')).toBe(false);
    });
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats', () => {
      const formats = StoryExporter.getSupportedFormats();

      expect(formats).toHaveLength(3);
      expect(formats.map(f => f.id)).toEqual(['asylum-json', 'json', 'twine']);
      
      formats.forEach(format => {
        expect(format).toHaveProperty('id');
        expect(format).toHaveProperty('name');
        expect(format).toHaveProperty('description');
        expect(format).toHaveProperty('extension');
      });
    });
  });

  describe('downloadExport', () => {
    beforeEach(() => {
      // Mock DOM methods
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockClick = jest.fn();
      
      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => ({
          click: mockClick,
          href: '',
          download: '',
        })),
        writable: true,
      });
      
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true,
      });
      
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true,
      });
    });

    it('should download successful export', () => {
      const result = {
        success: true,
        data: '{"test": "data"}',
        filename: 'test.json',
        errors: [],
        warnings: [],
        stats: { totalNodes: 1, totalChoices: 0, fileSize: 100 },
      };

      expect(() => {
        StoryExporter.downloadExport(result);
      }).not.toThrow();
    });

    it('should throw error for failed export', () => {
      const result = {
        success: false,
        filename: '',
        errors: ['Export failed'],
        warnings: [],
        stats: { totalNodes: 0, totalChoices: 0, fileSize: 0 },
      };

      expect(() => {
        StoryExporter.downloadExport(result);
      }).toThrow('Aucune donnée à télécharger');
    });
  });

  describe('getExportPreview', () => {
    it('should return preview of export data', () => {
      const result = {
        success: true,
        data: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5',
        filename: 'test.txt',
        errors: [],
        warnings: [],
        stats: { totalNodes: 1, totalChoices: 0, fileSize: 100 },
      };

      const preview = StoryExporter.getExportPreview(result, 3);
      expect(preview).toBe('Line 1\nLine 2\nLine 3\n... (2 lignes supplémentaires)');
    });

    it('should return full data if shorter than max lines', () => {
      const result = {
        success: true,
        data: 'Line 1\nLine 2',
        filename: 'test.txt',
        errors: [],
        warnings: [],
        stats: { totalNodes: 1, totalChoices: 0, fileSize: 100 },
      };

      const preview = StoryExporter.getExportPreview(result, 5);
      expect(preview).toBe('Line 1\nLine 2');
    });

    it('should handle failed export', () => {
      const result = {
        success: false,
        filename: '',
        errors: [],
        warnings: [],
        stats: { totalNodes: 0, totalChoices: 0, fileSize: 0 },
      };

      const preview = StoryExporter.getExportPreview(result);
      expect(preview).toBe('Aucune donnée disponible');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodes and edges', async () => {
      const options = {
        format: 'json' as const,
        includeMetadata: false,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory([], [], options);

      expect(result.success).toBe(true);
      expect(result.stats.totalNodes).toBe(0);
    });

    it('should handle nodes with complex metadata', async () => {
      const complexNode = createMockEditorNode({
        data: {
          storyNode: {
            id: 'complex',
            title: 'Complex Node',
            content: 'Complex content with <em>HTML</em>',
            choices: [{
              id: 'choice-1',
              text: 'Choice with conditions',
              nextNodeId: 'next',
              conditions: [{ type: 'variable', target: 'health', operator: '>', value: 50 }],
              consequences: [{ type: 'set_variable', target: 'visited', value: true }],
            }],
            multimedia: {
              backgroundImage: 'bg.jpg',
              soundEffects: ['sound1.mp3'],
            },
            metadata: {
              tags: ['important', 'boss-fight'],
              visitCount: 5,
              difficulty: 'hard',
              lastVisited: new Date(),
            },
          },
          nodeType: 'story',
          isStartNode: false,
          isEndNode: false,
        },
      });

      const options = {
        format: 'json' as const,
        includeMetadata: true,
        minify: false,
        validateBeforeExport: false,
      };

      const result = await StoryExporter.exportStory([complexNode], [], options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});