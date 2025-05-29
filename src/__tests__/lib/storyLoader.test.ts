import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { StoryLoader } from '../../lib/storyLoader'; // ✅ Import de la classe, pas de l'instance

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('StoryLoader', () => {
  let storyLoader: StoryLoader;

  beforeEach(() => {
    jest.clearAllMocks();
    storyLoader = new StoryLoader(); // ✅ Créer une nouvelle instance
  });

  describe('getNode', () => {
    it('should return null for non-existent node', () => {
      const result = storyLoader.getNode('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAllNodes', () => {
    it('should return empty array when no nodes loaded', () => {
      const result = storyLoader.getAllNodes();
      expect(result).toEqual([]);
    });
  });

  describe('getStartNodeId', () => {
    it('should return empty string when no story loaded', () => {
      const result = storyLoader.getStartNodeId();
      expect(result).toBe('');
    });
  });

  describe('validateStory', () => {
    it('should return invalid when no nodes', () => {
      const result = storyLoader.validateStory();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Aucun nœud trouvé dans l'histoire");
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no nodes', () => {
      const result = storyLoader.getStats();
      expect(result.totalNodes).toBe(0);
      expect(result.totalChoices).toBe(0);
      expect(result.averageChoicesPerNode).toBe(0);
    });
  });
});
