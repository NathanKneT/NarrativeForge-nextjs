import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { storyLoader } from '../../lib/storyLoader';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('storyLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadStory', () => {
    it('should load story from localStorage if exists', () => {
      const mockStory = {
        id: 'test-story',
        title: 'Test Story',
        nodes: [
          { id: '1', title: 'Start', content: 'Beginning', choices: [] }
        ]
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStory));

      const result = storyLoader.loadStory('test-story');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('story-test-story');
      expect(result).toEqual(mockStory);
    });

    it('should return null if story does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = storyLoader.loadStory('non-existent');

      expect(result).toBeNull();
    });

    it('should handle corrupted story data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = storyLoader.loadStory('corrupted');

      expect(result).toBeNull();
    });
  });

  describe('saveStory', () => {
    it('should save story to localStorage', () => {
      const story = {
        id: 'test-story',
        title: 'Test Story',
        nodes: []
      };

      storyLoader.saveStory(story);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'story-test-story',
        JSON.stringify(story)
      );
    });

    it('should handle save errors gracefully', () => {
      const story = { id: 'test', title: 'Test', nodes: [] };
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => storyLoader.saveStory(story)).not.toThrow();
    });
  });

  describe('deleteStory', () => {
    it('should remove story from localStorage', () => {
      storyLoader.deleteStory('test-story');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('story-test-story');
    });
  });

  describe('listStories', () => {
    it('should return list of saved stories', () => {
      const stories = ['story-1', 'story-2', 'other-key'];
      Object.defineProperty(window.localStorage, 'length', { value: 3 });
      localStorageMock.key = jest.fn()
        .mockReturnValueOnce('story-story-1')
        .mockReturnValueOnce('story-story-2')
        .mockReturnValueOnce('other-key');

      const mockStory1 = { id: 'story-1', title: 'Story 1', nodes: [] };
      const mockStory2 = { id: 'story-2', title: 'Story 2', nodes: [] };
      
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(mockStory1))
        .mockReturnValueOnce(JSON.stringify(mockStory2));

      const result = storyLoader.listStories();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('story-1');
      expect(result[1].id).toBe('story-2');
    });

    it('should handle empty localStorage', () => {
      Object.defineProperty(window.localStorage, 'length', { value: 0 });

      const result = storyLoader.listStories();

      expect(result).toEqual([]);
    });
  });
});