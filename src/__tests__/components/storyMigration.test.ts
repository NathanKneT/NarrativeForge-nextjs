import { migrateStoryData } from '@/lib/storyMigration';

describe('storyMigration', () => {
  const mockOldStoryData = [
    {
      id: 1,
      text: 'You wake up in a dark room.',
      options: [
        { text: 'Go left', nextText: 2 },
        { text: 'Go right', nextText: 3 },
      ],
    },
    {
      id: 2,
      text: 'You find a door.',
      options: [{ text: 'Open the door', nextText: 4 }],
    },
    {
      id: 3,
      text: 'You see a window.',
      options: [
        { text: 'Look outside', nextText: 5 },
        { text: 'Go back', nextText: 1 },
      ],
    },
    {
      id: 4,
      text: 'You escape!',
      options: [{ text: 'Restart', nextText: -1 }],
    },
  ];

  it('should migrate old story data to new format', () => {
    const result = migrateStoryData(mockOldStoryData);

    expect(result).toHaveLength(4);

    // Check start node
    const startNode = result.find((node) => node.id === '1');
    expect(startNode).toBeDefined();
    expect(startNode?.title).toBe("Début de l'histoire");
    expect(startNode?.metadata.tags).toContain('début');
  });

  it('should convert IDs to strings', () => {
    const result = migrateStoryData(mockOldStoryData);

    result.forEach((node) => {
      expect(typeof node.id).toBe('string');
    });
  });

  it('should convert options to choices correctly', () => {
    const result = migrateStoryData(mockOldStoryData);

    const firstNode = result.find((node) => node.id === '1');
    expect(firstNode?.choices).toHaveLength(2);
    expect(firstNode?.choices[0].text).toBe('Go left');
    expect(firstNode?.choices[0].nextNodeId).toBe('2');
    expect(firstNode?.choices[1].text).toBe('Go right');
    expect(firstNode?.choices[1].nextNodeId).toBe('3');
  });

  it('should handle restart option (-1)', () => {
    const result = migrateStoryData(mockOldStoryData);

    const endNode = result.find((node) => node.id === '4');
    expect(endNode?.choices[0].nextNodeId).toBe('-1');
  });

  it('should preserve text content', () => {
    const result = migrateStoryData(mockOldStoryData);

    const firstNode = result.find((node) => node.id === '1');
    expect(firstNode?.content).toBe('You wake up in a dark room.');
  });

  it('should create proper metadata structure', () => {
    const result = migrateStoryData(mockOldStoryData);

    result.forEach((node) => {
      expect(node.metadata).toHaveProperty('tags');
      expect(node.metadata).toHaveProperty('visitCount');
      expect(node.metadata).toHaveProperty('difficulty');
      expect(Array.isArray(node.metadata.tags)).toBe(true);
      expect(typeof node.metadata.visitCount).toBe('number');
      expect(node.metadata.difficulty).toBe('medium');
    });
  });

  it('should create multimedia object', () => {
    const result = migrateStoryData(mockOldStoryData);

    result.forEach((node) => {
      expect(node.multimedia).toBeDefined();
      expect(typeof node.multimedia).toBe('object');
    });
  });

  it('should sort nodes by ID', () => {
    const shuffledData = [...mockOldStoryData].reverse();
    const result = migrateStoryData(shuffledData);

    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(result[2].id).toBe('3');
    expect(result[3].id).toBe('4');
  });

  it('should handle empty data', () => {
    const result = migrateStoryData([]);
    expect(result).toEqual([]);
  });

  it('should generate unique choice IDs', () => {
    const result = migrateStoryData(mockOldStoryData);

    const allChoiceIds = result.flatMap((node) =>
      node.choices.map((choice) => choice.id)
    );
    const uniqueChoiceIds = new Set(allChoiceIds);

    expect(allChoiceIds.length).toBe(uniqueChoiceIds.size);
  });
});
