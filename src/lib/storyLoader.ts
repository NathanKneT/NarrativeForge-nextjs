import { StoryNode } from '@/types/story';

export class StoryLoader {
  private nodes: Map<string, StoryNode> = new Map();
  private startNodeId: string = '';

  constructor(storyData: StoryNode[]) {
    this.loadStory(storyData);
  }

  private loadStory(storyData: StoryNode[]): void {
    // Charger tous les noeuds dans la Map
    storyData.forEach(node => {
      this.nodes.set(node.id, node);
    });

    // Définir le noeud de départ - le vrai début de l'histoire est le nœud 1
    const startNode = storyData.find(node => node.id === '1');
    if (startNode) {
      this.startNodeId = startNode.id;
    } else if (storyData.length > 0) {
      this.startNodeId = storyData[0].id;
    }

    console.log('📚 Histoire chargée:', {
      totalNodes: storyData.length,
      startNodeId: this.startNodeId,
      firstFewNodes: storyData.slice(0, 3).map(n => ({ id: n.id, choicesCount: n.choices.length }))
    });
  }

  getNode(id: string): StoryNode | null {
    const node = this.nodes.get(id);
    if (!node) {
      console.warn(`❌ Noeud non trouvé: ${id}`);
    }
    return node || null;
  }

  getStartNodeId(): string {
    return this.startNodeId;
  }

  getAllNodes(): StoryNode[] {
    return Array.from(this.nodes.values());
  }

  getNextNode(currentNodeId: string, choiceId: string): StoryNode | null {
    const currentNode = this.getNode(currentNodeId);
    if (!currentNode) {
      console.warn(`❌ Noeud actuel non trouvé: ${currentNodeId}`);
      return null;
    }

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) {
      console.warn(`❌ Choix non trouvé: ${choiceId} dans le noeud ${currentNodeId}`);
      return null;
    }

    // Gestion spéciale pour "Recommencer" (nextNodeId === "-1")
    if (choice.nextNodeId === '-1') {
      console.log('🔄 Redémarrage demandé');
      return null; // Retourner null pour signaler un redémarrage
    }

    console.log(`🎯 Navigation: ${currentNodeId} -> ${choice.nextNodeId} (choix: ${choice.text})`);
    return this.getNode(choice.nextNodeId);
  }

  // Validation de l'intégrité de l'histoire
  validateStory(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.nodes.forEach((node, nodeId) => {
      // Vérifier que tous les choix pointent vers des noeuds existants ou vers -1 (recommencer)
      node.choices.forEach(choice => {
        if (choice.nextNodeId !== '-1' && !this.nodes.has(choice.nextNodeId)) {
          errors.push(`Node "${nodeId}" has choice "${choice.id}" pointing to non-existent node "${choice.nextNodeId}"`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}