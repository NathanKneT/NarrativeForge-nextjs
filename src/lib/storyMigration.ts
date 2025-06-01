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

// Fonction de migration adaptée à ton format - CORRIGÉE
export function migrateStoryData(oldData: OldStoryNode[]): StoryNode[] {
  const nodes: StoryNode[] = [];

  // ✅ FIX: Trier par ID pour s'assurer que le nœud 1 est traité en premier
  const sortedData = [...oldData].sort((a, b) => a.id - b.id);

  sortedData.forEach((oldNode) => {
    const choices: Choice[] = [];

    // Traiter les options
    oldNode.options.forEach((option, index) => {
      // ✅ FIX: Gérer le cas où nextText est -1 (redémarrage)
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

    // Créer le nouveau noeud
    const newNode: StoryNode = {
      id: oldNode.id.toString(), // ✅ FIX: Conserver l'ID original
      title: oldNode.id === 1 ? `Début de l'histoire` : `Scène ${oldNode.id}`, // ✅ FIX: Titre spécial pour le nœud 1
      content: oldNode.text,
      choices,
      multimedia: {}, // ✅ FIX: Propriété obligatoire
      metadata: {
        tags: oldNode.id === 1 ? ['début'] : [], // ✅ FIX: Tag spécial pour le début
        visitCount: 0,
        difficulty: 'medium',
      },
    };

    nodes.push(newNode);
  });

  // ✅ FIX: Validation que le nœud "1" existe
  const startNode = nodes.find((n) => n.id === '1');
  if (!startNode) {
    console.warn(
      '⚠️ Aucun nœud avec ID "1" trouvé, le premier nœud sera considéré comme le début'
    );
  }

  console.log('📊 Migration terminée:', {
    nodesTotal: nodes.length,
    startNodeId: startNode?.id || nodes[0]?.id || 'unknown',
    nodesWithChoices: nodes.filter((n) => n.choices.length > 0).length,
  });

  return nodes;
}
