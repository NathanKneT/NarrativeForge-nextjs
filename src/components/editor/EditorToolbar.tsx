'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Save, 
  FolderOpen, 
  Download, 
  Play, 
  Settings,
  FileText,
  Circle,
  Square,
  Shuffle,
  Home,
} from 'lucide-react';
import { StoryProject } from '@/types/editor';

interface EditorToolbarProps {
  onCreateNode: (type: 'start' | 'story' | 'end', position?: { x: number; y: number }) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject?: () => void;
  onExportProject?: (format: string) => void;
  onAutoArrange: () => void;
  onTestStory: () => void;
  currentProject: StoryProject | null;
  nodes: any[];
  edges: any[];
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onCreateNode,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onExportProject,
  onAutoArrange,
  onTestStory,
  currentProject,
  nodes,
  edges,
}) => {
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTestError, setShowTestError] = useState(false);

  // Validation pour le test
  const validateStoryForTest = () => {
    const errors: string[] = [];
    
    // Vérifier qu'il y a au moins un nœud de début
    const startNodes = nodes.filter(node => node.data?.nodeType === 'start');
    if (startNodes.length === 0) {
      errors.push('Il faut au moins un nœud de début');
    }
    if (startNodes.length > 1) {
      errors.push('Il ne peut y avoir qu\'un seul nœud de début');
    }
    
    // Vérifier qu'il y a au moins un nœud de fin
    const endNodes = nodes.filter(node => node.data?.nodeType === 'end');
    if (endNodes.length === 0) {
      errors.push('Il faut au moins un nœud de fin');
    }
    
    // Vérifier que tous les nœuds (sauf fin) ont des connexions sortantes
    nodes.forEach(node => {
      if (node.data?.nodeType !== 'end') {
        const hasOutgoingConnection = edges.some(edge => edge.source === node.id);
        if (!hasOutgoingConnection) {
          errors.push(`Le nœud "${node.data?.storyNode?.title || node.id}" n'a pas de connexion sortante`);
        }
      }
    });
    
    // Vérifier que tous les nœuds (sauf début) ont des connexions entrantes
    nodes.forEach(node => {
      if (node.data?.nodeType !== 'start') {
        const hasIncomingConnection = edges.some(edge => edge.target === node.id);
        if (!hasIncomingConnection) {
          errors.push(`Le nœud "${node.data?.storyNode?.title || node.id}" n'est pas accessible`);
        }
      }
    });
    
    return errors;
  };

  const handleTestStory = () => {
    const errors = validateStoryForTest();
    
    if (errors.length > 0) {
      // Afficher les erreurs
      const errorMessage = "Impossible de tester l'histoire :\n\n" + errors.join('\n');
      alert(errorMessage);
      return;
    }
    
    // Si pas d'erreurs, lancer le test
    onTestStory();
  };

  const nodeTypes = [
    { type: 'start' as const, label: 'Début', icon: Circle, color: 'text-green-400' },
    { type: 'story' as const, label: 'Scène', icon: FileText, color: 'text-blue-400' },
    { type: 'end' as const, label: 'Fin', icon: Square, color: 'text-red-400' },
  ];

  const exportFormats = [
    { format: 'asylum-json', label: 'Asylum JSON', description: 'Compatible avec votre jeu' },
    { format: 'json', label: 'JSON Standard', description: 'Format générique' },
    { format: 'twine', label: 'Twine', description: 'Compatible Twine' },
  ];

  const handleCreateNode = (type: 'start' | 'story' | 'end') => {
    // Créer le nœud au centre de la vue
    onCreateNode(type, { x: Math.random() * 300 + 200, y: Math.random() * 200 + 100 });
    setShowNodeMenu(false);
  };

  const handleExport = (format: string) => {
    onExportProject?.(format);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Navigation + Project Actions */}
        <div className="flex items-center gap-4">
          {/* Navigation Home */}
          <Link
            href="/"
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            title="Retour au jeu"
          >
            <Home size={16} />
            Jeu
          </Link>

          <div className="h-6 w-px bg-gray-600" />

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Story Editor</h1>
            {currentProject && (
              <span className="text-sm text-gray-400">
                - {currentProject.name}
              </span>
            )}
          </div>

          <div className="h-6 w-px bg-gray-600" />

          <div className="flex items-center gap-2">
            <button
              onClick={onNewProject}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Nouveau projet"
            >
              <Plus size={16} />
              Nouveau
            </button>

            <button
              onClick={onSaveProject}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Sauvegarder"
            >
              <Save size={16} />
              Sauvegarder
            </button>

            <button
              onClick={onLoadProject}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Charger"
            >
              <FolderOpen size={16} />
              Charger
            </button>
          </div>
        </div>

        {/* Center Section - Node Creation */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNodeMenu(!showNodeMenu)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Ajouter Nœud
            </button>

            {showNodeMenu && (
              <div className="absolute top-full left-0 mt-2 bg-gray-700 rounded-lg shadow-xl p-2 min-w-[200px] z-10">
                {nodeTypes.map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => handleCreateNode(type)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-600 rounded transition-colors text-white"
                  >
                    <Icon size={18} className={color} />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-400">
                        {type === 'start' && 'Point de départ de l\'histoire'}
                        {type === 'story' && 'Scène narrative avec choix'}
                        {type === 'end' && 'Fin de l\'histoire'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onAutoArrange}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            title="Auto-arrangement"
          >
            <Shuffle size={16} />
            Arranger
          </button>
        </div>

        {/* Right Section - Export & Tools */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Exporter
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-gray-700 rounded-lg shadow-xl p-2 min-w-[250px] z-10">
                {exportFormats.map(({ format, label, description }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full flex flex-col items-start px-3 py-2 text-left hover:bg-gray-600 rounded transition-colors text-white"
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-400">{description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-600" />

          <button
            onClick={handleTestStory}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            title="Tester l'histoire"
          >
            <Play size={16} />
            Tester
          </button>

          <button
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            title="Paramètres"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {currentProject && (
        <div className="mt-3 flex items-center gap-6 text-sm text-gray-400">
          <span>Créé: {currentProject.metadata.createdAt.toLocaleDateString()}</span>
          <span>Modifié: {currentProject.metadata.updatedAt.toLocaleDateString()}</span>
          <span>Version: {currentProject.metadata.version}</span>
        </div>
      )}
    </div>
  );
};