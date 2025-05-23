import { StoryNode, Choice } from '@/types/story';

// Interface pour TON format exact
interface OldStoryNode {
  id: number;
  text: string;
  options: {
    text: string;
    nextText: number;
  }[];
}

// Fonction de migration adaptée à ton format
export function migrateStoryData(oldData: OldStoryNode[]): StoryNode[] {
  const nodes: StoryNode[] = [];

  oldData.forEach((oldNode) => {
    const choices: Choice[] = [];

    // Traiter les options
    oldNode.options.forEach((option, index) => {
      choices.push({
        id: `choice_${oldNode.id}_${index}`,
        text: option.text,
        nextNodeId: option.nextText.toString(),
        conditions: [],
        consequences: [],
      });
    });

    // Créer le nouveau noeud
    const newNode: StoryNode = {
      id: oldNode.id.toString(),
      title: `Scène ${oldNode.id}`,
      content: oldNode.text,
      choices,
      multimedia: {},
      metadata: {
        tags: [],
        visitCount: 0,
        difficulty: 'medium',
      },
    };

    nodes.push(newNode);
  });

  return nodes;
}