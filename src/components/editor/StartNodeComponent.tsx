'use client';

import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play, Star } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

// Types stricts pour les props du composant avec compatibilité React Flow v12
interface StartNodeComponentProps extends NodeProps<EditorNode> {
  // Props additionnelles si nécessaires
}

export const StartNodeComponent: React.FC<StartNodeComponentProps> = ({ 
  data, 
  selected = false 
}) => {
  const { storyNode } = data;
  
  // Optimisation: mémoriser le contenu tronqué
  const { cleanContent } = useMemo(() => {
    const truncated = storyNode.content.length > 80 
      ? storyNode.content.substring(0, 80) + '...'
      : storyNode.content;
    
    const clean = truncated.replace(/<[^>]*>/g, '');
    
    return { cleanContent: clean };
  }, [storyNode.content]);

  // Calcul optimisé des positions des handles pour les choix multiples
  const handlePositions = useMemo(() => {
    const choicesCount = storyNode.choices.length;
    if (choicesCount <= 1) return [];

    const nodeWidth = 250;
    const minSpacing = 25;
    const maxSpacing = 50;
    
    const totalAvailableWidth = nodeWidth - (2 * minSpacing);
    const idealSpacing = Math.min(maxSpacing, totalAvailableWidth / (choicesCount + 1));
    const actualSpacing = Math.max(minSpacing, idealSpacing);
    
    const totalUsedWidth = (choicesCount - 1) * actualSpacing;
    const startOffset = (nodeWidth - totalUsedWidth) / 2;
    
    return storyNode.choices.map((choice, index) => ({
      choiceId: choice.id,
      left: startOffset + (index * actualSpacing),
      bottom: -6,
    }));
  }, [storyNode.choices]);

  return (
    <div className={`bg-gradient-to-br from-green-700 to-green-800 border-2 rounded-lg p-4 min-w-[250px] max-w-[300px] shadow-lg transition-all relative ${
      selected 
        ? 'border-green-400 shadow-green-400/25' 
        : 'border-green-600 hover:border-green-500'
    }`}>
      {/* Header avec icône spéciale */}
      <div className="flex items-center gap-2 mb-3">
        <div className="drag-handle cursor-move p-1 hover:bg-green-600 rounded flex items-center gap-2 flex-1">
          <div className="relative">
            <Play size={18} className="text-green-300 flex-shrink-0" />
            <Star size={10} className="text-yellow-400 absolute -top-1 -right-1" />
          </div>
          <h3 className="font-bold text-white truncate flex-1">
            {storyNode.title}
          </h3>
        </div>
        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
          DÉBUT
        </span>
      </div>

      {/* Content Preview */}
      <div className="text-sm text-green-100 mb-3 leading-relaxed">
        {cleanContent}
      </div>

      {/* Start Node Info */}
      <div className="flex items-center justify-between text-xs text-green-200 mb-3">
        <span>Point de départ</span>
        <span>{storyNode.choices.length} direction(s)</span>
      </div>

      {/* Special indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-green-200">Début de l'histoire</span>
      </div>

      {/* Handles de sortie avec positionnement précis */}
      {handlePositions.length > 0 ? (
        // Multiples choix - handles positionnés précisément
        handlePositions.map(({ choiceId, left, bottom }) => (
          <Handle
            key={choiceId}
            type="source"
            position={Position.Bottom}
            id={choiceId}
            className="w-3 h-3 bg-green-400 border-2 border-white transition-all hover:bg-green-300 hover:scale-110"
            style={{
              left: `${left}px`,
              bottom: `${bottom}px`,
            }}
          />
        ))
      ) : (
        // Handle unique par défaut
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 bg-green-400 border-2 border-white shadow-lg transition-all hover:bg-green-300 hover:scale-110"
        />
      )}

      {/* Debug info pour les choix (en mode développement) */}
      {process.env.NODE_ENV === 'development' && storyNode.choices.length > 1 && (
        <div className="absolute -bottom-8 left-0 text-xs text-green-300 opacity-50">
          {storyNode.choices.length} directions • {handlePositions.length} handles
        </div>
      )}
    </div>
  );
};