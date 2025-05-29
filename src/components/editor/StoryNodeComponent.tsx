'use client';

import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@/components/LazyReactFlow';
import { FileText, Eye, Edit, Copy, Trash2 } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

// Types stricts pour les props du composant avec compatibilité React Flow v12
interface StoryNodeComponentProps extends NodeProps<EditorNode> {
  id?: string; // ✅ Assurer l'accès à l'ID du nœud React Flow
}

export const StoryNodeComponent: React.FC<StoryNodeComponentProps> = ({ 
  data, 
  selected = false,
  id // ✅ Destructurer l'ID du nœud React Flow
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
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[250px] max-w-[300px] shadow-lg transition-all group relative ${
      selected 
        ? 'border-blue-500 shadow-blue-500/25' 
        : 'border-gray-600 hover:border-gray-500'
    }`}>
      {/* ✅ FIX: Handle d'entrée plus visible */}
      <Handle
        type="target"
        position={Position.Top}
        // ✅ FIX: Handle d'entrée plus gros
        className="w-6 h-6 bg-blue-500 border-3 border-white shadow-lg hover:bg-blue-400 hover:scale-125 transition-all"
        style={{
          borderRadius: '50%',
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)', // Halo bleu
        }}
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

      {/* ✅ FIX: Handles de sortie positionnés avec précision et UX améliorée */}
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
        <div className="absolute -bottom-8 left-0 text-xs text-gray-500 opacity-50">
          {storyNode.choices.length} choix • {handlePositions.length} handles
        </div>
      )}
    </div>
  );
};