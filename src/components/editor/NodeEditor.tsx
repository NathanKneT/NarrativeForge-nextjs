'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Copy, Plus, Minus, Eye, Code } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'content' | 'choices' | 'metadata'>('content');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setEditedNode(node.data.storyNode);
  }, [node]);

  const handleSave = () => {
    onSave(editedNode);
  };

  const updateNode = (updates: Partial<StoryNode>) => {
    setEditedNode(prev => ({ ...prev, ...updates }));
  };

  const addChoice = () => {
    const newChoice: Choice = {
      id: `choice-${Date.now()}`,
      text: 'Nouveau choix',
      nextNodeId: '',
      conditions: [],
      consequences: [],
    };

    updateNode({
      choices: [...editedNode.choices, newChoice]
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
          tags: [...editedNode.metadata.tags, tag.trim()]
        }
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateNode({
      metadata: {
        ...editedNode.metadata,
        tags: editedNode.metadata.tags.filter(tag => tag !== tagToRemove)
      }
    });
  };

  const tabs: Array<{ id: 'content' | 'choices' | 'metadata', label: string, icon: React.FC<{ size: number }> }> = [
    { id: 'content', label: 'Contenu', icon: Code },
    { id: 'choices', label: 'Choix', icon: Plus },
    { id: 'metadata', label: 'Métadonnées', icon: Eye },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed right-0 top-0 h-full w-96 bg-gray-800 border-l border-gray-700 shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Éditer le nœud</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Node type indicator */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              node.data.nodeType === 'start' 
                ? 'bg-green-600 text-white'
                : node.data.nodeType === 'end'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
            }`}>
              {node.data.nodeType === 'start' && 'DÉBUT'}
              {node.data.nodeType === 'end' && 'FIN'}
              {node.data.nodeType === 'story' && 'SCÈNE'}
            </span>
            <span className="text-sm text-gray-400">ID: {editedNode.id}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Sauvegarder
            </button>
            <button
              onClick={onDuplicate}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              title="Dupliquer"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce nœud ?')) {
                  onDelete();
                }
              }}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              title="Supprimer"
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
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={editedNode.title}
                  onChange={(e) => updateNode({ title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Contenu
                  </label>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors flex items-center gap-1"
                  >
                    <Eye size={12} />
                    {previewMode ? 'Éditer' : 'Aperçu'}
                  </button>
                </div>
                
                {previewMode ? (
                  <div 
                    className="w-full min-h-[200px] p-3 bg-gray-700 text-white rounded border border-gray-600 prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: editedNode.content }}
                  />
                ) : (
                  <textarea
                    value={editedNode.content}
                    onChange={(e) => updateNode({ content: e.target.value })}
                    className="w-full min-h-[200px] px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-y"
                    placeholder="Contenu du nœud... (HTML supporté)"
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'choices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">
                  Choix ({editedNode.choices.length})
                </h3>
                <button
                  onClick={addChoice}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Ajouter
                </button>
              </div>

              {editedNode.choices.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Plus size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Aucun choix défini</p>
                  <p className="text-xs">Les nœuds de fin nont généralement pas de choix</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editedNode.choices.map((choice, index) => (
                    <div key={choice.id} className="p-3 bg-gray-700 rounded border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Choix {index + 1}</span>
                        <button
                          onClick={() => removeChoice(index)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Supprimer le choix"
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => updateChoice(index, { text: e.target.value })}
                        placeholder="Texte du choix"
                        className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm mb-2"
                      />
                      
                      <input
                        type="text"
                        value={choice.nextNodeId}
                        onChange={(e) => updateChoice(index, { nextNodeId: e.target.value })}
                        placeholder="ID du nœud suivant"
                        className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulté
                </label>
                <select
                  value={editedNode.metadata.difficulty || 'medium'}
                  onChange={(e) => updateNode({
                    metadata: {
                      ...editedNode.metadata,
                      difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                    }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedNode.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-600 text-white text-xs rounded flex items-center gap-1"
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
                  placeholder="Ajouter un tag (Entrée pour confirmer)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de visites
                </label>
                <input
                  type="number"
                  value={editedNode.metadata.visitCount}
                  onChange={(e) => updateNode({
                    metadata: {
                      ...editedNode.metadata,
                      visitCount: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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