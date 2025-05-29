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
        `Il doit y avoir exactement un nœud de départ, trouvé: ${startNodes.length}`
      );
      return { story: [], startNodeId: '', errors, warnings };
    }

    const startNode = startNodes[0];
    if (!startNode) {
      errors.push('Nœud de départ non trouvé');
      return { story: [], startNodeId: '', errors, warnings };
    }

    const startNodeId: string = startNode.id;

    for (const node of nodes) {
      try {
        const convertedNode = this.convertNode(node, edges);
        story.push(convertedNode);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        errors.push(
          `Erreur lors de la conversion du nœud ${node.id}: ${errorMessage}`
        );
      }
    }

    const integrityCheck = this.verifyStoryIntegrity(story);
    warnings.push(...integrityCheck.warnings);
    errors.push(...integrityCheck.errors);

    return {
      story: story.sort((a, b) => {
        if (a.id === startNodeId) return -1;
        if (b.id === startNodeId) return 1;
        const aNum = parseInt(a.id);
        const bNum = parseInt(b.id);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
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
      errors.push('Le graphe ne contient aucun nœud');
      return { isValid: false, errors, warnings };
    }

    const startNodes = nodes.filter((n) => n.data.nodeType === 'start');
    const endNodes = nodes.filter((n) => n.data.nodeType === 'end');

    if (startNodes.length === 0) {
      errors.push('Aucun nœud de départ trouvé');
    }
    if (startNodes.length > 1) {
      errors.push(`Plusieurs nœuds de départ trouvés: ${startNodes.length}`);
    }
    if (endNodes.length === 0) {
      warnings.push('Aucun nœud de fin trouvé');
    }

    for (const node of nodes) {
      if (node.data?.nodeType !== 'end') {
        const outgoingEdges = edges.filter((e) => e.source === node.id);
        if (outgoingEdges.length === 0) {
          warnings.push(
            `Le nœud "${node.data.storyNode.title}" (${node.id}) n'a pas de connexions sortantes`
          );
        }
      }

      if (node.data?.nodeType !== 'start') {
        const incomingEdges = edges.filter((e) => e.target === node.id);
        if (incomingEdges.length === 0) {
          warnings.push(
            `Le nœud "${node.data.storyNode.title}" (${node.id}) n'est pas accessible`
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

    const outgoingEdges = edges.filter((edge) => edge.source === node.id);

    const choices = outgoingEdges.map((edge, index) => {
      const choiceText =
        edge.label ||
        edge.data?.choice?.text ||
        storyNode.choices[index]?.text ||
        `Choix ${index + 1}`;

      const textAsString: string =
        typeof choiceText === 'string' ? choiceText : String(choiceText);

      return {
        id: edge.id || `choice_${node.id}_${index}`,
        text: textAsString,
        nextNodeId: edge.target,
        conditions: edge.data?.choice?.conditions || [],
        consequences: edge.data?.choice?.consequences || [],
      };
    });

    if (choices.length === 0 && storyNode.choices.length > 0) {
      choices.push(
        ...storyNode.choices.map((choice) => ({
          ...choice,
          conditions: choice.conditions ?? [],
          consequences: choice.consequences ?? [],
        }))
      );
    }

    if (node.data?.nodeType === 'end') {
      const hasRestartChoice = choices.some(
        (choice) => choice.nextNodeId === '-1'
      );

      if (!hasRestartChoice) {
        choices.push({
          id: `restart_${node.id}`,
          text: 'Recommencer',
          nextNodeId: '-1',
          conditions: [],
          consequences: [],
        });
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

    for (const node of story) {
      for (const choice of node.choices) {
        if (choice.nextNodeId !== '-1' && !nodeIds.has(choice.nextNodeId)) {
          errors.push(
            `Le choix "${choice.text}" du nœud "${node.title}" (${node.id}) ` +
              `pointe vers un nœud inexistant: ${choice.nextNodeId}`
          );
        }
      }
    }

    const accessibleNodes = new Set<string>();
    const startNode = story.find(
      (n) =>
        story.filter((s) => s.choices.some((c) => c.nextNodeId === n.id))
          .length === 0
    );

    if (startNode) {
      this.findAccessibleNodes(startNode.id, story, accessibleNodes);

      for (const node of story) {
        if (!accessibleNodes.has(node.id) && node.id !== startNode.id) {
          warnings.push(
            `Le nœud "${node.title}" (${node.id}) n'est pas accessible depuis le début`
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
