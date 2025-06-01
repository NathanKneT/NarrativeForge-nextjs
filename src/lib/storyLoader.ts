import { StoryNode } from '@/types/story';

export interface LoadedStory {
  nodes: Map<string, StoryNode>;
  startNodeId: string;
  metadata: StoryMetadata;
}

export interface StoryMetadata {
  title: string;
  author?: string;
  version: string;
  description?: string;
  createdAt: Date;
  estimatedPlayTime?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class StoryLoader {
  private nodes: Map<string, StoryNode> = new Map();
  private startNodeId: string = '';

  constructor(storyData?: StoryNode[]) {
    if (storyData) {
      this.loadStoryData(storyData);
    }
  }

  /**
   * Charge les données d'histoire dans le loader
   */
  private loadStoryData(storyData: StoryNode[]): void {
    this.nodes.clear();

    // Valider et indexer chaque nœud
    for (const node of storyData) {
      if (!node.id || typeof node.id !== 'string') {
        throw new Error(
          `Nœud invalide: ID manquant ou invalide pour le nœud ${JSON.stringify(node)}`
        );
      }
      this.nodes.set(node.id, node);
    }

    // Trouver le nœud de départ
    this.startNodeId = this.findStartNode(storyData);
  }

  /**
   * Valide l'intégrité de l'histoire chargée
   */
  validateStory(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier qu'il y a des nœuds
    if (this.nodes.size === 0) {
      errors.push("Aucun nœud trouvé dans l'histoire");
      return { isValid: false, errors, warnings };
    }

    // Vérifier que le nœud de départ existe
    if (!this.startNodeId) {
      errors.push('Aucun nœud de départ trouvé');
      return { isValid: false, errors, warnings };
    }

    if (!this.nodes.has(this.startNodeId)) {
      errors.push(`Nœud de départ "${this.startNodeId}" introuvable`);
      return { isValid: false, errors, warnings };
    }

    // Valider chaque nœud
    for (const [nodeId, node] of this.nodes) {
      // Vérifier la structure du nœud
      if (!node.title || typeof node.title !== 'string') {
        errors.push(`Nœud "${nodeId}": titre manquant ou invalide`);
      }

      if (!node.content || typeof node.content !== 'string') {
        errors.push(`Nœud "${nodeId}": contenu manquant ou invalide`);
      }

      if (!Array.isArray(node.choices)) {
        errors.push(`Nœud "${nodeId}": choix manquants ou invalides`);
        continue;
      }

      // Vérifier les choix
      for (const choice of node.choices) {
        if (!choice.text || typeof choice.text !== 'string') {
          warnings.push(`Nœud "${nodeId}": choix sans texte`);
        }

        if (
          choice.nextNodeId &&
          choice.nextNodeId !== '-1' &&
          !this.nodes.has(choice.nextNodeId)
        ) {
          errors.push(
            `Nœud "${nodeId}": choix pointe vers un nœud inexistant "${choice.nextNodeId}"`
          );
        }
      }
    }

    // Vérifier l'accessibilité des nœuds
    const accessibleNodes = this.findAccessibleNodes();
    for (const [nodeId] of this.nodes) {
      if (!accessibleNodes.has(nodeId) && nodeId !== this.startNodeId) {
        warnings.push(`Nœud "${nodeId}" n'est pas accessible depuis le début`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Trouve tous les nœuds accessibles depuis le début
   */
  private findAccessibleNodes(): Set<string> {
    const visited = new Set<string>();
    const toVisit = [this.startNodeId];

    while (toVisit.length > 0) {
      const currentId = toVisit.pop();
      if (!currentId || visited.has(currentId)) continue;

      visited.add(currentId);
      const node = this.nodes.get(currentId);

      if (node) {
        for (const choice of node.choices) {
          if (
            choice.nextNodeId &&
            choice.nextNodeId !== '-1' &&
            !visited.has(choice.nextNodeId)
          ) {
            toVisit.push(choice.nextNodeId);
          }
        }
      }
    }

    return visited;
  }

  /**
   * ✅ FIX: Trouve le nœud de départ dans les données - CORRIGÉ
   */
  private findStartNode(storyData: StoryNode[]): string {
    console.log(
      '🔍 Recherche du nœud de départ parmi',
      storyData.length,
      'nœuds'
    );

    // ✅ MÉTHODE 1: Chercher le nœud avec ID "1" d'abord (format migré)
    const nodeOne = storyData.find((node) => node.id === '1');
    if (nodeOne) {
      console.log('✅ Nœud de départ trouvé: ID "1"');
      return nodeOne.id;
    }

    // ✅ MÉTHODE 2: Chercher un nœud avec le tag "début"
    const taggedStartNode = storyData.find(
      (node) => node.metadata.tags && node.metadata.tags.includes('début')
    );
    if (taggedStartNode) {
      console.log('✅ Nœud de départ trouvé par tag:', taggedStartNode.id);
      return taggedStartNode.id;
    }

    // ✅ MÉTHODE 3: Chercher un nœud qui n'est référencé par aucun choix (nœud racine)
    const referencedNodes = new Set<string>();

    for (const node of storyData) {
      for (const choice of node.choices) {
        if (choice.nextNodeId && choice.nextNodeId !== '-1') {
          referencedNodes.add(choice.nextNodeId);
        }
      }
    }

    // Le nœud de départ n'est référencé par aucun choix
    const startNodes = storyData.filter(
      (node) => !referencedNodes.has(node.id)
    );

    if (startNodes.length === 0) {
      console.warn('⚠️ Aucun nœud racine trouvé, utilisation du premier nœud');
      return storyData[0]?.id || '';
    }

    if (startNodes.length > 1) {
      console.warn(
        `⚠️ Plusieurs nœuds de départ potentiels trouvés: ${startNodes.map((n) => n.id).join(', ')}. Utilisation du premier.`
      );
    }

    const startNode = startNodes[0];
    if (!startNode) {
      throw new Error('Nœud de départ non trouvé');
    }

    console.log('✅ Nœud de départ trouvé par analyse:', startNode.id);
    return startNode.id;
  }

  /**
   * Obtient un nœud par son ID
   */
  getNode(nodeId: string): StoryNode | null {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Obtient le nœud de départ
   */
  getStartNode(): StoryNode | null {
    return this.getNode(this.startNodeId);
  }

  /**
   * Obtient l'ID du nœud de départ
   */
  getStartNodeId(): string {
    return this.startNodeId;
  }

  /**
   * Obtient tous les nœuds
   */
  getAllNodes(): StoryNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Obtient le nœud suivant basé sur un choix
   */
  getNextNode(currentNodeId: string, choiceId: string): StoryNode | null {
    const currentNode = this.getNode(currentNodeId);
    if (!currentNode) return null;

    const choice = currentNode.choices.find((c) => c.id === choiceId);
    if (!choice || choice.nextNodeId === '-1') return null;

    return this.getNode(choice.nextNodeId);
  }

  /**
   * Obtient les statistiques de l'histoire
   */
  getStats(): {
    totalNodes: number;
    totalChoices: number;
    averageChoicesPerNode: number;
    maxDepth: number;
  } {
    const nodes = this.getAllNodes();
    const totalChoices = nodes.reduce(
      (sum, node) => sum + node.choices.length,
      0
    );

    return {
      totalNodes: nodes.length,
      totalChoices,
      averageChoicesPerNode: nodes.length > 0 ? totalChoices / nodes.length : 0,
      maxDepth: this.calculateMaxDepth(),
    };
  }

  /**
   * Calcule la profondeur maximale de l'histoire
   */
  private calculateMaxDepth(): number {
    const visited = new Set<string>();

    const traverse = (nodeId: string, depth: number): number => {
      if (visited.has(nodeId) || nodeId === '-1') return depth;

      visited.add(nodeId);
      const node = this.nodes.get(nodeId);

      if (!node || node.choices.length === 0) {
        visited.delete(nodeId);
        return depth;
      }

      let maxChildDepth = depth;
      for (const choice of node.choices) {
        if (choice.nextNodeId && choice.nextNodeId !== '-1') {
          const childDepth = traverse(choice.nextNodeId, depth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      }

      visited.delete(nodeId); // Permettre la réutilisation pour différents chemins
      return maxChildDepth;
    };

    return traverse(this.startNodeId, 0);
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.nodes.clear();
    this.startNodeId = '';
  }
}

// Instance singleton pour faciliter l'utilisation
export const storyLoader = new StoryLoader();
