'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FolderOpen, FileText, Sparkles } from 'lucide-react';
import { StoryProject } from '@/types/editor';

interface ProjectInitModalProps {
  isOpen: boolean;
  onCreateNew: (projectName: string, description: string) => void;
  onLoadExisting: () => void;
  onClose?: () => void; // Optional because we don't always want to allow closing
  allowClose?: boolean; // Allow closing without action
}

export const ProjectInitModal: React.FC<ProjectInitModalProps> = ({
  isOpen,
  onCreateNew,
  onLoadExisting,
  onClose,
  allowClose = false,
}) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'choice' | 'create'>('choice');
  const [isCreating, setIsCreating] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProjectName('');
      setDescription('');
      setStep('choice');
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleCreateNew = () => {
    setStep('create');
  };

  const handleConfirmCreate = async () => {
    if (!projectName.trim()) {
      alert('❌ Project name is required!');
      return;
    }

    setIsCreating(true);

    try {
      await onCreateNew(projectName.trim(), description.trim());
      console.log('✅ Project created:', projectName);
    } catch (error) {
      console.error('❌ Project creation error:', error);
      alert('Error creating project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    setStep('choice');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'create' && projectName.trim()) {
      handleConfirmCreate();
    } else if (e.key === 'Escape' && allowClose && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
        onClick={allowClose ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-600 p-2">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {step === 'choice' ? "Story Editor" : 'New Project'}
                </h2>
                <p className="text-sm text-gray-400">
                  {step === 'choice'
                    ? 'Create or load a project'
                    : 'Give your story a name'}
                </p>
              </div>
            </div>
            {allowClose && onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Content according to step */}
          {step === 'choice' ? (
            <div className="space-y-4">
              <p className="mb-6 text-center text-gray-300">
                What would you like to do?
              </p>

              {/* Create New Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
                className="group flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
              >
                <div className="rounded-lg bg-white bg-opacity-20 p-2 transition-all group-hover:bg-opacity-30">
                  <Plus size={20} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Create a new story</div>
                  <div className="text-sm text-blue-100">
                    Start a blank project
                  </div>
                </div>
              </motion.button>

              {/* Load Existing Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLoadExisting}
                className="group flex w-full items-center gap-3 rounded-lg bg-gray-700 p-4 text-white transition-all duration-200 hover:bg-gray-600"
              >
                <div className="rounded-lg bg-gray-600 p-2 transition-all group-hover:bg-gray-500">
                  <FolderOpen size={20} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Load an existing project</div>
                  <div className="text-sm text-gray-300">
                    Open a saved story
                  </div>
                </div>
              </motion.button>

              {/* Info */}
              <div className="mt-6 rounded-lg border border-blue-500 border-opacity-50 bg-blue-900 bg-opacity-50 p-3">
                <div className="flex items-start gap-2">
                  <FileText
                    size={16}
                    className="mt-0.5 flex-shrink-0 text-blue-400"
                  />
                  <div className="text-sm text-blue-200">
                    <div className="mb-1 font-medium">💡 Tip</div>
                    <div>
                      Always create a new project before starting. This
                      prevents conflicts and better organizes your work.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ex: The Mysterious Odyssey"
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white transition-colors focus:border-blue-500 focus:outline-none"
                  autoFocus
                  maxLength={50}
                />
                <div className="mt-1 text-xs text-gray-400">
                  {projectName.length}/50 characters
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe your story..."
                  className="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white transition-colors focus:border-blue-500 focus:outline-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="mt-1 text-xs text-gray-400">
                  {description.length}/200 characters
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBack}
                  disabled={isCreating}
                  className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 disabled:bg-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmCreate}
                  disabled={!projectName.trim() || isCreating}
                  className="flex-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-600"
                >
                  {isCreating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Project
                    </>
                  )}
                </button>
              </div>

              {/* Keyboard shortcut */}
              <div className="pt-2 text-center text-xs text-gray-500">
                💡 Press Enter to create project
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};