'use client';

import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText, Eye, Edit, Copy, Trash2 } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

// Types stricts pour les props du composant avec compatibilité React Flow v12
interface StoryNodeComponentProps extends NodeProps<EditorNode> {
  // Props additionnelles si nécessaires
}

export const StoryNodeComponent: React.FC<StoryNodeComponentProps> = ({ 
  data, 
  selected = false,
}) => {
  const { storyNode } = data;
  
  // Optimisation: mémoriser le contenu tronqué
  const { cleanContent } = useMemo(() => {
    const truncated = storyNode.content.length > 100 
      ? storyNode.content.substring(0, 100) + '...'
      : storyNode.content;
    
    // Remove HTML tags for preview
    const clean = truncated.replace(/<[^>]*>/g, '');
    
    return { cleanContent: clean };
  }, [storyNode.content]);

  // Calcul optimisé des positions des handles
  const handlePositions = useMemo(() => {
    const choicesCount = storyNode.choices.length;
    if (choicesCount === 0) return [];

    const nodeWidth = 250;
    
    // Un seul choix : centrer
    if (choicesCount === 1) {
      const firstChoice = storyNode.choices[0];
      if (!firstChoice) return [];
      
      return [{
        choiceId: firstChoice.id,
        left: nodeWidth / 2 - 6, // Centré (6px = moitié de la largeur du handle)
        bottom: -6,
      }];
    }
    
    // Plusieurs choix : répartir uniformément
    const totalSpacing = nodeWidth - 60; // Marges de sécurité (30px de chaque côté)
    const spaceBetween = totalSpacing / Math.max(1, choicesCount - 1);
    
    return storyNode.choices.map((choice, index) => ({
      choiceId: choice.id,
      left: 30 + (index * spaceBetween),
      bottom: -6,
    }));
  }, [storyNode.choices]);

  return (
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[250px] max-w-[300px] shadow-lg transition-all group relative ${
      selected 
        ? 'border-blue-500 shadow-blue-500/25' 
        : 'border-gray-600 hover:border-gray-500'
    }`}>
      {/* Handle d'entrée */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />

      {/* Header - Zone de drag spécifique */}
      <div className="flex items-center gap-2 mb-3">
        <div className="drag-handle cursor-move p-1 hover:bg-gray-700 rounded flex items-center gap-2 flex-1">
          <FileText size={18} className="text-blue-400 flex-shrink-0" />
          <h3 className="font-medium text-white truncate flex-1">
            {storyNode.title}
          </h3>
        </div>
      </div>

      {/* Content Preview */}
      <div className="text-sm text-gray-300 mb-3 leading-relaxed">
        {cleanContent}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>ID: {storyNode.id}</span>
        <span>{storyNode.choices.length} choix</span>
      </div>

      {/* Tags */}
      {storyNode.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {storyNode.metadata.tags.slice(0, 3).map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-600 text-white text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {storyNode.metadata.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
              +{storyNode.metadata.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Difficulty Indicator */}
      {storyNode.metadata.difficulty && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">Difficulté:</span>
          <div className={`px-2 py-1 rounded text-xs ${
            storyNode.metadata.difficulty === 'easy' 
              ? 'bg-green-600 text-white'
              : storyNode.metadata.difficulty === 'medium'
              ? 'bg-yellow-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {storyNode.metadata.difficulty === 'easy' && 'Facile'}
            {storyNode.metadata.difficulty === 'medium' && 'Moyen'}
            {storyNode.metadata.difficulty === 'hard' && 'Difficile'}
          </div>
        </div>
      )}

      {/* Quick Actions (visible on hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
        <button
          className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          title="Prévisualiser"
          type="button"
        >
          <Eye size={12} />
        </button>
        <button
          className="p-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          title="Éditer"
          type="button"
        >
          <Edit size={12} />
        </button>
        <button
          className="p-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          title="Dupliquer"
          type="button"
        >
          <Copy size={12} />
        </button>
        <button
          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          title="Supprimer"
          type="button"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Handles de sortie positionnés avec précision */}
      {handlePositions.length > 0 ? (
        handlePositions.map(({ choiceId, left, bottom }: { choiceId: string; left: number; bottom: number }) => (
          <Handle
            key={choiceId}
            type="source"
            position={Position.Bottom}
            id={choiceId}
            className="w-3 h-3 bg-green-500 border-2 border-white transition-all hover:bg-green-400 hover:scale-110"
            style={{
              left: `${left}px`,
              bottom: `${bottom}px`,
            }}
          />
        ))
      ) : (
        // Handle de sortie par défaut si pas de choix
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-green-500 border-2 border-white"
        />
      )}

      {/* Debug info pour les choix (en mode développement) */}
      {process.env.NODE_ENV === 'development' && storyNode.choices.length > 0 && (
        <div className="absolute -bottom-8 left-0 text-xs text-gray-500 opacity-50">
          {storyNode.choices.length} choix • {handlePositions.length} handles
        </div>
      )}
    </div>
  );
};