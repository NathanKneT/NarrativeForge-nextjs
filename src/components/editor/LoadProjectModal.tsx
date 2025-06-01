'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FolderOpen,
  Calendar,
  FileText,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { StoryProject } from '@/types/editor';

interface SavedProject {
  id: string;
  name: string;
  description: string;
  savedAt: Date;
  size: string;
  nodeCount: number;
  edgeCount: number;
}

interface LoadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: StoryProject) => void;
}

export const LoadProjectModal: React.FC<LoadProjectModalProps> = ({
  isOpen,
  onClose,
  onLoadProject,
}) => {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔧 Charger les projets sauvegardés depuis localStorage
  useEffect(() => {
    if (isOpen) {
      loadSavedProjects();
    }
  }, [isOpen]);

  const loadSavedProjects = () => {
    try {
      const projects: SavedProject[] = [];

      // Parcourir localStorage pour trouver les projets
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('asylum-project-') ||
            key === 'asylum-editor-autosave')
        ) {
          const projectData = localStorage.getItem(key);
          if (projectData) {
            try {
              const parsed = JSON.parse(projectData);
              const size = new Blob([projectData]).size;

              projects.push({
                id: key,
                name: parsed.name || 'Projet sans nom',
                description: parsed.description || 'Aucune description',
                savedAt: new Date(
                  parsed.metadata?.updatedAt ||
                    parsed.metadata?.createdAt ||
                    Date.now()
                ),
                size: formatFileSize(size),
                nodeCount: parsed.nodes?.length || 0,
                edgeCount: parsed.edges?.length || 0,
              });
            } catch (error) {
              console.warn(`Erreur parsing projet ${key}:`, error);
            }
          }
        }
      }

      // Trier par date de modification (plus récent en premier)
      projects.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
      setSavedProjects(projects);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const handleLoadProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const projectData = localStorage.getItem(projectId);
      if (!projectData) {
        alert('❌ Projet non trouvé !');
        return;
      }

      const parsed = JSON.parse(projectData);
      const project: StoryProject = {
        ...parsed,
        metadata: {
          ...parsed.metadata,
          createdAt: new Date(parsed.metadata.createdAt),
          updatedAt: new Date(parsed.metadata.updatedAt),
        },
      };

      onLoadProject(project);
      onClose();
    } catch (error) {
      console.error('Erreur chargement projet:', error);
      alert('❌ Erreur lors du chargement du projet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${projectName}" ?`)) {
      localStorage.removeItem(projectId);
      loadSavedProjects(); // Recharger la liste
    }
  };

  const handleExportProject = (projectId: string, projectName: string) => {
    try {
      const projectData = localStorage.getItem(projectId);
      if (!projectData) return;

      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
      alert("❌ Erreur lors de l'export");
    }
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const projectData = JSON.parse(event.target?.result as string);
          const project: StoryProject = {
            ...projectData,
            id: `asylum-project-imported-${Date.now()}`,
            metadata: {
              ...projectData.metadata,
              createdAt: new Date(projectData.metadata.createdAt),
              updatedAt: new Date(),
            },
          };

          // Sauvegarder le projet importé
          const serialized = {
            ...project,
            metadata: {
              ...project.metadata,
              createdAt: project.metadata.createdAt.toISOString(),
              updatedAt: project.metadata.updatedAt.toISOString(),
            },
          };

          localStorage.setItem(project.id, JSON.stringify(serialized));
          loadSavedProjects(); // Recharger la liste
        } catch (error) {
          console.error('Erreur import:', error);
          alert('❌ Fichier de projet invalide');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-600 p-2">
                <FolderOpen size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Charger un Projet
                </h2>
                <p className="text-sm text-gray-400">
                  {savedProjects.length} projet(s) sauvegardé(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportProject}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white transition-colors hover:bg-green-700"
                title="Importer un projet"
              >
                <Upload size={16} />
                Importer
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Liste des projets */}
          <div className="flex-1 overflow-y-auto">
            {savedProjects.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-2 text-lg">Aucun projet sauvegardé</p>
                <p className="text-sm">
                  Créez et sauvegardez votre premier projet pour le voir ici
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ scale: 1.01 }}
                    className={`cursor-pointer rounded-lg border-2 bg-gray-700 p-4 transition-all ${
                      selectedProject === project.id
                        ? 'border-blue-500 bg-gray-600'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <FileText size={18} className="text-blue-400" />
                          <h3 className="font-medium text-white">
                            {project.name}
                          </h3>
                          {project.id === 'asylum-editor-autosave' && (
                            <span className="rounded bg-orange-600 px-2 py-1 text-xs text-white">
                              AUTO
                            </span>
                          )}
                        </div>

                        <p className="mb-2 text-sm text-gray-300">
                          {project.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {project.savedAt.toLocaleDateString()} à{' '}
                            {project.savedAt.toLocaleTimeString()}
                          </div>
                          <span>{project.nodeCount} nœuds</span>
                          <span>{project.edgeCount} connexions</span>
                          <span>{project.size}</span>
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportProject(project.id, project.name);
                          }}
                          className="rounded bg-purple-600 p-2 text-white transition-colors hover:bg-purple-700"
                          title="Exporter"
                        >
                          <Download size={14} />
                        </button>

                        {project.id !== 'asylum-editor-autosave' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id, project.name);
                            }}
                            className="rounded bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {savedProjects.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400">
                {selectedProject
                  ? 'Projet sélectionné'
                  : 'Sélectionnez un projet à charger'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    selectedProject && handleLoadProject(selectedProject)
                  }
                  disabled={!selectedProject || isLoading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-600"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <FolderOpen size={16} />
                      Charger le projet
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
