// src/lib/storyMigration.ts - Updated with English text
import { StoryNode, Choice } from '@/types/story';

// Interface for the old story format
interface OldStoryNode {
  id: number;
  text: string;
  options: {
    text: string;
    nextText: number;
  }[];
}

// Migration function adapted to your format - FIXED
export function migrateStoryData(oldData: OldStoryNode[]): StoryNode[] {
  const nodes: StoryNode[] = [];

  // ✅ FIX: Sort by ID to ensure node 1 is processed first
  const sortedData = [...oldData].sort((a, b) => a.id - b.id);

  sortedData.forEach((oldNode) => {
    const choices: Choice[] = [];

    // Process options
    oldNode.options.forEach((option, index) => {
      // ✅ FIX: Handle case where nextText is -1 (restart)
      const nextNodeId =
        option.nextText === -1 ? '-1' : option.nextText.toString();

      choices.push({
        id: `choice_${oldNode.id}_${index}`,
        text: option.text,
        nextNodeId: nextNodeId,
        conditions: [],
        consequences: [],
      });
    });

    // Create the new node
    const newNode: StoryNode = {
      id: oldNode.id.toString(), // ✅ FIX: Keep original ID
      title: oldNode.id === 1 ? `Beginning of the Story` : `Scene ${oldNode.id}`, // ✅ FIX: English title
      content: oldNode.text,
      choices,
      multimedia: {}, // ✅ FIX: Required property
      metadata: {
        tags: oldNode.id === 1 ? ['start'] : [], // ✅ FIX: English tag
        visitCount: 0,
        difficulty: 'medium',
      },
    };

    nodes.push(newNode);
  });

  // ✅ FIX: Validate that node "1" exists
  const startNode = nodes.find((n) => n.id === '1');
  if (!startNode) {
    console.warn(
      '⚠️ No node with ID "1" found, first node will be considered as start'
    );
  }

  console.log('📊 Migration completed:', {
    totalNodes: nodes.length,
    startNodeId: startNode?.id || nodes[0]?.id || 'unknown',
    nodesWithChoices: nodes.filter((n) => n.choices.length > 0).length,
  });

  return nodes;
}