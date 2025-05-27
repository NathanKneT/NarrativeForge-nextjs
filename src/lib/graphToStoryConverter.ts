import { EditorNode, EditorEdge } from '@/types/editor';
import { StoryNode } from '@/types/story';

export interface ConversionResult {
  story: StoryNode[];
  startNodeId: string;
  errors: string[];
  warnings: string[];
}

export class GraphToStoryConverter {
  /**
   * Convertit un graphe React Flow vers le format JSON du jeu
   */
  static convert(nodes: EditorNode[], edges: EditorEdge[]): ConversionResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const story: StoryNode[] = [];
    
    // Validation préliminaire
    const validation = this.validateGraph(nodes, edges);
    if (!validation.isValid) {
      return {
        story: [],
        startNodeId: '',
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Trouver le nœud de départ avec gestion stricte des types
    const startNodes = nodes.filter(node => node.data?.nodeType === 'start');
    if (startNodes.length !== 1) {
      errors.push(`Il doit y avoir exactement un nœud de départ, trouvé: ${startNodes.length}`);
      return { story: [], startNodeId: '', errors, warnings };
    }

    const startNode = startNodes[0];
    if (!startNode) {
      errors.push('Nœud de départ non trouvé');
      return { story: [], startNodeId: '', errors, warnings };
    }

    const startNodeId: string = startNode.id;

    // Convertir chaque nœud avec gestion d'erreur stricte
    for (const node of nodes) {
      try {
        const convertedNode = this.convertNode(node, edges);
        story.push(convertedNode);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        errors.push(`Erreur lors de la conversion du nœud ${node.id}: ${errorMessage}`);
      }
    }

    // Vérification finale de l'intégrité
    const integrityCheck = this.verifyStoryIntegrity(story);
    warnings.push(...integrityCheck.warnings);
    errors.push(...integrityCheck.errors);

    return {
      story: story.sort((a, b) => {
        // Placer le nœud de départ en premier
        if (a.id === startNodeId) return -1;
        if (b.id === startNodeId) return 1;
        // Puis trier par ID numérique si possible
        const aNum = parseInt(a.id);
        const bNum = parseInt(b.id);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.id.localeCompare(b.id);
      }),
      startNodeId,
      errors,
      warnings
    };
  }

  /**
   * Valide la structure du graphe
   */
  private static validateGraph(nodes: EditorNode[], edges: EditorEdge[]) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifications de base
    if (nodes.length === 0) {
      errors.push('Le graphe ne contient aucun nœud');
      return { isValid: false, errors, warnings };
    }

    const startNodes = nodes.filter(n => n.data.nodeType === 'start');
    const endNodes = nodes.filter(n => n.data.nodeType === 'end');

    if (startNodes.length === 0) {
      errors.push('Aucun nœud de départ trouvé');
    }
    if (startNodes.length > 1) {
      errors.push(`Plusieurs nœuds de départ trouvés: ${startNodes.length}`);
    }
    if (endNodes.length === 0) {
      warnings.push('Aucun nœud de fin trouvé');
    }

    // Vérifier la connectivité avec gestion stricte des types
    for (const node of nodes) {
      if (node.data?.nodeType !== 'end') {
        const outgoingEdges = edges.filter(e => e.source === node.id);
        if (outgoingEdges.length === 0) {
          warnings.push(`Le nœud "${node.data.storyNode.title}" (${node.id}) n'a pas de connexions sortantes`);
        }
      }

      if (node.data?.nodeType !== 'start') {
        const incomingEdges = edges.filter(e => e.target === node.id);
        if (incomingEdges.length === 0) {
          warnings.push(`Le nœud "${node.data.storyNode.title}" (${node.id}) n'est pas accessible`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convertit un nœud individuel avec gestion stricte des types
   */
  private static convertNode(node: EditorNode, edges: EditorEdge[]): StoryNode {
    const { storyNode } = node.data;
    
    // Trouver toutes les connexions sortantes pour ce nœud
    const outgoingEdges = edges.filter(edge => edge.source === node.id);
    
    // Créer les choix basés sur les connexions avec validation stricte
    const choices = outgoingEdges.map((edge, index) => {
      // Utiliser le label de l'edge s'il existe, sinon créer un texte par défaut
      const choiceText = edge.label || 
                        edge.data?.choice?.text || 
                        (storyNode.choices[index]?.text) || 
                        `Choix ${index + 1}`;

      // Assurer que choiceText est une string (pour exactOptionalPropertyTypes)
      const textAsString: string = typeof choiceText === 'string' ? choiceText : String(choiceText);

      return {
        id: edge.id || `choice_${node.id}_${index}`,
        text: textAsString,
        nextNodeId: edge.target,
        conditions: edge.data?.choice?.conditions || [],
        consequences: edge.data?.choice?.consequences || []
      };
    });

    // Si le nœud original avait des choix mais pas de connexions,
    // préserver les choix originaux (peut arriver pendant l'édition)
    if (choices.length === 0 && storyNode.choices.length > 0) {
      choices.push(...storyNode.choices.map(choice => ({
        ...choice,
        conditions: choice.conditions ?? [],
        consequences: choice.consequences ?? []
      })));
    }

    // AJOUT AUTOMATIQUE DU BOUTON RECOMMENCER POUR LES NŒUDS DE FIN
    if (node.data?.nodeType === 'end') {
      // Vérifier si le bouton recommencer n'existe pas déjà
      const hasRestartChoice = choices.some(choice => choice.nextNodeId === '-1');
      
      if (!hasRestartChoice) {
        choices.push({
          id: `restart_${node.id}`,
          text: 'Recommencer',
          nextNodeId: '-1',
          conditions: [],
          consequences: []
        });
      }
    }

    return {
      ...storyNode,
      choices
    };
  }

  /**
   * Vérifie l'intégrité de l'histoire convertie
   */
  private static verifyStoryIntegrity(story: StoryNode[]) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nodeIds = new Set(story.map(n => n.id));

    for (const node of story) {
      for (const choice of node.choices) {
        // Vérifier que nextNodeId existe (sauf pour les fins -1)
        if (choice.nextNodeId !== '-1' && !nodeIds.has(choice.nextNodeId)) {
          errors.push(
            `Le choix "${choice.text}" du nœud "${node.title}" (${node.id}) ` +
            `pointe vers un nœud inexistant: ${choice.nextNodeId}`
          );
        }
      }
    }

    // Vérifier les nœuds inaccessibles avec gestion stricte des types
    const accessibleNodes = new Set<string>();
    const startNode = story.find(n => 
      story.filter(s => s.choices.some(c => c.nextNodeId === n.id)).length === 0
    );
    
    if (startNode) {
      this.findAccessibleNodes(startNode.id, story, accessibleNodes);
      
      for (const node of story) {
        if (!accessibleNodes.has(node.id) && node.id !== startNode.id) {
          warnings.push(`Le nœud "${node.title}" (${node.id}) n'est pas accessible depuis le début`);
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Trouve tous les nœuds accessibles depuis un nœud donné
   */
  private static findAccessibleNodes(nodeId: string, story: StoryNode[], visited: Set<string>) {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    const node = story.find(n => n.id === nodeId);
    
    if (node) {
      for (const choice of node.choices) {
        if (choice.nextNodeId !== '-1') {
          this.findAccessibleNodes(choice.nextNodeId, story, visited);
        }
      }
    }
  }

  /**
   * Génère des statistiques sur la conversion
   */
  static generateStats(result: ConversionResult) {
    const { story } = result;
    
    return {
      totalNodes: story.length,
      totalChoices: story.reduce((sum, node) => sum + node.choices.length, 0),
      averageChoicesPerNode: story.length > 0 
        ? (story.reduce((sum, node) => sum + node.choices.length, 0) / story.length).toFixed(2)
        : '0',
      endNodes: story.filter(node => {
        // Un nœud de fin a soit aucun choix, soit seulement un choix "Recommencer"
        return node.choices.length === 0 || 
               (node.choices.length === 1 && node.choices[0]?.nextNodeId === '-1');
      }).length,
      maxDepth: this.calculateMaxDepth(story, result.startNodeId),
      hasErrors: result.errors.length > 0,
      hasWarnings: result.warnings.length > 0
    };
  }

  /**
   * Calcule la profondeur maximale de l'histoire
   */
  private static calculateMaxDepth(story: StoryNode[], startNodeId: string): number {
    const visited = new Set<string>();
    
    const traverse = (nodeId: string, depth: number): number => {
      if (visited.has(nodeId) || nodeId === '-1') return depth;
      
      visited.add(nodeId);
      const node = story.find(n => n.id === nodeId);
      
      if (!node || node.choices.length === 0 || 
          (node.choices.length === 1 && node.choices[0]?.nextNodeId === '-1')) {
        return depth;
      }
      
      let maxChildDepth = depth;
      for (const choice of node.choices) {
        if (choice.nextNodeId !== '-1') {
          const childDepth = traverse(choice.nextNodeId, depth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      }
      
      visited.delete(nodeId); // Permettre la réutilisation pour différents chemins
      return maxChildDepth;
    };
    
    return traverse(startNodeId, 0);
  }

  // 🔧 FIX: Ajout des méthodes manquantes de mon version pour compatibilité complète

  /**
   * Calcule le temps de lecture estimé d'un texte
   */
  private static calculateReadTime(content: string): number {
    const wordsPerMinute = 200; // Vitesse de lecture moyenne
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 1;
  }

  /**
   * Calcule le temps de jeu estimé total
   */
  private static calculateEstimatedPlayTime(nodes: EditorNode[]): number {
    const totalReadTime = nodes.reduce((total, node) => {
      return total + this.calculateReadTime(node.data.storyNode.content);
    }, 0);
    
    // Facteur multiplicateur pour tenir compte des choix et rejouabilité
    return Math.ceil(totalReadTime * 1.5);
  }

  /**
   * 🔧 FIX: Méthode additionnelle pour compatibilité avec l'interface Story complète
   * Convertit vers un objet Story complet (si nécessaire pour d'autres parties du code)
   */
  static convertToFullStory(nodes: EditorNode[], edges: EditorEdge[]): {
    story: any; // Type Story de votre interface si nécessaire
    startNodeId: string;
    errors: string[];
    warnings: string[];
  } {
    const conversionResult = this.convert(nodes, edges);
    
    // Créer un objet Story complet compatible avec d'autres parties du code
    const fullStory = {
      id: `story-${Date.now()}`,
      title: 'Histoire Générée',
      description: 'Histoire créée avec l\'éditeur Asylum',
      startNodeId: conversionResult.startNodeId,
      nodes: conversionResult.story.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
      }, {} as Record<string, StoryNode>),
      metadata: {
        version: '1.0.0',
        created: new Date(),
        updated: new Date(),
        author: 'Asylum Editor',
        tags: ['interactif', 'généré'],
        language: 'fr',
        estimatedPlayTime: this.calculateEstimatedPlayTime(nodes),
      },
      settings: {
        saveEnabled: true,
        autoSave: true,
        showProgress: true,
        theme: 'asylum-dark',
      },
    };

    return {
      story: fullStory,
      startNodeId: conversionResult.startNodeId,
      errors: conversionResult.errors,
      warnings: conversionResult.warnings,
    };
  }

  /**
   * 🔧 FIX: Valide une histoire convertie (méthode additionnelle)
   */
  static validateStory(story: StoryNode[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nodeIds = new Set(story.map(n => n.id));
    
    // Vérifier que tous les choix pointent vers des nœuds existants
    for (const node of story) {
      for (const choice of node.choices) {
        if (choice.nextNodeId !== '-1' && !nodeIds.has(choice.nextNodeId)) {
          errors.push(`Le choix "${choice.text}" du nœud "${node.title}" pointe vers un nœud inexistant: ${choice.nextNodeId}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}