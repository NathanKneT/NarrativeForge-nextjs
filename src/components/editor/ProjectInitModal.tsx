'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FolderOpen, FileText, Sparkles } from 'lucide-react';
import { StoryProject } from '@/types/editor';

interface ProjectInitModalProps {
  isOpen: boolean;
  onCreateNew: (projectName: string, description: string) => void;
  onLoadExisting: () => void;
  onClose?: () => void; // Optionnel car on ne veut pas toujours permettre de fermer
  allowClose?: boolean; // Permettre de fermer sans action
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

  // Réinitialiser le state quand la modal s'ouvre
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
      alert('❌ Le nom du projet est obligatoire !');
      return;
    }

    setIsCreating(true);
    
    try {
      await onCreateNew(projectName.trim(), description.trim());
      console.log('✅ Projet créé:', projectName);
    } catch (error) {
      console.error('❌ Erreur création projet:', error);
      alert('Erreur lors de la création du projet');
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
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
        onClick={allowClose ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {step === 'choice' ? 'Éditeur d\'Histoire' : 'Nouveau Projet'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {step === 'choice' 
                    ? 'Créez ou chargez un projet' 
                    : 'Donnez un nom à votre histoire'
                  }
                </p>
              </div>
            </div>
            {allowClose && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
                title="Fermer"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Contenu selon l'étape */}
          {step === 'choice' ? (
            <div className="space-y-4">
              <p className="text-gray-300 text-center mb-6">
                Que souhaitez-vous faire ?
              </p>

              {/* Bouton Créer Nouveau */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 flex items-center gap-3 group"
              >
                <div className="p-2 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all">
                  <Plus size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">Créer une nouvelle histoire</div>
                  <div className="text-sm text-blue-100">Commencer un projet vierge</div>
                </div>
              </motion.button>

              {/* Bouton Charger Existant */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLoadExisting}
                className="w-full p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-3 group"
              >
                <div className="p-2 bg-gray-600 group-hover:bg-gray-500 rounded-lg transition-all">
                  <FolderOpen size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">Charger un projet existant</div>
                  <div className="text-sm text-gray-300">Ouvrir une histoire sauvegardée</div>
                </div>
              </motion.button>

              {/* Info */}
              <div className="mt-6 p-3 bg-blue-900 bg-opacity-50 border border-blue-500 border-opacity-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <div className="font-medium mb-1">💡 Conseil</div>
                    <div>
                      Créez toujours un nouveau projet avant de commencer. 
                      Cela évite les conflits et organise mieux votre travail.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Nom du projet */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du projet *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ex: L'Odyssée Mystérieuse"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  autoFocus
                  maxLength={50}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {projectName.length}/50 caractères
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez brièvement votre histoire..."
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {description.length}/200 caractères
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBack}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirmCreate}
                  disabled={!projectName.trim() || isCreating}
                  className="flex-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Créer le projet
                    </>
                  )}
                </button>
              </div>

              {/* Raccourci clavier */}
              <div className="text-xs text-gray-500 text-center pt-2">
                💡 Appuyez sur Entrée pour créer le projet
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};