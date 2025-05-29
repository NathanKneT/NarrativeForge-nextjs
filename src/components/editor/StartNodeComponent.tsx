'use client';

import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@/components/LazyReactFlow';
import { Play, Star } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

// Types stricts pour les props du composant avec compatibilité React Flow v12
interface StartNodeComponentProps extends NodeProps<EditorNode> {
  id?: string; // ✅ Assurer l'accès à l'ID du nœud React Flow
}

export const StartNodeComponent: React.FC<StartNodeComponentProps> = ({ 
  data, 
  selected = false,
  id // ✅ Destructurer l'ID du nœud React Flow
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

  // ✅ FIX: Calcul optimisé des positions des handles - CORRIGÉ
  const handlePositions = useMemo(() => {
    const choicesCount = storyNode.choices.length;
    const nodeId = data.id || storyNode.id; // ✅ Utiliser l'ID du nœud React Flow
    
    console.log(`🔍 [${storyNode.title}] Calculating handles:`, {
      choicesCount,
      choices: storyNode.choices.map(c => ({ id: c.id, text: c.text }))
    });
    
    const existingHandles = [];
    
    // Si on a des choix spécifiques, les ajouter
    if (choicesCount > 0) {
      const nodeWidth = 250;
      const handleSpacing = Math.min(60, (nodeWidth - 40) / Math.max(1, choicesCount - 1));
      const startX = (nodeWidth - (handleSpacing * Math.max(0, choicesCount - 1))) / 2;
      
      storyNode.choices.forEach((choice, index) => {
        existingHandles.push({
          choiceId: choice.id,
          left: startX + (index * handleSpacing),
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

      {/* ✅ FIX: Handles de sortie avec positionnement précis et UX améliorée */}
      {handlePositions.map(({ choiceId, left, bottom }) => (
        <Handle
          key={choiceId}
          type="source"
          position={Position.Bottom}
          id={choiceId}
          // ✅ FIX: Handles plus gros et plus visibles
          className="w-6 h-6 bg-green-500 border-3 border-white transition-all hover:bg-green-400 hover:scale-125 cursor-pointer shadow-lg"
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
      {process.env.NODE_ENV === 'development' && storyNode.choices.length > 0 && (
        <div className="absolute -bottom-8 left-0 text-xs text-green-300 opacity-50">
          {storyNode.choices.length} directions • {handlePositions.length} handles
        </div>
      )}
    </div>
  );
};