import { EditorNode, EditorEdge } from '@/types/editor';
import { StoryNode } from '@/types/story';
import { GraphToStoryConverter } from './graphToStoryConverter';

export interface ExportOptions {
  format: 'asylum-json' | 'json' | 'twine';
  includeMetadata: boolean;
  minify: boolean;
  validateBeforeExport: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string;
  filename: string;
  errors: string[];
  warnings: string[];
  stats: {
    totalNodes: number;
    totalChoices: number;
    fileSize: number;
  };
}

export class StoryExporter {
  /**
   * Exporte une histoire dans le format spécifié
   */
  static async exportStory(
    nodes: EditorNode[], 
    edges: EditorEdge[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validation avant export si demandée
      if (options.validateBeforeExport) {
        const validation = this.validateStoryForExport(nodes, edges);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
        
        if (validation.errors.length > 0) {
          return {
            success: false,
            filename: '',
            errors,
            warnings,
            stats: { totalNodes: 0, totalChoices: 0, fileSize: 0 }
          };
        }
      }

      // Conversion selon le format
      let exportData: string;
      let filename: string;

      switch (options.format) {
        case 'asylum-json':
          const asylumResult = this.exportToAsylumFormat(nodes, edges, options);
          exportData = asylumResult.data;
          filename = asylumResult.filename;
          break;

        case 'json':
          const jsonResult = this.exportToGenericJSON(nodes, edges, options);
          exportData = jsonResult.data;
          filename = jsonResult.filename;
          break;

        case 'twine':
          const twineResult = this.exportToTwineFormat(nodes, edges, options);
          exportData = twineResult.data;
          filename = twineResult.filename;
          break;

        default:
          throw new Error(`Format d'export non supporté: ${options.format}`);
      }

      // Statistiques
      const stats = {
        totalNodes: nodes.length,
        totalChoices: nodes.reduce((sum, node) => sum + node.data.storyNode.choices.length, 0),
        fileSize: new Blob([exportData]).size
      };

      return {
        success: true,
        data: exportData,
        filename,
        errors,
        warnings,
        stats
      };

    } catch (error) {
      errors.push(`Erreur d'export: ${error}`);
      return {
        success: false,
        filename: '',
        errors,
        warnings,
        stats: { totalNodes: 0, totalChoices: 0, fileSize: 0 }
      };
    }
  }

  /**
   * Export au format Asylum (compatible avec le jeu)
   */
  private static exportToAsylumFormat(
    nodes: EditorNode[], 
    edges: EditorEdge[], 
    options: ExportOptions
  ) {
    // Convertir le graphe React Flow vers le format StoryNode
    const conversionResult = GraphToStoryConverter.convert(nodes, edges);
    
    if (conversionResult.errors.length > 0) {
      throw new Error(`Erreurs de conversion: ${conversionResult.errors.join(', ')}`);
    }

    // Format Asylum : tableau d'objets avec id numérique
    const asylumNodes = conversionResult.story.map((node, index) => ({
      id: parseInt(node.id) || index + 1, // Assurer des IDs numériques
      text: node.content,
      options: node.choices.map(choice => ({
        text: choice.text,
        nextText: parseInt(choice.nextNodeId) || -1
      }))
    }));

    // Métadonnées optionnelles
    const exportData = options.includeMetadata ? {
      metadata: {
        title: "Histoire Interactive",
        description: "Exportée depuis l'éditeur Asylum",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        totalNodes: asylumNodes.length,
        totalChoices: asylumNodes.reduce((sum, node) => sum + node.options.length, 0)
      },
      story: asylumNodes
    } : asylumNodes;

    const jsonString = options.minify 
      ? JSON.stringify(exportData)
      : JSON.stringify(exportData, null, 2);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `asylum-story-${timestamp}.json`;

    return { data: jsonString, filename };
  }

  /**
   * Export au format JSON générique
   */
  private static exportToGenericJSON(
    nodes: EditorNode[], 
    edges: EditorEdge[], 
    options: ExportOptions
  ) {
    const conversionResult = GraphToStoryConverter.convert(nodes, edges);
    
    const exportData = {
      format: "generic-interactive-story",
      version: "1.0",
      metadata: options.includeMetadata ? {
        title: "Histoire Interactive",
        author: "Asylum Editor",
        createdAt: new Date().toISOString(),
        totalNodes: conversionResult.story.length,
        startNodeId: conversionResult.startNodeId
      } : undefined,
      story: {
        startNodeId: conversionResult.startNodeId,
        nodes: conversionResult.story
      }
    };

    const jsonString = options.minify 
      ? JSON.stringify(exportData)
      : JSON.stringify(exportData, null, 2);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `interactive-story-${timestamp}.json`;

    return { data: jsonString, filename };
  }

  /**
   * Export au format Twine (format Twee)
   */
  private static exportToTwineFormat(
    nodes: EditorNode[], 
    edges: EditorEdge[], 
    options: ExportOptions
  ) {
    const conversionResult = GraphToStoryConverter.convert(nodes, edges);
    
    let tweeContent = '';
    
    // En-tête Twine
    if (options.includeMetadata) {
      tweeContent += `:: Start\n`;
      tweeContent += `Histoire Interactive\n`;
      tweeContent += `Créée avec Asylum Editor le ${new Date().toLocaleDateString()}\n\n`;
      tweeContent += `[[Commencer l'histoire|${conversionResult.startNodeId}]]\n\n`;
    }

    // Conversion de chaque nœud
    conversionResult.story.forEach(node => {
      // Titre du passage
      const tags = node.metadata.tags.length > 0 ? ` [${node.metadata.tags.join(' ')}]` : '';
      tweeContent += `:: ${node.title || node.id}${tags}\n`;
      
      // Contenu (nettoyer le HTML basique)
      const cleanContent = node.content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, '') // Supprimer les autres tags HTML
        .trim();
      
      tweeContent += cleanContent + '\n\n';
      
      // Choix/liens
      node.choices.forEach(choice => {
        if (choice.nextNodeId === '-1') {
          tweeContent += `[[${choice.text}|Start]]\n`;
        } else {
          const targetNode = conversionResult.story.find(n => n.id === choice.nextNodeId);
          const targetTitle = targetNode?.title || choice.nextNodeId;
          tweeContent += `[[${choice.text}|${targetTitle}]]\n`;
        }
      });
      
      tweeContent += '\n';
    });

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `story-${timestamp}.twee`;

    return { data: tweeContent, filename };
  }

  /**
   * Validation spécifique pour l'export
   */
  private static validateStoryForExport(nodes: EditorNode[], edges: EditorEdge[]) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validations de base
    if (nodes.length === 0) {
      errors.push('Aucun nœud à exporter');
      return { errors, warnings };
    }

    const startNodes = nodes.filter(n => n.data.nodeType === 'start');
    if (startNodes.length === 0) {
      errors.push('Aucun nœud de départ trouvé');
    }
    if (startNodes.length > 1) {
      errors.push('Plusieurs nœuds de départ trouvés');
    }

    // Vérifier les nœuds orphelins
    nodes.forEach(node => {
      if (node.data.nodeType !== 'end') {
        const hasOutgoingEdges = edges.some(edge => edge.source === node.id);
        if (!hasOutgoingEdges && node.data.storyNode.choices.length === 0) {
          warnings.push(`Le nœud "${node.data.storyNode.title}" n'a pas de suite`);
        }
      }
    });

    // Vérifier les références manquantes
    edges.forEach(edge => {
      const sourceExists = nodes.some(n => n.id === edge.source);
      const targetExists = nodes.some(n => n.id === edge.target);
      
      if (!sourceExists) {
        errors.push(`Connexion avec source manquante: ${edge.source}`);
      }
      if (!targetExists) {
        errors.push(`Connexion avec cible manquante: ${edge.target}`);
      }
    });

    return { errors, warnings };
  }

  /**
   * Télécharge automatiquement le fichier exporté
   */
  static downloadExport(result: ExportResult) {
    if (!result.success || !result.data) {
      throw new Error('Aucune donnée à télécharger');
    }

    const blob = new Blob([result.data], { 
      type: result.filename.endsWith('.json') ? 'application/json' : 'text/plain' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer
    URL.revokeObjectURL(url);
  }

  /**
   * Prévisualisation de l'export (retourne les premières lignes)
   */
  static getExportPreview(result: ExportResult, maxLines: number = 10): string {
    if (!result.success || !result.data) {
      return 'Aucune donnée disponible';
    }

    const lines = result.data.split('\n');
    const preview = lines.slice(0, maxLines).join('\n');
    
    if (lines.length > maxLines) {
      return preview + `\n... (${lines.length - maxLines} lignes supplémentaires)`;
    }
    
    return preview;
  }

  /**
   * Validation des formats supportés
   */
  static getSupportedFormats(): Array<{
    id: 'asylum-json' | 'json' | 'twine';
    name: string;
    description: string;
    extension: string;
  }> {
    return [
      {
        id: 'asylum-json',
        name: 'Asylum JSON',
        description: 'Format natif compatible avec le jeu Asylum',
        extension: '.json'
      },
      {
        id: 'json',
        name: 'JSON Générique',
        description: 'Format JSON standard pour interopérabilité',
        extension: '.json'
      },
      {
        id: 'twine',
        name: 'Twine (Twee)',
        description: 'Format Twee compatible avec Twine',
        extension: '.twee'
      }
    ];
  }
}