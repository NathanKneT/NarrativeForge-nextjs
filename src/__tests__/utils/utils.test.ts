// src/__tests__/utils/utils.test.ts
import { describe, expect, it } from '@jest/globals';

// Utility functions (create these in src/utils/index.ts)
export const formatId = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
};

export const sanitizeHtml = (html: string): string => {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const validateStoryNode = (node: any): boolean => {
  return (
    node &&
    typeof node.id === 'string' &&
    typeof node.title === 'string' &&
    typeof node.content === 'string' &&
    Array.isArray(node.choices)
  );
};

export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

describe('Utility Functions', () => {
  describe('formatId', () => {
    it('should convert text to lowercase kebab-case', () => {
      expect(formatId('Hello World')).toBe('hello-world');
      expect(formatId('Test Story Title')).toBe('test-story-title');
    });

    it('should handle special characters', () => {
      expect(formatId('Hello@World#123')).toBe('hello-world-123');
      expect(formatId('Test & Story!')).toBe('test-story');
    });

    it('should handle multiple spaces and hyphens', () => {
      expect(formatId('Hello    World')).toBe('hello-world');
      expect(formatId('Test---Story')).toBe('test-story');
    });

    it('should handle empty strings', () => {
      expect(formatId('')).toBe('');
      expect(formatId('   ')).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const maliciousHtml = '<p>Safe content</p><script>alert("hack")</script>';
      expect(sanitizeHtml(maliciousHtml)).toBe('<p>Safe content</p>');
    });

    it('should handle multiple script tags', () => {
      const html = '<div><script>bad()</script>Good<script>alsoBad()</script></div>';
      expect(sanitizeHtml(html)).toBe('<div>Good</div>');
    });

    it('should preserve safe HTML', () => {
      const safeHtml = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      expect(sanitizeHtml(safeHtml)).toBe(safeHtml);
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with expected format', () => {
      const id = generateUniqueId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('validateStoryNode', () => {
    it('should validate correct story node', () => {
      const validNode = {
        id: 'node-1',
        title: 'Test Node',
        content: 'Test content',
        choices: []
      };
      
      expect(validateStoryNode(validNode)).toBe(true);
    });

    it('should reject invalid nodes', () => {
      expect(validateStoryNode(null)).toBe(false);
      expect(validateStoryNode({})).toBe(false);
      expect(validateStoryNode({ id: 'test' })).toBe(false);
      expect(validateStoryNode({ 
        id: 123, 
        title: 'Test', 
        content: 'Test', 
        choices: [] 
      })).toBe(false);
    });

    it('should require all essential fields', () => {
      const nodeWithoutTitle = {
        id: 'node-1',
        content: 'Test content',
        choices: []
      };
      
      expect(validateStoryNode(nodeWithoutTitle)).toBe(false);
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      const shortText = 'Hello world';
      expect(calculateReadingTime(shortText)).toBe(1);
      
      const longText = 'a '.repeat(400); // 400 words
      expect(calculateReadingTime(longText)).toBe(2);
    });

    it('should handle empty text', () => {
      expect(calculateReadingTime('')).toBe(0);
      expect(calculateReadingTime('   ')).toBe(0);
    });

    it('should round up reading time', () => {
      const text = 'a '.repeat(250); // 250 words = 1.25 minutes
      expect(calculateReadingTime(text)).toBe(2);
    });
  });
});