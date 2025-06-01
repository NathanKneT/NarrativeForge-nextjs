'use client';

import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@/components/LazyReactFlow';
import { Play, Star } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

// Types stricts pour les props du composant avec compatibilité React Flow v12
interface StartNodeComponentProps extends NodeProps<EditorNode> {
  id: string; // ✅ Assurer l'accès à l'ID du nœud React Flow
}

export const StartNodeComponent: React.FC<StartNodeComponentProps> = ({
  data,
  selected = false,
  id, // ✅ Destructurer l'ID du nœud React Flow
}) => {
  const { storyNode } = data;

  // Optimisation: mémoriser le contenu tronqué
  const { cleanContent } = useMemo(() => {
    const truncated =
      storyNode.content.length > 80
        ? storyNode.content.substring(0, 80) + '...'
        : storyNode.content;

    const clean = truncated.replace(/<[^>]*>/g, '');

    return { cleanContent: clean };
  }, [storyNode.content]);

  // ✅ FIX: Calcul optimisé des positions des handles - CORRIGÉ
  const handlePositions = useMemo(() => {
    const choicesCount = storyNode.choices.length;
    const nodeId = data.id || storyNode.id; // ✅ Utiliser l'ID du nœud React Flow

    console.log(`🔍 [${storyNode.title}] Calculating handles:`, {
      choicesCount,
      choices: storyNode.choices.map((c) => ({ id: c.id, text: c.text })),
    });

    const existingHandles = [];

    // Si on a des choix spécifiques, les ajouter
    if (choicesCount > 0) {
      const nodeWidth = 250;
      const handleSpacing = Math.min(
        60,
        (nodeWidth - 40) / Math.max(1, choicesCount - 1)
      );
      const startX =
        (nodeWidth - handleSpacing * Math.max(0, choicesCount - 1)) / 2;

      storyNode.choices.forEach((choice, index) => {
        existingHandles.push({
          choiceId: choice.id,
          left: startX + index * handleSpacing,
          bottom: -6,
        });
      });
    }

    // ✅ FIX: TOUJOURS garder un handle par défaut si pas de choix
    if (choicesCount === 0) {
      existingHandles.push({
        choiceId: `${nodeId}-default-source`,
        left: 125, // Centré
        bottom: -6,
      });
    }

    console.log(`🔍 Final handles for ${storyNode.title}:`, existingHandles);
    return existingHandles;
  }, [storyNode.choices, data.id, storyNode.title]);

  return (
    <div
      className={`relative min-w-[250px] max-w-[300px] rounded-lg border-2 bg-gradient-to-br from-green-700 to-green-800 p-4 shadow-lg transition-all ${
        selected
          ? 'border-green-400 shadow-green-400/25'
          : 'border-green-600 hover:border-green-500'
      }`}
    >
      {/* Header avec icône spéciale */}
      <div className="mb-3 flex items-center gap-2">
        <div className="drag-handle flex flex-1 cursor-move items-center gap-2 rounded p-1 hover:bg-green-600">
          <div className="relative">
            <Play size={18} className="flex-shrink-0 text-green-300" />
            <Star
              size={10}
              className="absolute -right-1 -top-1 text-yellow-400"
            />
          </div>
          <h3 className="flex-1 truncate font-bold text-white">
            {storyNode.title}
          </h3>
        </div>
        <span className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white">
          DÉBUT
        </span>
      </div>

      {/* Content Preview */}
      <div className="mb-3 text-sm leading-relaxed text-green-100">
        {cleanContent}
      </div>

      {/* Start Node Info */}
      <div className="mb-3 flex items-center justify-between text-xs text-green-200">
        <span>Point de départ</span>
        <span>{storyNode.choices.length} direction(s)</span>
      </div>

      {/* Special indicator */}
      <div className="mb-2 flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
        <span className="text-xs text-green-200">Début de l'histoire</span>
      </div>

      {/* ✅ FIX: Handles de sortie avec positionnement précis et UX améliorée */}
      {handlePositions.map(({ choiceId, left, bottom }) => (
        <Handle
          key={choiceId}
          type="source"
          position={Position.Bottom}
          id={choiceId}
          // ✅ FIX: Handles plus gros et plus visibles
          className="border-3 h-6 w-6 cursor-pointer border-white bg-green-500 shadow-lg transition-all hover:scale-125 hover:bg-green-400"
          style={{
            left: `${left}px`,
            bottom: `${bottom}px`,
            borderRadius: '50%',
            // ✅ FIX: Zone de clic plus grande
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)', // Halo vert
          }}
        />
      ))}

      {/* Debug info pour les choix (en mode développement) */}
      {process.env.NODE_ENV === 'development' &&
        storyNode.choices.length > 0 && (
          <div className="absolute -bottom-8 left-0 text-xs text-green-300 opacity-50">
            {storyNode.choices.length} directions • {handlePositions.length}{' '}
            handles
          </div>
        )}
    </div>
  );
};
