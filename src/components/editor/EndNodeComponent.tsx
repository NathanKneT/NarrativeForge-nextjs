'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@/components/LazyReactFlow'; // ✅ CORRIGÉ: Import de Position directement
import { Flag, Trophy, Skull, Heart } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

interface EndNodeComponentProps extends NodeProps<EditorNode> {
  // Props additionnelles si nécessaires
}

export const EndNodeComponent: React.FC<EndNodeComponentProps> = ({
  data,
  selected = false,
}) => {
  const { storyNode } = data;

  const truncatedContent =
    storyNode.content.length > 80
      ? storyNode.content.substring(0, 80) + '...'
      : storyNode.content;

  const cleanContent = truncatedContent.replace(/<[^>]*>/g, '');

  // Déterminer le type de fin basé sur les tags ou le titre
  const getEndingIcon = () => {
    const title = storyNode.title.toLowerCase();
    const tags = storyNode.metadata.tags.map((tag) => tag.toLowerCase());

    if (
      title.includes('mort') ||
      tags.includes('death') ||
      tags.includes('mort')
    ) {
      return <Skull size={18} className="text-red-400" />;
    }
    if (
      title.includes('victoire') ||
      tags.includes('victory') ||
      tags.includes('success')
    ) {
      return <Trophy size={18} className="text-yellow-400" />;
    }
    if (
      title.includes('amour') ||
      tags.includes('love') ||
      tags.includes('romance')
    ) {
      return <Heart size={18} className="text-pink-400" />;
    }
    return <Flag size={18} className="text-red-300" />;
  };

  const getEndingColor = () => {
    const title = storyNode.title.toLowerCase();
    const tags = storyNode.metadata.tags.map((tag) => tag.toLowerCase());

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
    <div
      className={`bg-gradient-to-br ${getEndingColor()} min-w-[250px] max-w-[300px] rounded-lg border-2 p-4 shadow-lg transition-all ${
        selected ? 'border-red-400 shadow-red-400/25' : 'hover:border-red-500'
      }`}
    >
      {/* Handle d'entrée */}
      <Handle
        type="target"
        position={Position.Top} // ✅ CORRIGÉ: Utilisation de Position.Top
        className="h-4 w-4 border-2 border-white bg-red-400 shadow-lg"
      />

      {/* Header avec icône spéciale */}
      <div className="mb-3 flex items-center gap-2">
        <div className="drag-handle flex flex-1 cursor-move items-center gap-2 rounded p-1 hover:bg-red-600">
          {getEndingIcon()}
          <h3 className="flex-1 truncate font-bold text-white">
            {storyNode.title}
          </h3>
        </div>
        <span className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white">
          FIN
        </span>
      </div>

      {/* Content Preview */}
      <div className="mb-3 text-sm leading-relaxed text-red-100">
        {cleanContent}
      </div>

      {/* End Node Info */}
      <div className="mb-3 flex items-center justify-between text-xs text-red-200">
        <span>Point final</span>
        <span>Terminal</span>
      </div>

      {/* Tags spéciaux pour les fins */}
      {storyNode.metadata.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {storyNode.metadata.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="rounded bg-red-600 px-2 py-1 text-xs text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Special indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-400"></div>
        <span className="text-xs text-red-200">Fin de l'histoire</span>
      </div>

      {/* Pas de handle de sortie car c'est un nœud terminal */}
    </div>
  );
};
