'use client';

import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@/components/LazyReactFlow';
import { FileText, Eye, Edit, Copy, Trash2 } from 'lucide-react';
import { type EditorNode } from '@/types/editor';

// Strict types for component props with React Flow v12 compatibility
interface StoryNodeComponentProps extends NodeProps<EditorNode> {
  id: string; // ✅ Ensure access to React Flow node ID
}

export const StoryNodeComponent: React.FC<StoryNodeComponentProps> = ({
  data,
  selected = false,
  id, // ✅ Destructure React Flow node ID
}) => {
  const { storyNode } = data;

  // Optimization: memoize truncated content
  const { cleanContent } = useMemo(() => {
    const truncated =
      storyNode.content.length > 100
        ? storyNode.content.substring(0, 100) + '...'
        : storyNode.content;

    // Remove HTML tags for preview
    const clean = truncated.replace(/<[^>]*>/g, '');

    return { cleanContent: clean };
  }, [storyNode.content]);

  // ✅ FIX: Optimized handle position calculation - CORRECTED
  const handlePositions = useMemo(() => {
    const choicesCount = storyNode.choices.length;
    const nodeId = data.id || storyNode.id; // ✅ Use React Flow node ID

    console.log(`🔍 [${storyNode.title}] Calculating handles:`, {
      choicesCount,
      choices: storyNode.choices.map((c) => ({ id: c.id, text: c.text })),
    });

    const existingHandles = [];

    // If we have specific choices, add them
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

    // ✅ FIX: ALWAYS keep a default handle if no choices
    if (choicesCount === 0) {
      existingHandles.push({
        choiceId: `${nodeId}-default-source`,
        left: 125, // Centered
        bottom: -6,
      });
    }

    console.log(`🔍 Final handles for ${storyNode.title}:`, existingHandles);
    return existingHandles;
  }, [storyNode.choices, data.id, storyNode.title]);

  return (
    <div
      className={`group relative min-w-[250px] max-w-[300px] rounded-lg border-2 bg-gray-800 p-4 shadow-lg transition-all ${
        selected
          ? 'border-blue-500 shadow-blue-500/25'
          : 'border-gray-600 hover:border-gray-500'
      }`}
    >
      {/* ✅ FIX: More visible input handle */}
      <Handle
        type="target"
        position={Position.Top}
        // ✅ FIX: Larger input handle
        className="border-3 h-6 w-6 border-white bg-blue-500 shadow-lg transition-all hover:scale-125 hover:bg-blue-400"
        style={{
          borderRadius: '50%',
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)', // Blue halo
        }}
      />

      {/* Header - Specific drag zone */}
      <div className="mb-3 flex items-center gap-2">
        <div className="drag-handle flex flex-1 cursor-move items-center gap-2 rounded p-1 hover:bg-gray-700">
          <FileText size={18} className="flex-shrink-0 text-blue-400" />
          <h3 className="flex-1 truncate font-medium text-white">
            {storyNode.title}
          </h3>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-3 text-sm leading-relaxed text-gray-300">
        {cleanContent}
      </div>

      {/* Metadata */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>ID: {storyNode.id}</span>
        <span>{storyNode.choices.length} choices</span>
      </div>

      {/* Tags */}
      {storyNode.metadata.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {storyNode.metadata.tags
            .slice(0, 3)
            .map((tag: string, index: number) => (
              <span
                key={index}
                className="rounded bg-purple-600 px-2 py-1 text-xs text-white"
              >
                {tag}
              </span>
            ))}
          {storyNode.metadata.tags.length > 3 && (
            <span className="rounded bg-gray-600 px-2 py-1 text-xs text-gray-300">
              +{storyNode.metadata.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Difficulty Indicator */}
      {storyNode.metadata.difficulty && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">Difficulty:</span>
          <div
            className={`rounded px-2 py-1 text-xs ${
              storyNode.metadata.difficulty === 'easy'
                ? 'bg-green-600 text-white'
                : storyNode.metadata.difficulty === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-red-600 text-white'
            }`}
          >
            {storyNode.metadata.difficulty === 'easy' && 'Easy'}
            {storyNode.metadata.difficulty === 'medium' && 'Medium'}
            {storyNode.metadata.difficulty === 'hard' && 'Hard'}
          </div>
        </div>
      )}

      {/* Quick Actions (visible on hover) */}
      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          className="rounded bg-blue-600 p-1 text-white transition-colors hover:bg-blue-700"
          title="Preview"
          type="button"
        >
          <Eye size={12} />
        </button>
        <button
          className="rounded bg-gray-600 p-1 text-white transition-colors hover:bg-gray-700"
          title="Edit"
          type="button"
        >
          <Edit size={12} />
        </button>
        <button
          className="rounded bg-purple-600 p-1 text-white transition-colors hover:bg-purple-700"
          title="Duplicate"
          type="button"
        >
          <Copy size={12} />
        </button>
        <button
          className="rounded bg-red-600 p-1 text-white transition-colors hover:bg-red-700"
          title="Delete"
          type="button"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* ✅ FIX: Precisely positioned output handles with improved UX */}
      {handlePositions.map(({ choiceId, left, bottom }) => (
        <Handle
          key={choiceId}
          type="source"
          position={Position.Bottom}
          id={choiceId}
          // ✅ FIX: Larger and more visible handles
          className="border-3 h-6 w-6 cursor-pointer border-white bg-green-500 shadow-lg transition-all hover:scale-125 hover:bg-green-400"
          style={{
            left: `${left}px`,
            bottom: `${bottom}px`,
            borderRadius: '50%',
            // ✅ FIX: Larger click area
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)', // Green halo
          }}
        />
      ))}

      {/* Debug info for choices (in development mode) */}
      {process.env.NODE_ENV === 'development' &&
        storyNode.choices.length > 0 && (
          <div className="absolute -bottom-8 left-0 text-xs text-gray-500 opacity-50">
            {storyNode.choices.length} choices • {handlePositions.length} handles
          </div>
        )}
    </div>
  );
};