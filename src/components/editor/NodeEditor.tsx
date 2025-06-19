'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Trash2,
  Copy,
  Plus,
  Minus,
  Eye,
  Code,
  LucideIcon,
} from 'lucide-react';
import { EditorNode } from '@/types/editor';
import { StoryNode, Choice } from '@/types/story';

interface NodeEditorProps {
  node: EditorNode;
  onSave: (updatedNode: StoryNode) => void;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  onSave,
  onClose,
  onDelete,
  onDuplicate,
}) => {
  const [editedNode, setEditedNode] = useState<StoryNode>(node.data.storyNode);
  const [activeTab, setActiveTab] = useState<
    'content' | 'choices' | 'metadata'
  >('content');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setEditedNode(node.data.storyNode);
  }, [node]);

  const handleSave = () => {
    onSave(editedNode);
  };

  const updateNode = (updates: Partial<StoryNode>) => {
    setEditedNode((prev) => ({ ...prev, ...updates }));
  };

  const addChoice = () => {
    const newChoice: Choice = {
      id: `choice-${Date.now()}`,
      text: 'New choice',
      nextNodeId: '',
      conditions: [],
      consequences: [],
    };

    updateNode({
      choices: [...editedNode.choices, newChoice],
    });
  };

  const updateChoice = (index: number, updates: Partial<Choice>) => {
    const updatedChoices = editedNode.choices.map((choice, i) =>
      i === index ? { ...choice, ...updates } : choice
    );
    updateNode({ choices: updatedChoices });
  };

  const removeChoice = (index: number) => {
    const updatedChoices = editedNode.choices.filter((_, i) => i !== index);
    updateNode({ choices: updatedChoices });
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !editedNode.metadata.tags.includes(tag.trim())) {
      updateNode({
        metadata: {
          ...editedNode.metadata,
          tags: [...editedNode.metadata.tags, tag.trim()],
        },
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateNode({
      metadata: {
        ...editedNode.metadata,
        tags: editedNode.metadata.tags.filter((tag) => tag !== tagToRemove),
      },
    });
  };

  const tabs: Array<{
    id: 'content' | 'choices' | 'metadata';
    label: string;
    icon: LucideIcon;
  }> = [
    { id: 'content', label: 'Content', icon: Code },
    { id: 'choices', label: 'Choices', icon: Plus },
    { id: 'metadata', label: 'Metadata', icon: Eye },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-gray-700 bg-gray-800 shadow-xl"
      >
        {/* Header */}
        <div className="border-b border-gray-700 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Edit Node</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Node type indicator */}
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${
                node.data.nodeType === 'start'
                  ? 'bg-green-600 text-white'
                  : node.data.nodeType === 'end'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
              }`}
            >
              {node.data.nodeType === 'start' && 'START'}
              {node.data.nodeType === 'end' && 'END'}
              {node.data.nodeType === 'story' && 'SCENE'}
            </span>
            <span className="text-sm text-gray-400">ID: {editedNode.id}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-green-600 px-3 py-2 text-white transition-colors hover:bg-green-700"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={onDuplicate}
              className="rounded bg-purple-600 px-3 py-2 text-white transition-colors hover:bg-purple-700"
              title="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this node?')) {
                  onDelete();
                }
              }}
              className="rounded bg-red-600 px-3 py-2 text-white transition-colors hover:bg-red-700"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border-b-2 border-blue-400 bg-gray-700 text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  value={editedNode.title}
                  onChange={(e) => updateNode({ title: e.target.value })}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Content
                  </label>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1 rounded bg-gray-600 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-500"
                  >
                    <Eye size={12} />
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                </div>

                {previewMode ? (
                  <div
                    className="prose prose-invert prose-sm min-h-[200px] w-full max-w-none rounded border border-gray-600 bg-gray-700 p-3 text-white"
                    dangerouslySetInnerHTML={{ __html: editedNode.content }}
                  />
                ) : (
                  <textarea
                    value={editedNode.content}
                    onChange={(e) => updateNode({ content: e.target.value })}
                    className="min-h-[200px] w-full resize-y rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Node content... (HTML supported)"
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'choices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">
                  Choices ({editedNode.choices.length})
                </h3>
                <button
                  onClick={addChoice}
                  className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {editedNode.choices.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <Plus size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No choices defined</p>
                  <p className="text-xs">
                    End nodes typically have no choices
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editedNode.choices.map((choice, index) => (
                    <div
                      key={choice.id}
                      className="rounded border border-gray-600 bg-gray-700 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Choice {index + 1}
                        </span>
                        <button
                          onClick={() => removeChoice(index)}
                          className="p-1 text-red-400 transition-colors hover:text-red-300"
                          title="Remove choice"
                        >
                          <Minus size={14} />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) =>
                          updateChoice(index, { text: e.target.value })
                        }
                        placeholder="Choice text"
                        className="mb-2 w-full rounded border border-gray-500 bg-gray-600 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />

                      <input
                        type="text"
                        value={choice.nextNodeId}
                        onChange={(e) =>
                          updateChoice(index, { nextNodeId: e.target.value })
                        }
                        placeholder="Next node ID"
                        className="w-full rounded border border-gray-500 bg-gray-600 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              {/* Difficulty */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Difficulty
                </label>
                <select
                  value={editedNode.metadata.difficulty || 'medium'}
                  onChange={(e) =>
                    updateNode({
                      metadata: {
                        ...editedNode.metadata,
                        difficulty: e.target.value as
                          | 'easy'
                          | 'medium'
                          | 'hard',
                      },
                    })
                  }
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Tags
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {editedNode.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs text-white"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-purple-200 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add a tag (Enter to confirm)"
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Visit Count */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Visit Count
                </label>
                <input
                  type="number"
                  value={editedNode.metadata.visitCount}
                  onChange={(e) =>
                    updateNode({
                      metadata: {
                        ...editedNode.metadata,
                        visitCount: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};