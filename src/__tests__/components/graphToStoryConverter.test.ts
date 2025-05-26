import { GraphToStoryConverter } from '@/lib/graphToStoryConverter';
import { createMockEditorNode, createMockEditorEdge } from '../utils/test-utils';
import { EditorNode, EditorEdge } from '@/types/editor';

describe('GraphToStoryConverter', () => {
  describe('convert', () => {
    it('should convert a simple linear story correctly', () => {
      const startNode = createMockEditorNode({
        id: 'start',
        data: {
          storyNode: {
            id: 'start',
            title: 'Beginning',
            content: 'The story begins...',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
          nodeType: 'start',
          isStartNode: true,
        },
      });

      const storyNode = createMockEditorNode({
        id: 'story-1',
        data: {
          storyNode: {
            id: 'story-1',
            title: 'Middle',
            content: 'The story continues...',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
          nodeType: 'story',
        },
      });

      const endNode = createMockEditorNode({
        id: 'end',
        data: {
          storyNode: {
            id: 'end',
            title: 'End',
            content: 'The story ends.',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
          nodeType: 'end',
          isEndNode: true,
        },
      });

      const edge1 = createMockEditorEdge({
        id: 'edge-1',
        source: 'start',
        target: 'story-1',
        label: 'Continue',
      });

      const edge2 = createMockEditorEdge({
        id: 'edge-2',
        source: 'story-1',
        target: 'end',
        label: 'Finish',
      });

      const nodes: EditorNode[] = [startNode, storyNode, endNode];
      const edges: EditorEdge[] = [edge1, edge2];

      const result = GraphToStoryConverter.convert(nodes, edges);

      expect(result.errors).toHaveLength(0);
      expect(result.story).toHaveLength(3);
      expect(result.startNodeId).toBe('start');
      
      // Vérifier que les choix ont été correctement générés
      const startStoryNode = result.story.find(n => n.id === 'start');
      expect(startStoryNode?.choices).toHaveLength(1);
      expect(startStoryNode?.choices[0].text).toBe('Continue');
      expect(startStoryNode?.choices[0].nextNodeId).toBe('story-1');

      // Vérifier que le nœud de fin a un bouton "Recommencer"
      const endStoryNode = result.story.find(n => n.id === 'end');
      expect(endStoryNode?.choices).toHaveLength(1);
      expect(endStoryNode?.choices[0].text).toBe('Recommencer');
      expect(endStoryNode?.choices[0].nextNodeId).toBe('-1');
    });

    it('should handle branching stories with multiple choices', () => {
      const startNode = createMockEditorNode({
        id: 'start',
        data: {
          nodeType: 'start',
          isStartNode: true,
          storyNode: {
            id: 'start',
            title: 'Choose your path',
            content: 'Where do you want to go?',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        },
      });

      const leftNode = createMockEditorNode({
        id: 'left',
        data: {
          nodeType: 'story',
          storyNode: {
            id: 'left',
            title: 'Left Path',
            content: 'You went left.',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        },
      });

      const rightNode = createMockEditorNode({
        id: 'right',
        data: {
          nodeType: 'story',
          storyNode: {
            id: 'right',
            title: 'Right Path',
            content: 'You went right.',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        },
      });

      const leftEdge = createMockEditorEdge({
        source: 'start',
        target: 'left',
        label: 'Go left',
      });

      const rightEdge = createMockEditorEdge({
        source: 'start',
        target: 'right',
        label: 'Go right',
      });

      const nodes: EditorNode[] = [startNode, leftNode, rightNode];
      const edges: EditorEdge[] = [leftEdge, rightEdge];

      const result = GraphToStoryConverter.convert(nodes, edges);

      expect(result.errors).toHaveLength(0);
      
      const startStoryNode = result.story.find(n => n.id === 'start');
      expect(startStoryNode?.choices).toHaveLength(2);
      
      const choices = startStoryNode?.choices || [];
      expect(choices.some(c => c.text === 'Go left' && c.nextNodeId === 'left')).toBe(true);
      expect(choices.some(c => c.text === 'Go right' && c.nextNodeId === 'right')).toBe(true);
    });

    it('should detect validation errors', () => {
      // Test avec aucun nœud
      let result = GraphToStoryConverter.convert([], []);
      expect(result.errors).toContain('Le graphe ne contient aucun nœud');

      // Test sans nœud de départ
      const storyNode = createMockEditorNode({
        data: { nodeType: 'story' },
      });
      result = GraphToStoryConverter.convert([storyNode], []);
      expect(result.errors).toContain('Aucun nœud de départ trouvé');

      // Test avec plusieurs nœuds de départ
      const start1 = createMockEditorNode({
        id: 'start1',
        data: { nodeType: 'start', isStartNode: true },
      });
      const start2 = createMockEditorNode({
        id: 'start2',
        data: { nodeType: 'start', isStartNode: true },
      });
      result = GraphToStoryConverter.convert([start1, start2], []);
      expect(result.errors).toContain('Plusieurs nœuds de départ trouvés: 2');
    });

    it('should generate warnings for disconnected nodes', () => {
      const startNode = createMockEditorNode({
        id: 'start',
        data: {
          nodeType: 'start',
          isStartNode: true,
          storyNode: {
            id: 'start',
            title: 'Start',
            content: 'Beginning',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        },
      });

      const orphanNode = createMockEditorNode({
        id: 'orphan',
        data: {
          nodeType: 'story',
          storyNode: {
            id: 'orphan',
            title: 'Orphan',
            content: 'Disconnected node',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        },
      });

      const result = GraphToStoryConverter.convert([startNode, orphanNode], []);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Orphan'))).toBe(true);
    });
  });

  describe('generateStats', () => {
    it('should calculate correct statistics', () => {
      const startNode = createMockEditorNode({
        id: 'start',
        data: { nodeType: 'start', isStartNode: true },
      });

      const storyNode = createMockEditorNode({
        id: 'story',
        data: { nodeType: 'story' },
      });

      const endNode = createMockEditorNode({
        id: 'end',
        data: { nodeType: 'end', isEndNode: true },
      });

      const edge1 = createMockEditorEdge({
        source: 'start',
        target: 'story',
      });

      const edge2 = createMockEditorEdge({
        source: 'story',
        target: 'end',
      });

      const result = GraphToStoryConverter.convert(
        [startNode, storyNode, endNode],
        [edge1, edge2]
      );

      const stats = GraphToStoryConverter.generateStats(result);

      expect(stats.totalNodes).toBe(3);
      expect(stats.totalChoices).toBeGreaterThan(0);
      expect(stats.endNodes).toBe(1);
      expect(parseFloat(stats.averageChoicesPerNode)).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle nodes with no outgoing connections', () => {
      const startNode = createMockEditorNode({
        id: 'start',
        data: {
          nodeType: 'start',
          isStartNode: true,
          storyNode: {
            id: 'start',
            title: 'Dead End Start',
            content: 'This leads nowhere',
            choices: [],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        },
      });

      const result = GraphToStoryConverter.convert([startNode], []);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.story).toHaveLength(1);
    });

    it('should preserve existing choices when no edges are present', () => {
      const nodeWithChoices = createMockEditorNode({
        id: 'node-with-choices',
        data: {
          nodeType: 'story',
          storyNode: {
            id: 'node-with-choices',
            title: 'Has Choices',
            content: 'This node has predefined choices',
            choices: [
              {
                id: 'choice-1',
                text: 'Original choice',
                nextNodeId: 'some-node',
                conditions: [],
                consequences: [],
              },
            ],
            multimedia: {},
            metadata: { tags: [], visitCount: 0, difficulty: 'medium' },
          },
        },
      });

      const result = GraphToStoryConverter.convert([nodeWithChoices], []);

      const convertedNode = result.story.find(n => n.id === 'node-with-choices');
      expect(convertedNode?.choices).toHaveLength(1);
      expect(convertedNode?.choices[0].text).toBe('Original choice');
    });

    it('should handle malformed edge data gracefully', () => {
      const startNode = createMockEditorNode({
        id: 'start',
        data: { nodeType: 'start', isStartNode: true },
      });

      const targetNode = createMockEditorNode({
        id: 'target',
        data: { nodeType: 'story' },
      });

      const malformedEdge = createMockEditorEdge({
        source: 'start',
        target: 'target',
        label: undefined, // Test avec label undefined
        data: undefined, // Test avec data undefined
      });

      const result = GraphToStoryConverter.convert(
        [startNode, targetNode],
        [malformedEdge]
      );

      expect(result.errors).toHaveLength(0);
      
      const startStoryNode = result.story.find(n => n.id === 'start');
      expect(startStoryNode?.choices).toHaveLength(1);
      expect(startStoryNode?.choices[0].text).toContain('Choix'); // Texte par défaut
    });
  });
});