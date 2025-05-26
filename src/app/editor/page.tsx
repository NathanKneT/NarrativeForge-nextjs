'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { StoryEditor } from '@/components/StoryEditor';
import { StoryProject } from '@/types/editor';

// Type guard pour vérifier si nous sommes côté client
function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

// Fonction utilitaire pour obtenir une clé de projet sécurisée
function getProjectKey(projectId: string): string {
  // Validation et nettoyage de l'ID du projet
  const cleanId = projectId.replace(/[^a-zA-Z0-9-_]/g, '');
  return `asylum-project-${cleanId}`;
}

export default function EditorPage(): React.ReactElement {
  const [currentProject, setCurrentProject] = useState<StoryProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger un projet depuis localStorage avec gestion d'erreur stricte
  const loadProject = useCallback((projectId: string): void => {
    if (!isClientSide()) {
      console.warn('loadProject appelé côté serveur');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const projectKey = getProjectKey(projectId);
      const projectData = localStorage.getItem(projectKey);
      
      if (!projectData) {
        setError(`Projet "${projectId}" non trouvé`);
        setIsLoading(false);
        return;
      }

      const parsedProject = JSON.parse(projectData) as StoryProject;
      
      // Validation basique du projet
      if (!parsedProject.id || !parsedProject.name || !Array.isArray(parsedProject.nodes)) {
        setError('Format de projet invalide');
        setIsLoading(false);
        return;
      }

      // Reconvertir les dates si nécessaire
      if (typeof parsedProject.metadata.createdAt === 'string') {
        parsedProject.metadata.createdAt = new Date(parsedProject.metadata.createdAt);
      }
      if (typeof parsedProject.metadata.updatedAt === 'string') {
        parsedProject.metadata.updatedAt = new Date(parsedProject.metadata.updatedAt);
      }

      setCurrentProject(parsedProject);
      console.log('✅ Projet chargé:', parsedProject.name);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur lors du chargement du projet:', error);
      setError(`Erreur lors du chargement: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder un projet dans localStorage
  const saveProject = useCallback((project: StoryProject): void => {
    if (!isClientSide()) {
      console.warn('saveProject appelé côté serveur');
      return;
    }

    try {
      const projectKey = getProjectKey(project.id);
      
      // Sérialiser le projet avec les dates en ISO string
      const serializedProject = {
        ...project,
        metadata: {
          ...project.metadata,
          createdAt: project.metadata.createdAt.toISOString(),
          updatedAt: project.metadata.updatedAt.toISOString(),
        }
      };

      localStorage.setItem(projectKey, JSON.stringify(serializedProject));
      console.log('💾 Projet sauvegardé:', project.name);
      
      // Notifier le succès
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Projet sauvegardé', {
          body: `"${project.name}" a été sauvegardé avec succès`,
          icon: '/favicon.ico'
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde: ${errorMessage}`);
    }
  }, []);

  // Charger depuis une sélection de fichier
  const loadFromFile = useCallback((): void => {
    if (!isClientSide()) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.asylum';
    input.style.display = 'none';

    input.onchange = (e: Event): void => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>): void => {
        try {
          const content = event.target?.result as string;
          if (!content) {
            throw new Error('Fichier vide ou illisible');
          }

          const project = JSON.parse(content) as StoryProject;
          
          // Validation et conversion des dates
          if (typeof project.metadata.createdAt === 'string') {
            project.metadata.createdAt = new Date(project.metadata.createdAt);
          }
          if (typeof project.metadata.updatedAt === 'string') {
            project.metadata.updatedAt = new Date(project.metadata.updatedAt);
          }

          setCurrentProject(project);
          console.log('✅ Projet chargé depuis fichier:', project.name);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          console.error('❌ Erreur lors du chargement du fichier:', error);
          alert(`Erreur lors du chargement du fichier: ${errorMessage}`);
        }
      };

      reader.onerror = (): void => {
        alert('Erreur lors de la lecture du fichier');
      };

      reader.readAsText(file);
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }, []);

  // Exporter le projet dans différents formats
  const exportProject = useCallback((format: string): void => {
    if (!currentProject || !isClientSide()) return;

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(currentProject, null, 2);
          filename = `${currentProject.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
          mimeType = 'application/json';
          break;

        case 'asylum':
          content = JSON.stringify({
            ...currentProject,
            metadata: {
              ...currentProject.metadata,
              exportedAt: new Date().toISOString(),
              exportFormat: 'asylum-v1'
            }
          }, null, 2);
          filename = `${currentProject.name.replace(/[^a-zA-Z0-9]/g, '_')}.asylum`;
          mimeType = 'application/json';
          break;

        default:
          throw new Error(`Format d'export non supporté: ${format}`);
      }

      // Créer et télécharger le fichier
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('📁 Projet exporté:', filename);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur lors de l\'export:', error);
      alert(`Erreur lors de l'export: ${errorMessage}`);
    }
  }, [currentProject]);

  // Charger automatiquement un projet au démarrage
  useEffect(() => {
    if (!isClientSide()) return;

    try {
      // Vérifier s'il y a un projet spécifié dans l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('project');

      if (projectId) {
        loadProject(projectId);
        return;
      }

      // Sinon, charger l'auto-sauvegarde s'il existe
      const autoSaveData = localStorage.getItem('asylum-editor-autosave');
      if (autoSaveData) {
        try {
          const autoSaveProject = JSON.parse(autoSaveData) as StoryProject;
          
          // Reconvertir les dates
          if (typeof autoSaveProject.metadata.createdAt === 'string') {
            autoSaveProject.metadata.createdAt = new Date(autoSaveProject.metadata.createdAt);
          }
          if (typeof autoSaveProject.metadata.updatedAt === 'string') {
            autoSaveProject.metadata.updatedAt = new Date(autoSaveProject.metadata.updatedAt);
          }

          setCurrentProject(autoSaveProject);
          console.log('✅ Auto-sauvegarde chargée');
        } catch (error) {
          console.warn('⚠️ Auto-sauvegarde corrompue, ignorée');
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement initial:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadProject]);

  // Demander permission pour les notifications
  useEffect(() => {
    if (isClientSide() && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement de l'éditeur...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-white mb-4">Erreur</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(false);
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            type="button"
          >
            Continuer sans projet
          </button>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="h-screen">
      <StoryEditor
        onSave={saveProject}
        onLoad={loadFromFile}
        onExport={exportProject}
        onDataUpdate={(nodes, edges, project) => {
          // Optionnel: synchroniser avec l'état local
          if (project && project !== currentProject) {
            setCurrentProject(project);
          }
        }}
      />
    </div>
  );
}