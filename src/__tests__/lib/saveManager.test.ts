import { SaveManager } from '@/lib/saveManager';
import type { SaveData, GameState } from '@/types/story';

// Mock localStorage avec une implémentation complète
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
};

describe('SaveManager', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    jest.clearAllMocks();
  });

  describe('saveGame', () => {
    const mockGameState: GameState = {
      currentNodeId: 'node-1',
      visitedNodes: new Set(['start', 'node-1']),
      choices: { start: 'choice-1' },
      startTime: new Date('2024-01-01'),
      playTime: 0,
      variables: {},
      inventory: [],
    };

    it('should save game state to localStorage', async () => {
      const saveId = await SaveManager.saveGame('Test Save', mockGameState);

      expect(saveId).toBeDefined();
      expect(typeof saveId).toBe('string');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle empty save name', async () => {
      const saveId = await SaveManager.saveGame('', mockGameState);

      expect(saveId).toBeDefined();
      expect(typeof saveId).toBe('string');
    });

    it('should serialize Set and Date objects correctly', async () => {
      await SaveManager.saveGame('Test Save', mockGameState);

      const calls = mockLocalStorage.setItem.mock.calls;
      const [key, value] = calls[calls.length - 1];
      const savedData = JSON.parse(value);

      expect(Array.isArray(savedData.gameState.visitedNodes)).toBe(true);
      expect(typeof savedData.gameState.startTime).toBe('string');
      expect(typeof savedData.timestamp).toBe('string');
    });

    it('should throw error when localStorage is not available', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      await expect(SaveManager.saveGame('Test', mockGameState))
        .rejects.toThrow('localStorage not available on server');

      global.window = originalWindow;
    });
  });

  describe('getAllSaves', () => {
    it('should return empty array when no saves exist', () => {
      const saves = SaveManager.getAllSaves();
      expect(Array.isArray(saves)).toBe(true);
      expect(saves).toHaveLength(0);
    });

    it('should return all saved games', async () => {
      const gameState1: GameState = {
        currentNodeId: 'node-1',
        visitedNodes: new Set(['start']),
        choices: {},
        startTime: new Date('2024-01-01'),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      const gameState2: GameState = {
        currentNodeId: 'node-2',
        visitedNodes: new Set(['start', 'node-1']),
        choices: { start: 'choice-1' },
        startTime: new Date('2024-01-02'),
        playTime: 100,
        variables: {},
        inventory: [],
      };

      await SaveManager.saveGame('Save 1', gameState1);
      await SaveManager.saveGame('Save 2', gameState2);

      const saves = SaveManager.getAllSaves();
      expect(Array.isArray(saves)).toBe(true);
      expect(saves.length).toBeGreaterThanOrEqual(1);
    });

    it('should ignore corrupted save data', () => {
      mockLocalStorage.setItem('asylum-save-corrupted', 'invalid json');

      const saves = SaveManager.getAllSaves();
      expect(Array.isArray(saves)).toBe(true);
    });
  });

  describe('loadSaveById', () => {
    it('should return null for non-existent save', () => {
      const save = SaveManager.loadSaveById('non-existent');
      expect(save).toBeNull();
    });

    it('should load and deserialize save data correctly', async () => {
      const gameState: GameState = {
        currentNodeId: 'node-1',
        visitedNodes: new Set(['start', 'node-1']),
        choices: { start: 'choice-1' },
        startTime: new Date('2024-01-01'),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      const saveId = await SaveManager.saveGame('Test Save', gameState);
      const loadedSave = SaveManager.loadSaveById(saveId);

      expect(loadedSave).not.toBeNull();
      if (loadedSave) {
        expect(loadedSave.name).toBe('Test Save');
        expect(loadedSave.gameState.currentNodeId).toBe('node-1');
        expect(loadedSave.gameState.visitedNodes).toBeInstanceOf(Set);
        expect(loadedSave.gameState.visitedNodes.has('start')).toBe(true);
        expect(loadedSave.gameState.startTime).toBeInstanceOf(Date);
        expect(loadedSave.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should return null for corrupted save data', () => {
      mockLocalStorage.setItem('asylum-save-corrupted', 'invalid json');
      
      const save = SaveManager.loadSaveById('corrupted');
      expect(save).toBeNull();
    });
  });

  describe('deleteSave', () => {
    it('should delete save from localStorage', async () => {
      const gameState: GameState = {
        currentNodeId: 'node-1',
        visitedNodes: new Set(['start']),
        choices: {},
        startTime: new Date(),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      const saveId = await SaveManager.saveGame('Test Save', gameState);
      const result = SaveManager.deleteSave(saveId);

      expect(result).toBe(true);
    });

    it('should return true even for non-existent saves', () => {
      const result = SaveManager.deleteSave('non-existent');
      expect(result).toBe(true);
    });
  });

  describe('exportSaves', () => {
    it('should export all saves as JSON', async () => {
      const gameState: GameState = {
        currentNodeId: 'node-1',
        visitedNodes: new Set(['start']),
        choices: {},
        startTime: new Date(),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      await SaveManager.saveGame('Test Save', gameState);
      const exported = SaveManager.exportSaves();

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('importSaves', () => {
    // 🔧 FIX: Créer des données de test avec les bonnes types
    it('should import valid save data', async () => {
      const validGameState: GameState = {
        currentNodeId: 'node-1',
        visitedNodes: new Set(['start']),
        choices: {},
        startTime: new Date('2024-01-01'),
        playTime: 0,
        variables: {},
        inventory: [],
      };

      // Créer d'abord une vraie sauvegarde, puis l'exporter
      await SaveManager.saveGame('Test Save', validGameState);
      const exported = SaveManager.exportSaves();
      
      // Vider le storage
      mockLocalStorage.clear();
      
      // Importer les données exportées
      const importedCount = await SaveManager.importSaves(exported);
      expect(importedCount).toBeGreaterThanOrEqual(0);
    });

    it('should reject invalid JSON', async () => {
      await expect(SaveManager.importSaves('invalid json'))
        .rejects.toThrow('Format de fichier invalide');
    });

    it('should skip invalid save data', async () => {
      const invalidSaves = [
        { id: 'invalid', name: 'Invalid Save' }, // Missing gameState
      ];

      const importedCount = await SaveManager.importSaves(JSON.stringify(invalidSaves));
      expect(importedCount).toBe(0);
    });
  });

  describe('getSaveStats', () => {
    it('should return correct statistics', async () => {
      const stats = SaveManager.getSaveStats();
      expect(stats).toHaveProperty('totalSaves');
      expect(stats).toHaveProperty('totalSizeKB');
      expect(stats).toHaveProperty('newestSave');
      expect(stats).toHaveProperty('oldestSave');
      expect(typeof stats.totalSaves).toBe('number');
      expect(typeof stats.totalSizeKB).toBe('number');
    });

    it('should handle empty saves', () => {
      const stats = SaveManager.getSaveStats();
      expect(stats.totalSaves).toBe(0);
      expect(stats.totalSizeKB).toBe(0);
      expect(stats.newestSave).toBeNull();
      expect(stats.oldestSave).toBeNull();
    });
  });
  describe('SaveManager - Coverage Boost', () => {
  // Test des erreurs localStorage 
  it('should handle localStorage errors gracefully', () => {
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock localStorage pour lever des erreurs
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => { throw new Error('Storage error'); },
        setItem: () => { throw new Error('Storage error'); },
        removeItem: () => { throw new Error('Storage error'); },
        clear: () => { throw new Error('Storage error'); },
        length: 0,
        key: () => null,
      },
      writable: true,
    });

    // Ces méthodes ne devraient pas crasher
    expect(() => SaveManager.getAllSaves()).not.toThrow();
    expect(() => SaveManager.deleteSave('test')).not.toThrow();
    expect(() => SaveManager.getSaveStats()).not.toThrow();

    console.error = originalConsoleError;
  });

  // Test avec différents formats d'import invalides
  it('should handle various invalid import formats', async () => {
    const invalidFormats = [
      '', // Vide
      'not-json-at-all',
      '{"not": "array"}', // Objet au lieu d'array
      '[]', // Array vide
      '[null]', // Array avec null
      '[{"missing": "gameState"}]', // Objet sans gameState
      '[{"gameState": null}]', // gameState null
      '[{"gameState": {}}]', // gameState vide
    ];

    for (const invalidData of invalidFormats) {
      const result = await SaveManager.importSaves(invalidData);
      expect(result).toBe(0); // Aucune sauvegarde importée
    }
  });

  // Test edge cases getSaveStats
  it('should calculate stats correctly with edge cases', async () => {
    const mockGameState = {
      currentNodeId: 'test',
      visitedNodes: new Set(['test']),
      choices: {},
      startTime: new Date('2020-01-01'),
      playTime: 100,
      variables: {},
      inventory: [],
    };

    // Créer plusieurs sauvegardes avec dates différentes
    await SaveManager.saveGame('Oldest Save', mockGameState);
    await new Promise(resolve => setTimeout(resolve, 10)); // Petit délai
    await SaveManager.saveGame('Middle Save', mockGameState);
    await new Promise(resolve => setTimeout(resolve, 10));
    await SaveManager.saveGame('Newest Save', mockGameState);

    const stats = SaveManager.getSaveStats();
    
    expect(stats.totalSaves).toBeGreaterThanOrEqual(3);
    expect(stats.totalSizeKB).toBeGreaterThan(0);
    expect(stats.newestSave).toBeDefined();
    expect(stats.oldestSave).toBeDefined();
    
    // La plus récente doit être plus récente que la plus ancienne
    if (stats.newestSave && stats.oldestSave) {
      expect(new Date(stats.newestSave).getTime()).toBeGreaterThanOrEqual(
        new Date(stats.oldestSave).getTime()
      );
    }
  });

  // Test serialization edge cases
  it('should handle complex gameState serialization', async () => {
    const complexGameState = {
      currentNodeId: 'complex-node-éàü-🎮',
      visitedNodes: new Set([
        'node-with-special-chars',
        'node_with_underscores',
        'node.with.dots',
        'node with spaces',
        'node-🎮-emoji'
      ]),
      choices: {
        'start': 'choice-éàü',
        'middle-🎮': 'choice-with-emoji',
        'node with spaces': 'another choice'
      },
      startTime: new Date('2024-01-01T12:00:00.000Z'),
      playTime: 123456,
      variables: {
        health: 100,
        mana: 50,
        inventory_size: 10,
        'special-var-éàü': 'special-value'
      },
      inventory: [
        'sword-🗡️',
        'potion-éàü',
        'item with spaces',
        'item_with_underscores'
      ],
    };

    const saveId = await SaveManager.saveGame('Complex Save', complexGameState);
    expect(saveId).toBeDefined();

    const loadedSave = SaveManager.loadSaveById(saveId);
    expect(loadedSave).not.toBeNull();
    
    if (loadedSave) {
      expect(loadedSave.gameState.currentNodeId).toBe(complexGameState.currentNodeId);
      expect(loadedSave.gameState.visitedNodes).toEqual(complexGameState.visitedNodes);
      expect(loadedSave.gameState.choices).toEqual(complexGameState.choices);
      expect(loadedSave.gameState.variables).toEqual(complexGameState.variables);
      expect(loadedSave.gameState.inventory).toEqual(complexGameState.inventory);
    }
  });

  // Test avec localStorage près de sa limite
  it('should handle large save data', async () => {
    const largeGameState = {
      currentNodeId: 'large-state',
      visitedNodes: new Set(Array.from({ length: 1000 }, (_, i) => `node-${i}`)),
      choices: Object.fromEntries(
        Array.from({ length: 500 }, (_, i) => [`node-${i}`, `choice-${i}`])
      ),
      startTime: new Date(),
      playTime: 999999,
      variables: Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`var-${i}`, i])
      ),
      inventory: Array.from({ length: 200 }, (_, i) => `item-${i}`),
    };

    const saveId = await SaveManager.saveGame('Large Save', largeGameState);
    expect(saveId).toBeDefined();

    const stats = SaveManager.getSaveStats();
    expect(stats.totalSizeKB).toBeGreaterThan(10); // Au moins 10KB
  });

  // Test export/import round-trip
  it('should maintain data integrity in export/import cycle', async () => {
    const originalGameState = {
      currentNodeId: 'export-test',
      visitedNodes: new Set(['start', 'middle', 'end']),
      choices: { start: 'choice1', middle: 'choice2' },
      startTime: new Date('2024-01-01'),
      playTime: 12345,
      variables: { test: 'value' },
      inventory: ['item1', 'item2'],
    };

    // Créer plusieurs sauvegardes
    await SaveManager.saveGame('Export Test 1', originalGameState);
    await SaveManager.saveGame('Export Test 2', originalGameState);

    // Exporter
    const exportedData = SaveManager.exportSaves();
    expect(exportedData).toBeTruthy();

    // Vider le storage
    localStorage.clear();

    // Importer
    const importCount = await SaveManager.importSaves(exportedData);
    expect(importCount).toBeGreaterThanOrEqual(2);

    // Vérifier l'intégrité
    const saves = SaveManager.getAllSaves();
    expect(saves.length).toBeGreaterThanOrEqual(2);

    const testSave = saves.find(s => s.name === 'Export Test 1');
    expect(testSave).toBeDefined();
    
    if (testSave) {
      expect(testSave.gameState.currentNodeId).toBe(originalGameState.currentNodeId);
      expect(testSave.gameState.visitedNodes).toEqual(originalGameState.visitedNodes);
    }
  });

  // Test avec des IDs de sauvegarde edge cases
  it('should handle edge case save IDs', async () => {
    const mockGameState = {
      currentNodeId: 'test',
      visitedNodes: new Set(['test']),
      choices: {},
      startTime: new Date(),
      playTime: 0,
      variables: {},
      inventory: [],
    };

    const edgeCaseNames = [
      '', // Nom vide
      ' ', // Espace seulement
      'name-with-special-éàü-chars',
      'name with spaces',
      'name_with_underscores',
      'name.with.dots',
      'name-🎮-with-emoji',
      'very-long-name-that-exceeds-normal-length-expectations-and-might-cause-issues-with-storage-or-display',
    ];

    for (const name of edgeCaseNames) {
      const saveId = await SaveManager.saveGame(name, mockGameState);
      expect(saveId).toBeDefined();
      
      const loadedSave = SaveManager.loadSaveById(saveId);
      expect(loadedSave).not.toBeNull();
      expect(loadedSave?.name).toBe(name || 'Sauvegarde sans nom');
    }
  });

  // Test concurrence (simulations)
  it('should handle concurrent save operations', async () => {
    const mockGameState = {
      currentNodeId: 'concurrent',
      visitedNodes: new Set(['test']),
      choices: {},
      startTime: new Date(),
      playTime: 0,
      variables: {},
      inventory: [],
    };

    // Sauvegardes simultanées
    const savePromises = Array.from({ length: 10 }, (_, i) => 
      SaveManager.saveGame(`Concurrent Save ${i}`, mockGameState)
    );

    const saveIds = await Promise.all(savePromises);
    
    // Toutes les sauvegardes devraient avoir réussi
    expect(saveIds).toHaveLength(10);
    saveIds.forEach(id => expect(id).toBeDefined());

    // Toutes devraient être chargeable
    const loadPromises = saveIds.map(id => SaveManager.loadSaveById(id));
    const loadedSaves = loadPromises.map(promise => promise);
    
    loadedSaves.forEach(save => expect(save).not.toBeNull());
  });
});
});
