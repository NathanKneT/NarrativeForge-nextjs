'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Upload, Download, Trash2, Clock, BarChart3 } from 'lucide-react';
import { SaveData } from '@/types/story';
import { SaveManager } from '@/lib/saveManager';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  onSave: (saveName: string) => void;
  onLoad: (saveData: SaveData) => void;
  currentProgress?: number;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSave,
  onLoad,
  currentProgress = 0,
}) => {
  const [saves, setSaves] = useState<SaveData[]>([]);
  const [newSaveName, setNewSaveName] = useState('');
  const [selectedSave, setSelectedSave] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les sauvegardes
  useEffect(() => {
    if (isOpen) {
      loadSaves();
    }
  }, [isOpen]);

  const loadSaves = () => {
    try {
      const allSaves = SaveManager.getAllSaves();
      setSaves(allSaves);
      setError(null);
    } catch (error) {
      setError('Erreur lors du chargement des sauvegardes');
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!newSaveName.trim()) {
      setError('Veuillez entrer un nom de sauvegarde');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(newSaveName);
      setNewSaveName('');
      loadSaves(); // Recharger la liste
      setError(null);
    } catch (error) {
      setError('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = (save: SaveData) => {
    setIsLoading(true);
    try {
      onLoad(save);
      onClose();
    } catch (error) {
      setError('Erreur lors du chargement');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (saveId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) {
      try {
        SaveManager.deleteSave(saveId);
        loadSaves();
        setSelectedSave(null);
      } catch (error) {
        console.error(error);
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleExport = () => {
    try {
      const data = SaveManager.exportSaves();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asylum-saves-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setError('Erreur lors de l\'exportation');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const importedCount = await SaveManager.importSaves(jsonData);
        loadSaves();
        alert(`${importedCount} sauvegardes importées avec succès !`);
      } catch (error) {
        console.error(error);
        setError('Fichier invalide ou corrompu');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'save' ? 'Sauvegarder' : 'Charger'} la partie
            </h2>
            <div className="flex gap-2">
              {/* Boutons d'export/import */}
              <button
                onClick={handleExport}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Exporter les sauvegardes"
              >
                <Download size={20} />
              </button>
              <label className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer" title="Importer des sauvegardes">
                <Upload size={20} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {/* Save section (mode save only) */}
          {mode === 'save' && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-3">Nouvelle sauvegarde</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSaveName}
                  onChange={(e) => setNewSaveName(e.target.value)}
                  placeholder="Nom de la sauvegarde"
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button
                  onClick={handleSave}
                  disabled={isLoading || !newSaveName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-300 flex items-center gap-2">
                <BarChart3 size={16} />
                Progression actuelle: {currentProgress} scènes visitées
              </div>
            </div>
          )}

          {/* Saves list */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-3">
              Sauvegardes existantes ({saves.length})
            </h3>
            
            {saves.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Save size={48} className="mx-auto mb-4 opacity-50" />
                <p>Aucune sauvegarde trouvée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {saves.map((save) => (
                  <motion.div
                    key={save.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 bg-gray-700 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedSave === save.id
                        ? 'border-blue-500 bg-gray-600'
                        : 'border-transparent hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedSave(save.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{save.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(save.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 size={14} />
                            {save.storyProgress} scènes
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {mode === 'load' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoad(save);
                            }}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                          >
                            Charger
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(save.id);
                          }}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-between items-center text-sm text-gray-400">
            <span>
              {SaveManager.getSaveStats().totalSaves} sauvegarde(s) • {SaveManager.getSaveStats().totalSizeKB} KB
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};