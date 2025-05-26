
'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Flag, Trophy, Skull, Heart } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

// Types stricts pour les props du composant avec compatibilité React Flow v12
interface EndNodeComponentProps extends NodeProps<EditorNode> {
  // Props additionnelles si nécessaires
}

export const EndNodeComponent: React.FC<EndNodeComponentProps> = ({ 
  data, 
  selected = false 
}) => {
  const { storyNode } = data;
  
  const truncatedContent = storyNode.content.length > 80 
    ? storyNode.content.substring(0, 80) + '...'
    : storyNode.content;

  const cleanContent = truncatedContent.replace(/<[^>]*>/g, '');

  // Déterminer le type de fin basé sur les tags ou le titre
  const getEndingIcon = () => {
    const title = storyNode.title.toLowerCase();
    const tags = storyNode.metadata.tags.map(tag => tag.toLowerCase());
    
    if (title.includes('mort') || tags.includes('death') || tags.includes('mort')) {
      return <Skull size={18} className="text-red-400" />;
    }
    if (title.includes('victoire') || tags.includes('victory') || tags.includes('success')) {
      return <Trophy size={18} className="text-yellow-400" />;
    }
    if (title.includes('amour') || tags.includes('love') || tags.includes('romance')) {
      return <Heart size={18} className="text-pink-400" />;
    }
    return <Flag size={18} className="text-red-300" />;
  };

  const getEndingColor = () => {
    const title = storyNode.title.toLowerCase();
    const tags = storyNode.metadata.tags.map(tag => tag.toLowerCase());
    
    if (title.includes('mort') || tags.includes('death')) {
      return 'from-red-800 to-red-900 border-red-600';
    }
    if (title.includes('victoire') || tags.includes('victory')) {
      return 'from-yellow-700 to-yellow-800 border-yellow-600';
    }
    if (title.includes('amour') || tags.includes('love')) {
      return 'from-pink-700 to-pink-800 border-pink-600';
    }
    return 'from-red-700 to-red-800 border-red-600';
  };

  return (
    <div className={`bg-gradient-to-br ${getEndingColor()} border-2 rounded-lg p-4 min-w-[250px] max-w-[300px] shadow-lg transition-all ${
      selected 
        ? 'border-red-400 shadow-red-400/25' 
        : 'hover:border-red-500'
    }`}>
      {/* Handle d'entrée */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-red-400 border-2 border-white shadow-lg"
      />

      {/* Header avec icône spéciale */}
      <div className="flex items-center gap-2 mb-3">
        <div className="drag-handle cursor-move p-1 hover:bg-red-600 rounded flex items-center gap-2 flex-1">
          {getEndingIcon()}
          <h3 className="font-bold text-white truncate flex-1">
            {storyNode.title}
          </h3>
        </div>
        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
          FIN
        </span>
      </div>

      {/* Content Preview */}
      <div className="text-sm text-red-100 mb-3 leading-relaxed">
        {cleanContent}
      </div>

      {/* End Node Info */}
      <div className="flex items-center justify-between text-xs text-red-200 mb-3">
        <span>Point final</span>
        <span>Terminal</span>
      </div>

      {/* Tags spéciaux pour les fins */}
      {storyNode.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {storyNode.metadata.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Special indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <span className="text-xs text-red-200">Fin de l'histoire</span>
      </div>

      {/* Pas de handle de sortie car c'est un nœud terminal */}
    </div>
  );
};