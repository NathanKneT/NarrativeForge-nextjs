import { SaveData, GameState } from '@/types/story';

export class SaveManager {
  private static readonly SAVE_PREFIX = 'asylum-save-';
  private static readonly MAX_SAVES = 10;

  // Sauvegarder une partie
  static async saveGame(saveName: string, gameState: GameState): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('localStorage not available on server');
    }

    const saveId = Date.now().toString();
    const saveData: SaveData = {
      id: saveId,
      name: saveName.trim() || `Sauvegarde ${new Date().toLocaleDateString()}`,
      gameState: {
        ...gameState,
        visitedNodes: new Set(gameState.visitedNodes),
      },
      timestamp: new Date(),
      storyProgress: gameState.visitedNodes.size,
    };

    try {
      // Convertir Set en Array pour la sérialisation
      const serializedSave = {
        ...saveData,
        gameState: {
          ...saveData.gameState,
          visitedNodes: Array.from(saveData.gameState.visitedNodes),
          startTime: saveData.gameState.startTime.toISOString(),
        },
        timestamp: saveData.timestamp.toISOString(),
      };

      localStorage.setItem(
        `${this.SAVE_PREFIX}${saveId}`, 
        JSON.stringify(serializedSave)
      );

      // Nettoyer les anciennes sauvegardes si nécessaire
      await this.cleanupOldSaves();

      console.log('💾 Sauvegarde réussie:', saveData.name);
      return saveId;
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
      throw new Error('Impossible de sauvegarder la partie');
    }
  }

  // Charger toutes les sauvegardes
  static getAllSaves(): SaveData[] {
    if (typeof window === 'undefined') return [];

    const saves: SaveData[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.SAVE_PREFIX)) {
          const saveData = this.loadSaveById(key.replace(this.SAVE_PREFIX, ''));
          if (saveData) {
            saves.push(saveData);
          }
        }
      }

      // Trier par date (plus récent en premier)
      return saves.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('❌ Erreur lors du chargement des sauvegardes:', error);
      return [];
    }
  }

  // Charger une sauvegarde spécifique
  static loadSaveById(saveId: string): SaveData | null {
    if (typeof window === 'undefined') return null;

    try {
      const saveString = localStorage.getItem(`${this.SAVE_PREFIX}${saveId}`);
      if (!saveString) return null;

      const parsedSave = JSON.parse(saveString);
      
      // Reconvertir Array en Set et strings en Dates
      return {
        ...parsedSave,
        gameState: {
          ...parsedSave.gameState,
          visitedNodes: new Set(parsedSave.gameState.visitedNodes),
          startTime: new Date(parsedSave.gameState.startTime),
        },
        timestamp: new Date(parsedSave.timestamp),
      };
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de la sauvegarde ${saveId}:`, error);
      return null;
    }
  }

  // Supprimer une sauvegarde
  static deleteSave(saveId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(`${this.SAVE_PREFIX}${saveId}`);
      console.log('🗑️ Sauvegarde supprimée:', saveId);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      return false;
    }
  }

  // Nettoyer les anciennes sauvegardes (garder seulement les MAX_SAVES plus récentes)
  private static async cleanupOldSaves(): Promise<void> {
    const saves = this.getAllSaves();
    
    if (saves.length > this.MAX_SAVES) {
      const savesToDelete = saves.slice(this.MAX_SAVES);
      savesToDelete.forEach(save => {
        this.deleteSave(save.id);
      });
      console.log(`🧹 ${savesToDelete.length} anciennes sauvegardes supprimées`);
    }
  }

  // Exporter toutes les sauvegardes en JSON
  static exportSaves(): string {
    const saves = this.getAllSaves();
    return JSON.stringify(saves, null, 2);
  }

  // Importer des sauvegardes depuis JSON
  static async importSaves(jsonData: string): Promise<number> {
    try {
      const saves: SaveData[] = JSON.parse(jsonData);
      let importedCount = 0;

      for (const save of saves) {
        if (this.isValidSaveData(save)) {
          // Générer un nouvel ID pour éviter les conflits
          const newSaveId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const saveToImport = { ...save, id: newSaveId };
          
          await this.saveGame(saveToImport.name, saveToImport.gameState);
          importedCount++;
        }
      }

      console.log(`📥 ${importedCount} sauvegardes importées`);
      return importedCount;
    } catch (error) {
      console.error('❌ Erreur lors de l\'importation:', error);
      throw new Error('Format de fichier invalide');
    }
  }

  // Valider la structure d'une sauvegarde
  private static isValidSaveData(save: unknown): save is SaveData {
    if (!save || typeof save !== 'object') return false;
    
    const saveObj = save as Record<string, unknown>;
    
    return (
      typeof saveObj.id === 'string' &&
      typeof saveObj.name === 'string' &&
      typeof saveObj.gameState === 'object' &&
      saveObj.gameState !== null &&
      typeof (saveObj.gameState as Record<string, unknown>).currentNodeId === 'string' &&
      Array.isArray((saveObj.gameState as Record<string, unknown>).visitedNodes) &&
      typeof saveObj.timestamp !== 'undefined'
    );
  }

  // Obtenir des statistiques sur les sauvegardes
  static getSaveStats() {
    const saves = this.getAllSaves();
    const totalSize = saves.reduce((total, save) => {
      return total + JSON.stringify(save).length;
    }, 0);

    return {
      totalSaves: saves.length,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      oldestSave: saves.length > 0 ? saves[saves.length - 1].timestamp : null,
      newestSave: saves.length > 0 ? saves[0].timestamp : null,
    };
  }
}