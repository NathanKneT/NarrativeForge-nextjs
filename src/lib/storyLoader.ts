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

export class StoryLoader {
  private story: LoadedStory | null = null;

  constructor() {
    this.story = null;
  }

  /**
   * Charge une histoire depuis des données JSON avec validation stricte
   */
  async loadFromData(storyData: StoryNode[], metadata?: Partial<StoryMetadata>): Promise<LoadedStory> {
    try {
      // Validation des données d'entrée
      if (!Array.isArray(storyData) || storyData.length === 0) {
        throw new Error('Données d\'histoire invalides: tableau vide ou non-tableau');
      }

      // Créer une Map des nœuds pour un accès rapide
      const nodes = new Map<string, StoryNode>();
      
      // Valider et indexer chaque nœud
      for (const node of storyData) {
        if (!node.id || typeof node.id !== 'string') {
          throw new Error(`Nœud invalide: ID manquant ou invalide pour le nœud ${JSON.stringify(node)}`);
        }

        if (!node.title || typeof node.title !== 'string') {
          throw new Error(`Nœud invalide: titre manquant pour le nœud ${node.id}`);
        }

        if (!node.content || typeof node.content !== 'string') {
          throw new Error(`Nœud invalide: contenu manquant pour le nœud ${node.id}`);
        }

        if (!Array.isArray(node.choices)) {
          throw new Error(`Nœud invalide: choix manquants ou invalides pour le nœud ${node.id}`);
        }

        nodes.set(node.id, node);
      }

      // Déterminer le nœud de départ avec gestion stricte des types
      const startNodeId = this.findStartNode(storyData);
      
      if (!startNodeId) {
        throw new Error('Aucun nœud de départ trouvé dans l\'histoire');
      }

      // Valider que le nœud de départ existe dans la Map
      if (!nodes.has(startNodeId)) {
        throw new Error(`Nœud de départ "${startNodeId}" non trouvé dans les données`);
      }

      // Valider l'intégrité des connexions
      await this.validateStoryIntegrity(nodes);

      // Créer les métadonnées avec valeurs par défaut typées
      const storyMetadata: StoryMetadata = {
        title: metadata?.title || 'Histoire Sans Titre',
        author: metadata?.author || undefined,
        version: metadata?.version || '1.0.0',
        description: metadata?.description || undefined,
        createdAt: metadata?.createdAt || new Date(),
        estimatedPlayTime: metadata?.estimatedPlayTime || undefined,
      };

      const loadedStory: LoadedStory = {
        nodes,
        startNodeId,
        metadata: storyMetadata,
      };

      this.story = loadedStory;
      
      console.log('✅ Histoire chargée avec succès:', {
        totalNodes: nodes.size,
        startNodeId,
        title: storyMetadata.title,
      });

      return loadedStory;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur lors du chargement de l\'histoire:', error);
      throw new Error(`Impossible de charger l'histoire: ${errorMessage}`);
    }
  }

  /**
   * Charge une histoire depuis un fichier JSON
   */
  async loadFromFile(file: File): Promise<LoadedStory> {
    try {
      const fileContent = await this.readFileAsText(file);
      const parsedData = JSON.parse(fileContent);

      // Gérer différents formats de fichier
      if (parsedData.story && Array.isArray(parsedData.story)) {
        // Format avec métadonnées séparées
        return await this.loadFromData(parsedData.story, parsedData.metadata);
      } else if (Array.isArray(parsedData)) {
        // Format simple (tableau de nœuds)
        return await this.loadFromData(parsedData);
      } else if (parsedData.nodes && Array.isArray(parsedData.nodes)) {
        // Format projet éditeur
        const storyNodes = parsedData.nodes.map((editorNode: any) => editorNode.data?.storyNode).filter(Boolean);
        return await this.loadFromData(storyNodes, {
          title: parsedData.name,
          description: parsedData.description,
          version: parsedData.metadata?.version,
          createdAt: parsedData.metadata?.createdAt ? new Date(parsedData.metadata.createdAt) : new Date(),
        });
      } else {
        throw new Error('Format de fichier non reconnu');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors du chargement du fichier: ${errorMessage}`);
    }
  }

  /**
   * Charge une histoire depuis une URL
   */
  async loadFromUrl(url: string): Promise<LoadedStory> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return await this.loadFromData(data.story || data, data.metadata);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors du chargement depuis l'URL: ${errorMessage}`);
    }
  }

  /**
   * Obtient un nœud par son ID avec validation
   */
  getNode(nodeId: string): StoryNode | null {
    if (!this.story) {
      throw new Error('Aucune histoire chargée');
    }

    return this.story.nodes.get(nodeId) || null;
  }

  /**
   * Obtient le nœud de départ
   */
  getStartNode(): StoryNode | null {
    if (!this.story) {
      throw new Error('Aucune histoire chargée');
    }

    return this.getNode(this.story.startNodeId);
  }

  /**
   * Obtient les métadonnées de l'histoire
   */
  getMetadata(): StoryMetadata | null {
    return this.story?.metadata || null;
  }

  /**
   * Vérifie si une histoire est chargée
   */
  isLoaded(): boolean {
    return this.story !== null;
  }

  /**
   * Obtient les statistiques de l'histoire
   */
  getStats(): {
    totalNodes: number;
    totalChoices: number;
    averageChoicesPerNode: number;
    maxDepth: number;
  } | null {
    if (!this.story) return null;

    const nodes = Array.from(this.story.nodes.values());
    const totalChoices = nodes.reduce((sum, node) => sum + node.choices.length, 0);

    return {
      totalNodes: nodes.length,
      totalChoices,
      averageChoicesPerNode: nodes.length > 0 ? totalChoices / nodes.length : 0,
      maxDepth: this.calculateMaxDepth(),
    };
  }

  /**
   * Trouve le nœud de départ dans les données avec gestion stricte des types
   */
  private findStartNode(storyData: StoryNode[]): string {
    // Chercher un nœud qui n'est référencé par aucun choix (nœud racine)
    const referencedNodes = new Set<string>();
    
    for (const node of storyData) {
      for (const choice of node.choices) {
        if (choice.nextNodeId && choice.nextNodeId !== '-1') {
          referencedNodes.add(choice.nextNodeId);
        }
      }
    }

    // Le nœud de départ n'est référencé par aucun choix
    const startNodes = storyData.filter(node => !referencedNodes.has(node.id));
    
    if (startNodes.length === 0) {
      throw new Error('Aucun nœud de départ trouvé (tous les nœuds sont référencés)');
    }

    if (startNodes.length > 1) {
      console.warn(`Plusieurs nœuds de départ potentiels trouvés: ${startNodes.map(n => n.id).join(', ')}. Utilisation du premier.`);
    }

    const startNode = startNodes[0];
    if (!startNode) {
      throw new Error('Nœud de départ non trouvé');
    }

    return startNode.id;
  }

  /**
   * Valide l'intégrité de l'histoire
   */
  private async validateStoryIntegrity(nodes: Map<string, StoryNode>): Promise<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [nodeId, node] of nodes) {
      // Vérifier que tous les choix pointent vers des nœuds existants
      for (const choice of node.choices) {
        if (choice.nextNodeId && choice.nextNodeId !== '-1' && !nodes.has(choice.nextNodeId)) {
          errors.push(`Le nœud "${nodeId}" a un choix pointant vers un nœud inexistant: "${choice.nextNodeId}"`);
        }

        if (!choice.text || choice.text.trim() === '') {
          warnings.push(`Le nœud "${nodeId}" a un choix sans texte`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Erreurs de validation:\n${errors.join('\n')}`);
    }

    if (warnings.length > 0) {
      console.warn(`Avertissements de validation:\n${warnings.join('\n')}`);
    }
  }

  /**
   * Calcule la profondeur maximale de l'histoire
   */
  private calculateMaxDepth(): number {
    if (!this.story) return 0;

    const visited = new Set<string>();
    
    const traverse = (nodeId: string, depth: number): number => {
      if (visited.has(nodeId) || nodeId === '-1') return depth;
      
      visited.add(nodeId);
      const node = this.story!.nodes.get(nodeId);
      
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
    
    return traverse(this.story.startNodeId, 0);
  }

  /**
   * Lit un fichier comme texte avec gestion d'erreur
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event): void => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Erreur lors de la lecture du fichier'));
        }
      };
      
      reader.onerror = (): void => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.story = null;
  }
}

// Instance singleton pour faciliter l'utilisation
export const storyLoader = new StoryLoader();