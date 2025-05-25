'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { StoryProject } from '@/types/editor';
import { StoryExporter, ExportOptions } from '@/lib/storyExporter';

// Import dynamique pour éviter les problèmes SSR avec React Flow
const StoryEditor = dynamic(
  () => import('@/components/StoryEditor').then(mod => ({ default: mod.StoryEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Chargement de l'éditeur...</div>
      </div>
    )
  }
);

// Modal d'export
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, options: ExportOptions) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<'asylum-json' | 'json' | 'twine'>('asylum-json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [minify, setMinify] = useState(false);
  const [validateBeforeExport, setValidateBeforeExport] = useState(true);

  if (!isOpen) return null;

  const formats = StoryExporter.getSupportedFormats();
  const selectedFormatInfo = formats.find(f => f.id === selectedFormat);

  const handleExport = () => {
    const options: ExportOptions = {
      format: selectedFormat,
      includeMetadata,
      minify,
      validateBeforeExport
    };
    
    onExport(selectedFormat, options);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Exporter l'histoire</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sélection du format */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Format d'export
          </label>
          <div className="space-y-2">
            {formats.map((format) => (
              <label key={format.id} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={format.id}
                  checked={selectedFormat === format.id}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="text-white font-medium">{format.name}</div>
                  <div className="text-sm text-gray-400">{format.description}</div>
                  <div className="text-xs text-gray-500">Extension: {format.extension}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Options d'export */}
        <div className="mb-6 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
            />
            Inclure les métadonnées
          </label>
          
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={minify}
              onChange={(e) => setMinify(e.target.checked)}
            />
            Minifier le fichier (plus compact)
          </label>
          
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={validateBeforeExport}
              onChange={(e) => setValidateBeforeExport(e.target.checked)}
            />
            Valider avant export
          </label>
        </div>

        {/* Info sur le format sélectionné */}
        {selectedFormatInfo && (
          <div className="mb-6 p-3 bg-gray-700 rounded">
            <div className="text-sm text-gray-300">
              <div className="font-medium text-white mb-1">
                {selectedFormatInfo.name}
              </div>
              <div>{selectedFormatInfo.description}</div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Exporter
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EditorPage() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleSave = (project: StoryProject) => {
    console.log('Sauvegarde du projet:', project);
    try {
      const serializedProject = {
        ...project,
        metadata: {
          ...project.metadata,
          createdAt: project.metadata.createdAt.toISOString(),
          updatedAt: project.metadata.updatedAt.toISOString(),
        }
      };
      localStorage.setItem(`story-project-${project.id}`, JSON.stringify(serializedProject));
      console.log('✅ Projet sauvegardé localement');
      
      // Notification améliorée
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Projet sauvegardé', {
          body: `Le projet "${project.name}" a été sauvegardé`,
          icon: '/favicon.ico'
        });
      } else {
        alert('Projet sauvegardé !');
      }
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleLoad = () => {
    console.log('Chargement d\'un projet...');
    
    // Liste des projets sauvegardés
    const projects: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('story-project-')) {
        projects.push(key);
      }
    }
    
    if (projects.length === 0) {
      alert('Aucun projet sauvegardé trouvé');
      return;
    }
    
    // Interface de sélection améliorée
    const projectList = projects.map((key, index) => {
      try {
        const projectData = localStorage.getItem(key);
        if (projectData) {
          const project = JSON.parse(projectData);
          const date = new Date(project.metadata.updatedAt).toLocaleDateString();
          return `${index + 1}. ${project.name} (${date})`;
        }
      } catch (error) {
        return `${index + 1}. Projet corrompu`;
      }
      return `${index + 1}. Projet invalide`;
    }).join('\n');
    
    const choice = prompt(
      `Projets sauvegardés :\n\n${projectList}\n\nEntrez le numéro du projet à charger :`
    );
    
    const projectIndex = parseInt(choice || '') - 1;
    
    if (projectIndex >= 0 && projectIndex < projects.length) {
      const projectKey = projects[projectIndex];
      const projectData = localStorage.getItem(projectKey);
      if (projectData) {
        try {
          const project = JSON.parse(projectData);
          console.log('Projet chargé:', project);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Projet chargé', {
              body: `Le projet "${project.name}" a été chargé`,
              icon: '/favicon.ico'
            });
          } else {
            alert(`Projet chargé: ${project.name}`);
          }
        } catch (error) {
          alert('Erreur lors du chargement du projet');
        }
      }
    }
  };

  const handleExport = async (format: string, options: ExportOptions) => {
    console.log('Export au format:', format, 'avec options:', options);
    setExportStatus('Export en cours...');
    
    try {
      // Récupérer les données de l'éditeur
      // Pour cette démo, on simule des données vides
      // Dans la vraie implémentation, ces données viendraient de StoryEditor
      const nodes: any[] = [];
      const edges: any[] = [];
      
      if (nodes.length === 0) {
        alert('Aucune histoire à exporter. Créez d\'abord des nœuds dans l\'éditeur.');
        setExportStatus(null);
        return;
      }

      // Effectuer l'export
      const result = await StoryExporter.exportStory(nodes, edges, options);
      
      if (result.success && result.data) {
        // Télécharger le fichier
        StoryExporter.downloadExport(result);
        
        // Afficher les statistiques
        const statsMessage = `✅ Export réussi !\n\n` +
          `📊 Statistiques :\n` +
          `• Fichier: ${result.filename}\n` +
          `• Taille: ${(result.stats.fileSize / 1024).toFixed(2)} KB\n` +
          `• Nœuds: ${result.stats.totalNodes}\n` +
          `• Choix: ${result.stats.totalChoices}`;
        
        console.log(statsMessage);
        
        if (result.warnings.length > 0) {
          console.warn('Avertissements:', result.warnings);
        }
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Export terminé', {
            body: `Fichier ${result.filename} téléchargé`,
            icon: '/favicon.ico'
          });
        } else {
          alert(statsMessage);
        }
        
      } else {
        const errorMessage = result.errors.length > 0 
          ? `Erreurs d'export :\n\n${result.errors.join('\n')}`
          : 'Erreur inconnue lors de l\'export';
        
        alert(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Erreur d\'export:', error);
      alert(`Erreur lors de l'export :\n\n${error}`);
    } finally {
      setExportStatus(null);
    }
  };

  // Demander permission pour les notifications
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="h-screen">
      {/* Status d'export */}
      {exportStatus && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {exportStatus}
        </div>
      )}

      <StoryEditor
        onSave={handleSave}
        onLoad={handleLoad}
        onExport={() => setIsExportModalOpen(true)}
      />

      {/* Modal d'export */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}