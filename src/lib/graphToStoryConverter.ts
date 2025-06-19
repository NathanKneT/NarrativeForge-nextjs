import { EditorNode, EditorEdge } from '@/types/editor';
import { StoryNode } from '@/types/story';

export interface ConversionResult {
  story: StoryNode[];
  startNodeId: string;
  errors: string[];
  warnings: string[];
}

export class GraphToStoryConverter {
  static convert(nodes: EditorNode[], edges: EditorEdge[]): ConversionResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const story: StoryNode[] = [];

    console.log('🔄 Converting graph to story:', {
      nodes: nodes.length,
      edges: edges.length
    });

    const validation = this.validateGraph(nodes, edges);
    if (!validation.isValid) {
      return {
        story: [],
        startNodeId: '',
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    const startNodes = nodes.filter((node) => node.data?.nodeType === 'start');
    if (startNodes.length !== 1) {
      errors.push(
        `Exactly one start node required, found: ${startNodes.length}`
      );
      return { story: [], startNodeId: '', errors, warnings };
    }

    const startNode = startNodes[0];
    if (!startNode) {
      errors.push('Start node not found');
      return { story: [], startNodeId: '', errors, warnings };
    }

    const startNodeId: string = startNode.id;

    // Convert each node with improved choice handling
    for (const node of nodes) {
      try {
        const convertedNode = this.convertNode(node, edges);
        story.push(convertedNode);
        
        console.log(`✅ Converted node: ${node.id} with ${convertedNode.choices.length} choices`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error converting node ${node.id}: ${errorMessage}`);
      }
    }

    // Verify story integrity
    const integrityCheck = this.verifyStoryIntegrity(story);
    warnings.push(...integrityCheck.warnings);
    errors.push(...integrityCheck.errors);

    return {
      story: story.sort((a, b) => {
        if (a.id === startNodeId) return -1;
        if (b.id === startNodeId) return 1;
        return a.id.localeCompare(b.id);
      }),
      startNodeId,
      errors,
      warnings,
    };
  }

  private static validateGraph(nodes: EditorNode[], edges: EditorEdge[]) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (nodes.length === 0) {
      errors.push('Graph contains no nodes');
      return { isValid: false, errors, warnings };
    }

    const startNodes = nodes.filter((n) => n.data.nodeType === 'start');
    const endNodes = nodes.filter((n) => n.data.nodeType === 'end');

    if (startNodes.length === 0) {
      errors.push('No start node found');
    }
    if (startNodes.length > 1) {
      errors.push(`Multiple start nodes found: ${startNodes.length}`);
    }
    if (endNodes.length === 0) {
      warnings.push('No end node found');
    }

    // Check node connectivity
    for (const node of nodes) {
      if (node.data?.nodeType !== 'end') {
        const outgoingEdges = edges.filter((e) => e.source === node.id);
        if (outgoingEdges.length === 0) {
          warnings.push(
            `Node "${node.data.storyNode.title}" (${node.id}) has no outgoing connections`
          );
        }
      }

      if (node.data?.nodeType !== 'start') {
        const incomingEdges = edges.filter((e) => e.target === node.id);
        if (incomingEdges.length === 0) {
          warnings.push(
            `Node "${node.data.storyNode.title}" (${node.id}) is not accessible`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static convertNode(node: EditorNode, edges: EditorEdge[]): StoryNode {
    const { storyNode } = node.data;

    // Find all outgoing edges from this node
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    
    console.log(`🔍 Converting node ${node.id}:`, {
      title: storyNode.title,
      outgoingEdges: outgoingEdges.length,
      existingChoices: storyNode.choices.length
    });

    const choices = [];

    // 🔧 FIX: Handle edges properly
    for (const edge of outgoingEdges) {
      let choiceText = 'Continue';
      let choiceId = edge.id;

      // Try to get choice text from multiple sources
      if (edge.label && typeof edge.label === 'string') {
        choiceText = edge.label;
      } else if (edge.data?.choice?.text) {
        choiceText = edge.data.choice.text;
        choiceId = edge.data.choice.id;
      } else {
        // Look for matching choice in the node's choices
        const matchingChoice = storyNode.choices.find(choice => 
          choice.id === edge.sourceHandle || 
          choice.nextNodeId === edge.target
        );
        if (matchingChoice) {
          choiceText = matchingChoice.text;
          choiceId = matchingChoice.id;
        } else {
          // Generate a default choice text
          choiceText = `Option ${choices.length + 1}`;
        }
      }

      const choice = {
        id: choiceId,
        text: choiceText,
        nextNodeId: edge.target,
        conditions: edge.data?.choice?.conditions || [],
        consequences: edge.data?.choice?.consequences || [],
      };

      choices.push(choice);
      
      console.log(`  ✅ Added choice: "${choiceText}" -> ${edge.target}`);
    }

    // 🔧 FIX: If no edges but node has choices, try to preserve them
    if (choices.length === 0 && storyNode.choices.length > 0) {
      console.log(`  ⚠️ No edges found, preserving existing choices`);
      choices.push(...storyNode.choices.map(choice => ({
        ...choice,
        conditions: choice.conditions || [],
        consequences: choice.consequences || [],
      })));
    }

    // 🔧 FIX: Add restart choice for end nodes
    if (node.data?.nodeType === 'end') {
      const hasRestartChoice = choices.some(choice => choice.nextNodeId === '-1');
      if (!hasRestartChoice) {
        choices.push({
          id: `restart_${node.id}`,
          text: 'Restart Story',
          nextNodeId: '-1',
          conditions: [],
          consequences: [],
        });
        console.log(`  ✅ Added restart choice to end node`);
      }
    }

    return {
      ...storyNode,
      choices,
    };
  }

  private static verifyStoryIntegrity(story: StoryNode[]) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nodeIds = new Set(story.map((n) => n.id));

    // Check choice references
    for (const node of story) {
      for (const choice of node.choices) {
        if (choice.nextNodeId !== '-1' && !nodeIds.has(choice.nextNodeId)) {
          errors.push(
            `Choice "${choice.text}" in node "${node.title}" (${node.id}) ` +
              `points to non-existent node: ${choice.nextNodeId}`
          );
        }
      }
    }

    // Check accessibility
    const accessibleNodes = new Set<string>();
    const startNode = story.find(n => 
      story.filter(s => s.choices.some(c => c.nextNodeId === n.id)).length === 0
    );

    if (startNode) {
      this.findAccessibleNodes(startNode.id, story, accessibleNodes);

      for (const node of story) {
        if (!accessibleNodes.has(node.id) && node.id !== startNode.id) {
          warnings.push(
            `Node "${node.title}" (${node.id}) is not accessible from start`
          );
        }
      }
    }

    return { errors, warnings };
  }

  private static findAccessibleNodes(
    nodeId: string,
    story: StoryNode[],
    visited: Set<string>
  ) {
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    const node = story.find((n) => n.id === nodeId);

    if (node) {
      for (const choice of node.choices) {
        if (choice.nextNodeId !== '-1') {
          this.findAccessibleNodes(choice.nextNodeId, story, visited);
        }
      }
    }
  }

  static generateStats(result: ConversionResult) {
    const { story } = result;

    return {
      totalNodes: story.length,
      totalChoices: story.reduce((sum, node) => sum + node.choices.length, 0),
      averageChoicesPerNode:
        story.length > 0
          ? (
              story.reduce((sum, node) => sum + node.choices.length, 0) /
              story.length
            ).toFixed(2)
          : '0',
      endNodes: story.filter((node) => {
        return (
          node.choices.length === 0 ||
          (node.choices.length === 1 && node.choices[0]?.nextNodeId === '-1')
        );
      }).length,
      maxDepth: this.calculateMaxDepth(story, result.startNodeId),
      hasErrors: result.errors.length > 0,
      hasWarnings: result.warnings.length > 0,
    };
  }

  private static calculateMaxDepth(
    story: StoryNode[],
    startNodeId: string
  ): number {
    const visited = new Set<string>();

    const traverse = (nodeId: string, depth: number): number => {
      if (visited.has(nodeId) || nodeId === '-1') return depth;

      visited.add(nodeId);
      const node = story.find((n) => n.id === nodeId);

      if (
        !node ||
        node.choices.length === 0 ||
        (node.choices.length === 1 && node.choices[0]?.nextNodeId === '-1')
      ) {
        return depth;
      }

      let maxChildDepth = depth;
      for (const choice of node.choices) {
        if (choice.nextNodeId !== '-1') {
          const childDepth = traverse(choice.nextNodeId, depth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      }

      visited.delete(nodeId);
      return maxChildDepth;
    };

    return traverse(startNodeId, 0);
  }
}